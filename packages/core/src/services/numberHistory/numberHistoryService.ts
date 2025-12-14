import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {groupBy} from 'lodash';

import type {
  LottoDraw,
  LottoDrawRepository,
  LottoDrawResult,
  LottoDrawResultRepository,
} from '@lotto/database';
import type {LottoType, SubscriptionTierCode} from '@lotto/shared';

import {calculateWilsonConfidenceInterval, enforceMinDate, hasFeature} from '@lotto/shared';
import type {
  ConfidenceIntervalDto,
  DeviationAnalysisDto,
  DrawOccurrence,
  NumberHistoryRequestDto,
  NumberHistoryResponseDto,
} from '../../models';
import {calculateLotteryTheoreticalProbability} from '../../utils';
import {getLotteryConfig} from '../lottoProbability/helpers/lotteryConfigs';

import {
  buildAppearanceSequence,
  buildTimeline,
  calculateAutocorrelation,
  calculateConfidenceIntervalDto,
  calculateDeviationAnalysis,
  calculateMarkovChain,
  calculateNumberSummary,
  calculateTrendAnalysis,
} from './utils';

@injectable({scope: BindingScope.TRANSIENT})
export class NumberHistoryService {
  constructor(
    @inject('repositories.LottoDrawRepository')
    protected lottoDrawRepository: LottoDrawRepository,
    @inject('repositories.LottoDrawResultRepository')
    protected lottoDrawResultRepository: LottoDrawResultRepository,
  ) {}

  /**
   * Get historical data for a specific number within a date range
   *
   * @param request - Request containing number, lottery type, and date range
   * @param subscriptionTier - User's subscription tier for feature gating
   * @returns Historical data with statistics and all draw occurrences
   */
  async getNumberHistory(
    request: NumberHistoryRequestDto,
    subscriptionTier: SubscriptionTierCode,
  ): Promise<NumberHistoryResponseDto> {
    const {lottoType, number, dateFrom, dateTo, useSecondaryNumbers, position} = request;

    // Validate inputs
    this.validateRequest(request);

    // Enforce date range based on subscription tier
    const enforcedDateFrom = enforceMinDate(dateFrom, subscriptionTier);

    // Convert dates once and cache timestamps
    const startDate = new Date(enforcedDateFrom);
    const endDate = new Date(dateTo);
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    // Fetch all required data in parallel
    const [drawsWithNumber, totalDraws, allDrawsInPeriod] = await this.fetchDrawData(
      lottoType,
      startDate,
      endDate,
      number,
      position,
      useSecondaryNumbers,
    );

    // Build occurrences with parsed numbers
    const occurrences = await this.buildOccurrences(drawsWithNumber, number);

    // Calculate theoretical probability
    const config = getLotteryConfig(lottoType as LottoType);
    const theoreticalProb = calculateLotteryTheoreticalProbability(config, useSecondaryNumbers);
    const frequency = totalDraws.count > 0 ? drawsWithNumber.length / totalDraws.count : 0;

    // Calculate Wilson CI at root level - reused by summary, CI DTO, and deviation analysis
    const wilsonCI = calculateWilsonConfidenceInterval(
      drawsWithNumber.length,
      totalDraws.count,
      0.95,
    );

    // Calculate summary
    const summary = calculateNumberSummary(
      number,
      drawsWithNumber.length,
      totalDraws.count,
      theoreticalProb,
      wilsonCI,
    );

    // Build appearance sequence once for all analyses
    const appearanceSequence = buildAppearanceSequence(allDrawsInPeriod, drawsWithNumber);

    // PRO+ tier feature: Trend analysis
    const trends = hasFeature(subscriptionTier, 'TRENDS')
      ? calculateTrendAnalysis(
          occurrences,
          appearanceSequence,
          startTime,
          endTime,
          totalDraws.count,
          theoreticalProb,
        )
      : undefined;

    // PRO+ tier features: Wilson CI and Deviation analysis
    let confidenceInterval: ConfidenceIntervalDto | undefined;
    let deviation: DeviationAnalysisDto | undefined;

    if (hasFeature(subscriptionTier, 'WILSON_CI')) {
      // Reuse Wilson CI from summary calculation (no duplicate computation)
      confidenceInterval = calculateConfidenceIntervalDto(wilsonCI);
    }

    if (hasFeature(subscriptionTier, 'STD_DEVIATION')) {
      deviation = calculateDeviationAnalysis(frequency, theoreticalProb, confidenceInterval);
    }

    // PREMIUM tier features: Autocorrelation and Markov Chain analysis
    const autocorrelation = hasFeature(subscriptionTier, 'AUTOCORRELATION')
      ? calculateAutocorrelation(appearanceSequence)
      : undefined;

    const markovChain = hasFeature(subscriptionTier, 'MARKOV_CHAIN')
      ? calculateMarkovChain(appearanceSequence, theoreticalProb)
      : undefined;

    // PRO+ tier feature: Timeline showing all draws with appearance flag
    const timeline = hasFeature(subscriptionTier, 'TIMELINE')
      ? buildTimeline(allDrawsInPeriod, drawsWithNumber)
      : undefined;

    return {
      summary,
      trends,
      confidenceInterval,
      deviation,
      autocorrelation,
      markovChain,
      occurrences,
      timeline,
      periodStart: enforcedDateFrom,
      periodEnd: dateTo,
    };
  }

