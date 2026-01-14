import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {groupBy, keyBy} from 'lodash';

import type {
  LottoDraw,
  LottoDrawRepository,
  LottoDrawResult,
  LottoDrawResultRepository,
} from '@lotto/database';
import type {LottoType, SubscriptionTierCode} from '@lotto/shared';

import {
  MIN_DRAWS_FOR_STATISTICS,
  calculateWilsonConfidenceInterval,
  getDrawLimit,
  hasFeature,
} from '@lotto/shared';
import type {
  ConfidenceIntervalDto,
  DeviationAnalysisDto,
  DrawOccurrence,
  NumberDetailRequestDto,
  NumberDetailResponseDto,
} from '../../models';
import {calculateLotteryTheoreticalProbability} from '../../utils';
import {getLotteryConfig} from '../lottoProbability/helpers/lotteryConfigs';

import {
  buildAppearanceSequence,
  buildNumberSummary,
  buildTimeline,
  calculateAutocorrelation,
  calculateConfidenceIntervalDto,
  calculateDeviationAnalysis,
  calculateMarkovChain,
  calculateMonteCarloSimulation,
  calculatePairAnalysis,
  calculateSeasonalPatterns,
  calculateTrendAnalysis,
} from './utils';

@injectable({scope: BindingScope.TRANSIENT})
export class NumberDetailService {
  constructor(
    @inject('repositories.LottoDrawRepository')
    protected lottoDrawRepository: LottoDrawRepository,
    @inject('repositories.LottoDrawResultRepository')
    protected lottoDrawResultRepository: LottoDrawResultRepository,
  ) {}

  /**
   * Get detailed analysis for a specific number within a date range
   *
   * @param request - Request containing number, lottery type, and date range
   * @param subscriptionTier - User's subscription tier for feature gating
   * @returns Detailed analysis with statistics and all draw occurrences
   */
  async getNumberDetail(
    request: NumberDetailRequestDto,
    subscriptionTier: SubscriptionTierCode,
  ): Promise<NumberDetailResponseDto> {
    const {lottoType, number, dateFrom, dateTo, useSecondaryNumbers, position, winClass} = request;

    // Validate inputs
    this.validateRequest(request);

    // Convert dates once and cache timestamps
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);

    // Get draw limit based on subscription tier
    const drawLimit = getDrawLimit(subscriptionTier);

    // Fetch all required data in parallel (with limit applied to allDrawsInPeriod query)
    let [drawsWithNumber, totalDraws, allDrawsInPeriod] = await this.fetchDrawData(
      lottoType,
      startDate,
      endDate,
      number,
      position,
      useSecondaryNumbers,
      winClass,
      drawLimit,
    );

    // Filter drawsWithNumber to only include draws in the limited set (if limit was applied)
    if (drawLimit !== null) {
      const limitedDrawIds = new Set(allDrawsInPeriod.map(d => d.id));
      drawsWithNumber = drawsWithNumber.filter(d => limitedDrawIds.has(d.id));
      totalDraws = {count: allDrawsInPeriod.length};
    }

    const startTime = allDrawsInPeriod.length > 0 ? allDrawsInPeriod[0].drawDate.getTime() : startDate.getTime();
    const endTime = endDate.getTime();

    // Build occurrences with parsed numbers
    const occurrences = await this.buildOccurrences(drawsWithNumber, number);

    // Calculate theoretical probability
    const config = getLotteryConfig(lottoType as LottoType);
    const theoreticalProb = calculateLotteryTheoreticalProbability(
      config,
      useSecondaryNumbers,
      winClass,
    );
    const frequency = totalDraws.count > 0 ? drawsWithNumber.length / totalDraws.count : 0;

    // Calculate Wilson CI at root level - reused by summary, CI DTO, and deviation analysis
    const wilsonCI = calculateWilsonConfidenceInterval(
      drawsWithNumber.length,
      totalDraws.count,
      0.95,
    );

    // Create lookup of draw IDs where the number appeared for O(1) access
    const drawsWithNumberById = keyBy(drawsWithNumber, 'id');

