import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {groupBy} from 'lodash';

import {FrequencyStatus, LottoType} from '../../common/types';
import {LottoDraw} from '../../models';
import {
  DrawOccurrence,
  NumberHistoryRequestDto,
  NumberHistoryResponseDto,
  NumberHistorySummary,
  TrendAnalysis,
} from '../../models/LottoNumbers';
import {LottoDrawRepository, LottoDrawResultRepository} from '../../repositories';
import {
  calculateTheoreticalProbability,
  getLotteryConfig,
} from '../lottoProbability/helpers/lotteryConfigs';
import {calculateWilsonConfidenceInterval} from '../lottoProbability/helpers/wilsonConfidenceInterval';

import {calculateAutocorrelation, calculateMarkovChain} from './utils/statisticalAnalysis';

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
   * @returns Historical data with statistics and all draw occurrences
   */
  async getNumberHistory(request: NumberHistoryRequestDto): Promise<NumberHistoryResponseDto> {
    const {lottoType, number, dateFrom, dateTo, useSecondaryNumbers, position} = request;

    // Validate inputs
    this.validateRequest(request);

    // Convert dates once and cache timestamps
    const startDate = new Date(dateFrom);
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
    );

    // Build occurrences with parsed numbers
    const occurrences = await this.buildOccurrences(drawsWithNumber, number);

    // Calculate statistics
    const config = getLotteryConfig(lottoType as LottoType);
    const theoreticalProb = calculateTheoreticalProbability(config, useSecondaryNumbers);

    const summary = this.calculateSummary(
      number,
      drawsWithNumber.length,
      totalDraws.count,
      theoreticalProb,
    );

    // Build appearance sequence once for both statistical analyses
    const appearanceSequence = this.buildAppearanceSequence(allDrawsInPeriod, drawsWithNumber);

    // Calculate all analyses
    const trends = this.calculateTrendAnalysis(
      occurrences,
      startTime,
      endTime,
      totalDraws.count,
      theoreticalProb,
    );

    const autocorrelation = calculateAutocorrelation(appearanceSequence);
    const markovChain = calculateMarkovChain(appearanceSequence, theoreticalProb);

    return {
      summary,
      trends,
      autocorrelation,
      markovChain,
      occurrences,
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
  ) {
    return Promise.all([
      // Draws containing this number
      this.lottoDrawRepository.findDrawsWithNumber(
        number.toString(),
        lottoType,
        startDate,
        endDate,
        position,
      ),
      // Total draws in period
      this.lottoDrawRepository.count({
        and: [
          {gameTypeName: lottoType},
          {drawDate: {gte: startDate}},
          {drawDate: {lte: endDate}},
        ],
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
      this.buildSingleOccurrence(draw, resultsByDrawId, searchNumber)
    );
  }

  /**
   * Build a single occurrence object with parsed numbers
   * Optimized to minimize string operations and array allocations
   */
  private buildSingleOccurrence(
    draw: LottoDraw,
    resultsByDrawId: Record<string, Array<Awaited<ReturnType<typeof this.lottoDrawResultRepository.find>>[number]>>,
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
          const num = parseInt(parts[i], 10);
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
          const num = parseInt(parts[i], 10);
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
      drawLabel: draw.drawLabel ?? undefined,
      allNumbers: primaryNumbers,
      secondaryNumbers: secondaryNumbers.length > 0 ? secondaryNumbers : undefined,
      position: foundPosition,
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(
    number: number,
    appearanceCount: number,
    totalDraws: number,
    theoreticalProb: number,
  ): NumberHistorySummary {
    const frequency = totalDraws > 0 ? appearanceCount / totalDraws : 0;
    const frequencyPercent = frequency * 100;
    const expectedFrequencyPercent = theoreticalProb * 100;
    const deviationPercent = frequencyPercent - expectedFrequencyPercent;

    // Calculate Wilson confidence interval for statistical significance
    const confidenceInterval = calculateWilsonConfidenceInterval(
      appearanceCount,
      totalDraws,
      0.95,
    );

    // Determine status
    let status: FrequencyStatus = 'normal';
    if (theoreticalProb < confidenceInterval.lower) {
      status = 'frequent';
    } else if (theoreticalProb > confidenceInterval.upper) {
      status = 'rare';
    }

    return {
      number,
      totalDraws,
      appearanceCount,
      frequencyPercent: Math.round(frequencyPercent * 100) / 100,
      expectedFrequencyPercent: Math.round(expectedFrequencyPercent * 100) / 100,
      deviationPercent: Math.round(deviationPercent * 100) / 100,
      status,
    };
  }

  /**
   * Calculate trend analysis for the number
   *
   * @param occurrences - All occurrences of the number
   * @param startTime - Period start timestamp
   * @param endTime - Period end timestamp
   * @param totalDraws - Total number of draws in period
   * @param theoreticalProb - Theoretical probability per draw
   * @returns Trend analysis data
   */
  private calculateTrendAnalysis(
    occurrences: DrawOccurrence[],
    startTime: number,
    endTime: number,
    totalDraws: number,
    theoreticalProb: number,
  ): TrendAnalysis {
    const MS_PER_DAY = 86400000; // 1000 * 60 * 60 * 24
    const STREAK_THRESHOLD_DAYS = 7;

    // Sort occurrences by date (oldest first) - sort in place for performance
    occurrences.sort((a, b) => a.drawDate.getTime() - b.drawDate.getTime());

    const len = occurrences.length;

    // Calculate droughts (days between appearances)
    let longestDroughtDays = 0;
    let currentDroughtDays = 0;
    let droughtSum = 0;
    let droughtCount = 0;

    if (len === 0) {
      // No appearances at all
      currentDroughtDays = Math.floor((endTime - startTime) / MS_PER_DAY);
      longestDroughtDays = currentDroughtDays;
    } else {
      // Cache timestamps for performance
      const timestamps = occurrences.map(occ => occ.drawDate.getTime());

      // Calculate gaps between consecutive appearances
      for (let i = 1; i < len; i++) {
        const daysDiff = Math.floor((timestamps[i] - timestamps[i - 1]) / MS_PER_DAY);
        droughtSum += daysDiff;
        droughtCount++;
        longestDroughtDays = Math.max(longestDroughtDays, daysDiff);
      }

      // Current drought (since last appearance)
      currentDroughtDays = Math.floor((endTime - timestamps[len - 1]) / MS_PER_DAY);
    }

    // Calculate average days between appearances
    const averageDaysBetweenAppearances =
      droughtCount > 0 ? Math.round(droughtSum / droughtCount) : 0;

    // Calculate streaks (consecutive draws with the number)
    let currentStreak = 0;
    let longestStreak = 0;

    if (len > 0) {
      const timestamps = occurrences.map(occ => occ.drawDate.getTime());
      let tempStreak = 1;

      // Calculate longest streak
      for (let i = 1; i < len; i++) {
        const daysDiff = Math.floor((timestamps[i] - timestamps[i - 1]) / MS_PER_DAY);

        if (daysDiff <= STREAK_THRESHOLD_DAYS) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      // Current streak: check from the end backwards
      currentStreak = 1;
      for (let i = len - 2; i >= 0; i--) {
        const daysDiff = Math.floor((timestamps[i + 1] - timestamps[i]) / MS_PER_DAY);
        if (daysDiff <= STREAK_THRESHOLD_DAYS) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate time series (monthly aggregates)
    const timeSeries = this.calculateTimeSeries(
      occurrences,
      startTime,
      endTime,
      totalDraws,
      theoreticalProb,
    );

    return {
      longestDroughtDays,
      currentDroughtDays,
      averageDaysBetweenAppearances,
      currentStreak,
      longestStreak,
      timeSeries,
    };
  }

  /**
   * Calculate monthly time series data
   *
   * @param occurrences - All occurrences sorted by date
   * @param startTime - Period start timestamp
   * @param endTime - Period end timestamp
   * @param totalDraws - Total draws in period
   * @param theoreticalProb - Theoretical probability
   * @returns Monthly time series data
   */
  private calculateTimeSeries(
    occurrences: DrawOccurrence[],
    startTime: number,
    endTime: number,
    totalDraws: number,
    theoreticalProb: number,
  ): Array<{month: string; appearances: number; expectedAppearances: number}> {
    // Use plain object instead of Map for better performance
    const monthlyData: Record<string, {appearances: number; expectedAppearances: number}> = {};

    // Initialize all months in the range
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const endYear = endDate.getFullYear();
    const endMonth = endDate.getMonth();

    // Calculate total months
    const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth) + 1;
    const expectedPerMonth = totalMonths > 0 ? (totalDraws * theoreticalProb) / totalMonths : 0;
    const roundedExpected = Math.round(expectedPerMonth * 100) / 100;

    // Initialize months
    let year = startYear;
    let month = startMonth;
    for (let i = 0; i < totalMonths; i++) {
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = {appearances: 0, expectedAppearances: roundedExpected};

      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }

    // Count appearances per month
    for (const occurrence of occurrences) {
      const date = occurrence.drawDate;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const data = monthlyData[monthKey];
      if (data) {
        data.appearances++;
      }
    }

    // Convert to sorted array
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        appearances: data.appearances,
        expectedAppearances: data.expectedAppearances,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Validate request parameters
   *
   * @param request - Request to validate
   * @throws HttpErrors.BadRequest if validation fails
   */
  private validateRequest(request: NumberHistoryRequestDto): void {
    const {lottoType, number, dateFrom, dateTo, position} = request;

    // Validate dates
    const startDate = new Date(dateFrom);
    const endDate = new Date(dateTo);

    if (isNaN(startDate.getTime())) {
      throw new HttpErrors.BadRequest(`Invalid start date: ${dateFrom}`);
    }

    if (isNaN(endDate.getTime())) {
      throw new HttpErrors.BadRequest(`Invalid end date: ${dateTo}`);
    }

    if (startDate > endDate) {
      throw new HttpErrors.BadRequest(
        'Start date must be before or equal to end date',
      );
    }

    // Validate date range (max 10 years for performance)
    const maxRangeMs = 10 * 365 * 24 * 60 * 60 * 1000; // 10 years in milliseconds
    if (endDate.getTime() - startDate.getTime() > maxRangeMs) {
      throw new HttpErrors.BadRequest(
        'Date range cannot exceed 10 years',
      );
    }

    // Validate number based on lottery type
    const config = getLotteryConfig(lottoType as LottoType);
    const minNumber = config.primaryRange.min;
    const maxNumber = config.primaryRange.max;

    if (number < minNumber || number > maxNumber) {
      throw new HttpErrors.BadRequest(
        `Number ${number} is out of range for ${lottoType}. Valid range: ${minNumber}-${maxNumber}`,
      );
    }

    // Validate position for positional games
    if (position !== undefined) {
      if (lottoType === 'JOKKER') {
        if (position < 0 || position >= 7) {
          throw new HttpErrors.BadRequest(
            `Position ${position} is invalid for JOKKER. Valid range: 0-6`,
          );
        }
      } else {
        throw new HttpErrors.BadRequest(
          `Position parameter is only valid for JOKKER lottery type`,
        );
      }
    }
  }

  /**
   * Build binary appearance sequence (1 = appeared, 0 = not appeared)
   *
   * @param allDraws - All draws in chronological order
   * @param drawsWithNumber - Draws where the number appeared
   * @returns Binary array representing appearance in each draw
   */
  private buildAppearanceSequence(
    allDraws: LottoDraw[],
    drawsWithNumber: LottoDraw[],
  ): number[] {
    // Create a set of draw IDs where the number appeared for O(1) lookup
    const appearedDrawIds = new Set(drawsWithNumber.map(draw => draw.id));

    // Build binary sequence
    return allDraws.map(draw => (appearedDrawIds.has(draw.id) ? 1 : 0));
  }
}