  /**
   * Fetch all draw data in parallel
   */
  private async fetchDrawData(
    lottoType: string,
    startDate: Date,
    endDate: Date,
    number: number,
    position?: number,
    useSecondaryNumbers?: boolean,
  ) {
    return Promise.all([
      // Draws containing this number
      this.lottoDrawRepository.findDrawsWithNumber(
        number.toString(),
        lottoType,
        startDate,
        endDate,
        position,
        useSecondaryNumbers,
      ),
      // Total draws in period
      this.lottoDrawRepository.count({
        and: [{gameTypeName: lottoType}, {drawDate: {gte: startDate}}, {drawDate: {lte: endDate}}],
      }),
      // All draws in period (for statistical analysis)
      this.lottoDrawRepository.find({
        where: {
          and: [
            {gameTypeName: lottoType},
            {drawDate: {gte: startDate}},
            {drawDate: {lte: endDate}},
          ],
        },
        order: ['drawDate ASC'],
      }),
    ]);
  }

  /**
   * Build occurrence objects with parsed numbers
   */
  private async buildOccurrences(
    drawsWithNumber: LottoDraw[],
    searchNumber: number,
  ): Promise<DrawOccurrence[]> {
    if (drawsWithNumber.length === 0) {
      return [];
    }

    // Fetch all results in bulk to avoid N+1 queries
    const drawIds = drawsWithNumber.map(draw => draw.id);
    const allDrawResults = await this.lottoDrawResultRepository.find({
      where: {drawId: {inq: drawIds}},
      order: ['drawId ASC', 'winClass ASC'],
    });

    // Group results by draw ID using lodash
    const resultsByDrawId = groupBy(allDrawResults, 'drawId');

    // Build occurrences
    return drawsWithNumber.map(draw =>
      this.buildSingleOccurrence(draw, resultsByDrawId, searchNumber),
    );
  }

  /**
   * Build a single occurrence object with parsed numbers
   * Optimized to minimize string operations and array allocations
   */
  private buildSingleOccurrence(
    draw: LottoDraw,
    resultsByDrawId: Record<LottoDrawResult['drawId'], LottoDrawResult[]>,
    searchNumber: number,
  ): DrawOccurrence {
    const drawResults = resultsByDrawId[draw.id] || [];

    const primaryNumbers: number[] = [];
    const secondaryNumbers: number[] = [];
    let foundPosition: number | undefined;

    for (const result of drawResults) {
      // Parse primary numbers
      if (result.winningNumber) {
        // Split and parse in one pass to avoid intermediate array
        const parts = result.winningNumber.split(',');
        for (let i = 0; i < parts.length; i++) {
          const num = Number.parseInt(parts[i], 10);
          primaryNumbers.push(num);
          if (num === searchNumber && foundPosition === undefined) {
            foundPosition = result.winClass ?? undefined;
          }
        }
      }

      // Parse secondary numbers
      if (result.secWinningNumber) {
        const parts = result.secWinningNumber.split(',');
        for (let i = 0; i < parts.length; i++) {
          const num = Number.parseInt(parts[i], 10);
          secondaryNumbers.push(num);
          if (num === searchNumber && foundPosition === undefined) {
            foundPosition = result.winClass ?? undefined;
          }
        }
      }
    }

    return {
      drawId: draw.id,
      drawDate: draw.drawDate,
      drawLabel: draw.drawLabel,
      allNumbers: primaryNumbers,
      secondaryNumbers: secondaryNumbers.length > 0 ? secondaryNumbers : undefined,
      position: foundPosition,
    };
  }

  /**
   * Validate request parameters
   *
   * @param request - Request to validate
   * @throws HttpErrors.BadRequest if validation fails
   */
  private validateRequest(request: Pick<NumberHistoryRequestDto, 'dateFrom' | 'dateTo'>): void {
    const {dateFrom, dateTo} = request;

    // Validate dates
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);

    if (Number.isNaN(startDate.getTime())) {
      throw new HttpErrors.BadRequest(`Invalid start date: ${dateFrom}`);
    }

    if (Number.isNaN(endDate.getTime())) {
      throw new HttpErrors.BadRequest(`Invalid end date: ${dateTo}`);
    }

    if (startDate > endDate) {
      throw new HttpErrors.BadRequest('Start date must be before or equal to end date');
    }

    // Validate date range (max 10 years for performance)
    const maxRangeMs = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years in milliseconds
    if (endDate.getTime() - startDate.getTime() > maxRangeMs) {
      throw new HttpErrors.BadRequest('Date range cannot exceed 10 years');
    }
  }
}