    // Calculate last seen information
    const lastSeen = this.calculateLastSeenForNumber(
      allDrawsInPeriod,
      drawsWithNumber,
      drawsWithNumberById,
    );

    // Calculate summary
    const summary = buildNumberSummary(
      number,
      drawsWithNumber.length,
      totalDraws.count,
      theoreticalProb,
      wilsonCI,
      lastSeen,
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

    let confidenceInterval: ConfidenceIntervalDto | undefined;
    let deviation: DeviationAnalysisDto | undefined;

    // PRO+ tier features: Wilson CI
    if (hasFeature(subscriptionTier, 'WILSON_CI')) {
      confidenceInterval = calculateConfidenceIntervalDto(wilsonCI);
    }

    // PRO+ tier features: Deviation analysis
    if (hasFeature(subscriptionTier, 'STD_DEVIATION')) {
      deviation = calculateDeviationAnalysis(frequency, theoreticalProb, confidenceInterval);
    }

    // PRO+ tier feature: Timeline showing all draws with appearance flag
    const timeline = hasFeature(subscriptionTier, 'TIMELINE')
      ? buildTimeline(allDrawsInPeriod, drawsWithNumber)
      : undefined;

    // PREMIUM tier features: Autocorrelation
    const autocorrelation = hasFeature(subscriptionTier, 'AUTOCORRELATION')
      ? calculateAutocorrelation(appearanceSequence)
      : undefined;

    // PREMIUM tier features: Markov Chain analysis
    const markovChain = hasFeature(subscriptionTier, 'MARKOV_CHAIN')
      ? calculateMarkovChain(appearanceSequence, theoreticalProb)
      : undefined;

    // PREMIUM tier feature: Pair analysis
    const pairAnalysis = hasFeature(subscriptionTier, 'PAIR_ANALYSIS')
      ? await this.calculatePairAnalysisWithAllDraws(
          number,
          allDrawsInPeriod,
          drawsWithNumber,
          totalDraws.count,
          useSecondaryNumbers,
        )
      : undefined;

    // PREMIUM tier feature: Monte Carlo simulation
    const monteCarlo = hasFeature(subscriptionTier, 'MONTE_CARLO')
      ? calculateMonteCarloSimulation(drawsWithNumber.length, totalDraws.count, theoreticalProb)
      : undefined;

    // PREMIUM tier feature: Seasonal patterns
    const seasonalPatterns = hasFeature(subscriptionTier, 'SEASONAL_PATTERNS')
      ? calculateSeasonalPatterns(
          allDrawsInPeriod.map(draw => ({
            drawDate: draw.drawDate,
            hasSearchedNumber: Boolean(drawsWithNumberById[draw.id]),
          })),
        )
      : undefined;

    return {
      summary,
      trends,
      confidenceInterval,
      deviation,
      autocorrelation,
      markovChain,
      pairAnalysis,
      monteCarlo,
      seasonalPatterns,
      occurrences,
      timeline,
      periodStart: dateFrom,
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
    winClass?: number,
    limit?: number | null,
  ) {
    return Promise.all([
      // Draws containing this number (with limit)
      this.lottoDrawRepository.findDrawsWithNumber(
        number.toString(),
        lottoType,
        startDate,
        endDate,
        position,
        useSecondaryNumbers,
        winClass,
        limit,
      ),
      // Total draws in period (without limit for reference)
      this.lottoDrawRepository.count({
        and: [{gameTypeName: lottoType}, {drawDate: {gte: startDate}}, {drawDate: {lte: endDate}}],
      }),
      // All draws in period (with limit for tier restriction)
      this.lottoDrawRepository.find({
        where: {
          and: [
            {gameTypeName: lottoType},
            {drawDate: {gte: startDate}},
            {drawDate: {lte: endDate}},
          ],
        },
        order: ['drawDate DESC'], // Most recent first when using limit
        ...(limit !== null && limit !== undefined && {limit}),
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
   * Calculate last seen information for the searched number
   *
   * @param allDrawsInPeriod - All draws ordered by date ASC
   * @param drawsWithNumber - Draws where the number appeared
   * @param drawsWithNumberById - Pre-computed lookup for O(1) access
   * @returns LastSeenInput with drawsAgo and date
   */
  private calculateLastSeenForNumber(
    allDrawsInPeriod: LottoDraw[],
    drawsWithNumber: LottoDraw[],
    drawsWithNumberById: Record<string, LottoDraw>,
  ): {drawsAgo: number; date: string | null} {
    const totalDraws = allDrawsInPeriod.length;

    if (totalDraws === 0 || drawsWithNumber.length === 0) {
      // Number never appeared or no draws in period
      return {
        drawsAgo: totalDraws,
        date: null,
      };
    }

    // Iterate from the end (most recent) to find the most recent appearance
    for (let i = totalDraws - 1; i >= 0; i--) {
      const draw = allDrawsInPeriod[i];
      if (drawsWithNumberById[draw.id]) {
        // Found the most recent appearance
        // drawsAgo = number of draws after this one = (totalDraws - 1) - i
        return {
          drawsAgo: totalDraws - 1 - i,
          date: draw.drawDate.toISOString(),
        };
      }
    }

    // Number never appeared (shouldn't reach here if drawsWithNumber.length > 0)
    return {
      drawsAgo: totalDraws,
      date: null,
    };
  }

  /**
   * Calculate pair analysis with ALL draws in the period.
   * This correctly uses primary OR secondary numbers based on useSecondaryNumbers flag.
   *
   * @param searchNumber - The number being analyzed
   * @param allDrawsInPeriod - All draws in the period
   * @param drawsWithNumber - Draws where the searched number appeared
   * @param totalDrawsCount - Total number of draws
   * @param useSecondaryNumbers - Whether to analyze secondary numbers pool
   * @returns Pair analysis or undefined if insufficient data
   */
  private async calculatePairAnalysisWithAllDraws(
    searchNumber: number,
    allDrawsInPeriod: LottoDraw[],
    drawsWithNumber: LottoDraw[],
    totalDrawsCount: number,
    useSecondaryNumbers?: boolean,
  ) {
    // Early exit: check draw count before any expensive operations
    if (totalDrawsCount < MIN_DRAWS_FOR_STATISTICS) {
      return undefined;
    }

    // Fetch results for ALL draws in the period
    const allDrawIds = allDrawsInPeriod.map(draw => draw.id);
    const allDrawResults = await this.lottoDrawResultRepository.find({
      where: {drawId: {inq: allDrawIds}},
      order: ['drawId ASC', 'winClass ASC'],
    });

    // Group results by draw ID
    const resultsByDrawId = groupBy(allDrawResults, 'drawId');

    // Create a Set of draw IDs where the searched number appeared for O(1) lookup
    const drawsWithNumberIds = new Set(drawsWithNumber.map(d => d.id));

    // Build draw data for pair analysis using the CORRECT number pool
    const drawsData = allDrawsInPeriod.map(draw => {
      const drawResults = resultsByDrawId[draw.id] || [];
      const numbers: number[] = [];

      for (const result of drawResults) {
        // Use secondary numbers if useSecondaryNumbers is true, otherwise primary
        const numberSource = useSecondaryNumbers ? result.secWinningNumber : result.winningNumber;

        if (numberSource) {
          const parts = numberSource.split(',');
          for (const part of parts) {
            const num = Number.parseInt(part, 10);
            if (!Number.isNaN(num)) {
              numbers.push(num);
            }
          }
        }
      }

      return {
        numbers,
        hasSearchedNumber: drawsWithNumberIds.has(draw.id),
      };
    });

    return calculatePairAnalysis(searchNumber, drawsData, totalDrawsCount);
  }

  /**
   * Validate request parameters
   *
   * @param request - Request to validate
   * @throws HttpErrors.BadRequest if validation fails
   */
  private validateRequest(request: Pick<NumberDetailRequestDto, 'dateFrom' | 'dateTo'>): void {
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
