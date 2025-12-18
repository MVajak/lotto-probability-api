import {getISODay, getMonth} from 'date-fns';

import {MIN_DRAWS_FOR_SEASONAL} from '@lotto/shared';

import type {SeasonalPatterns} from '../../../models';

import {
  CHI_SQUARE_CRITICAL_6_DF,
  CHI_SQUARE_CRITICAL_11_DF,
  MIN_DAY_SAMPLES,
  MIN_MONTH_SAMPLES,
} from './constants';

interface DrawWithDate {
  drawDate: Date;
  hasSearchedNumber: boolean;
}

interface PeriodStats {
  appearances: number;
  totalDraws: number;
}

/**
 * Calculate seasonal patterns analyzing frequency by day of week and month.
 *
 * Uses chi-square goodness of fit test to identify statistically significant
 * patterns in when the number appears.
 *
 * @param draws - Array of draws with dates and whether searched number appeared
 * @returns Seasonal pattern analysis or undefined if insufficient data
 */
export function calculateSeasonalPatterns(draws: DrawWithDate[]): SeasonalPatterns | undefined {
  if (draws.length < MIN_DRAWS_FOR_SEASONAL) {
    return undefined;
  }

  // Initialize stats: index 1-7 for days (ISO), 1-12 for months
  const dayStats: PeriodStats[] = Array.from({length: 8}, () => ({appearances: 0, totalDraws: 0}));
  const monthStats: PeriodStats[] = Array.from({length: 13}, () => ({
    appearances: 0,
    totalDraws: 0,
  }));

  // Single pass to collect all stats
  let totalAppearances = 0;
  for (const draw of draws) {
    const dayOfWeek = getISODay(draw.drawDate); // 1=Monday, 7=Sunday
    const month = getMonth(draw.drawDate) + 1; // date-fns returns 0-11

    dayStats[dayOfWeek].totalDraws++;
    monthStats[month].totalDraws++;

    if (draw.hasSearchedNumber) {
      dayStats[dayOfWeek].appearances++;
      monthStats[month].appearances++;
      totalAppearances++;
    }
  }

  const overallFrequency = totalAppearances / draws.length;

  // Build results arrays and calculate chi-square in one pass each
  const byDayOfWeek = buildPeriodResults(dayStats, 1, 7, 'dayOfWeek');
  const byMonth = buildPeriodResults(monthStats, 1, 12, 'month');

  // Chi-square tests
  const dayChiSquare = calculateChiSquare(byDayOfWeek, overallFrequency);
  const monthChiSquare = calculateChiSquare(byMonth, overallFrequency);

  const hasDayPattern = dayChiSquare > CHI_SQUARE_CRITICAL_6_DF;
  const hasMonthPattern = monthChiSquare > CHI_SQUARE_CRITICAL_11_DF;

  // Find best period only if patterns exist (optimization: skip if no patterns)
  const bestPeriod = findBestPeriod(byDayOfWeek, byMonth, hasDayPattern, hasMonthPattern);

  // Determine interpretation
  const interpretation = getInterpretation(hasDayPattern, hasMonthPattern);

  return {
    byDayOfWeek,
    byMonth,
    bestPeriod,
    interpretation,
  };
}

/**
 * Generic function to build period results for both day of week and month.
 * Eliminates code duplication between buildDayOfWeekResults and buildMonthResults.
 */
function buildPeriodResults<T extends 'dayOfWeek' | 'month'>(
  stats: PeriodStats[],
  start: number,
  end: number,
  keyName: T,
): Array<{[K in T]: number} & {appearances: number; totalDraws: number; frequency: number}> {
  const results: Array<
    {[K in T]: number} & {appearances: number; totalDraws: number; frequency: number}
  > = [];

  for (let i = start; i <= end; i++) {
    const stat = stats[i];
    const frequency =
      stat.totalDraws > 0 ? Math.round((stat.appearances / stat.totalDraws) * 10000) / 10000 : 0;

    results.push({
      [keyName]: i,
      appearances: stat.appearances,
      totalDraws: stat.totalDraws,
      frequency,
    } as {[K in T]: number} & {appearances: number; totalDraws: number; frequency: number});
  }

  return results;
}

/**
 * Calculate chi-square statistic for goodness of fit test.
 */
function calculateChiSquare(
  data: Array<{appearances: number; totalDraws: number}>,
  expectedFrequency: number,
): number {
  let chiSquare = 0;
  for (const item of data) {
    const expected = item.totalDraws * expectedFrequency;
    if (expected > 0) {
      chiSquare += (item.appearances - expected) ** 2 / expected;
    }
  }
  return chiSquare;
}

/**
 * Find the best performing period (day or month) based on frequency.
 * Only calculates when patterns exist to avoid unnecessary work.
 */
function findBestPeriod(
  byDayOfWeek: Array<{dayOfWeek: number; frequency: number; totalDraws: number}>,
  byMonth: Array<{month: number; frequency: number; totalDraws: number}>,
  hasDayPattern: boolean,
  hasMonthPattern: boolean,
): SeasonalPatterns['bestPeriod'] {
  if (!hasDayPattern && !hasMonthPattern) {
    return undefined;
  }

  // Only calculate bestDay if day pattern exists
  let bestDay: {dayOfWeek: number; frequency: number} | undefined;
  if (hasDayPattern) {
    const best = findBestByFrequency(byDayOfWeek, MIN_DAY_SAMPLES);
    if (best) {
      bestDay = {dayOfWeek: best.dayOfWeek, frequency: best.frequency};
    }
  }

  // Only calculate bestMonth if month pattern exists
  let bestMonth: {month: number; frequency: number} | undefined;
  if (hasMonthPattern) {
    const best = findBestByFrequency(byMonth, MIN_MONTH_SAMPLES);
    if (best) {
      bestMonth = {month: best.month, frequency: best.frequency};
    }
  }

  // Return the best one
  if (hasDayPattern && hasMonthPattern && bestDay && bestMonth) {
    return bestDay.frequency > bestMonth.frequency
      ? {type: 'dayOfWeek', value: bestDay.dayOfWeek, frequency: bestDay.frequency}
      : {type: 'month', value: bestMonth.month, frequency: bestMonth.frequency};
  }

  if (hasDayPattern && bestDay) {
    return {type: 'dayOfWeek', value: bestDay.dayOfWeek, frequency: bestDay.frequency};
  }

  if (hasMonthPattern && bestMonth) {
    return {type: 'month', value: bestMonth.month, frequency: bestMonth.frequency};
  }

  return undefined;
}

/**
 * Find the item with highest frequency that meets minimum sample threshold.
 * Uses a single loop instead of filter + reduce for better performance.
 */
function findBestByFrequency<T extends {frequency: number; totalDraws: number}>(
  arr: T[],
  minSamples: number,
): T | undefined {
  let best: T | undefined;

  for (const item of arr) {
    if (item.totalDraws >= minSamples && (!best || item.frequency > best.frequency)) {
      best = item;
    }
  }

  return best;
}

/**
 * Get interpretation based on which patterns were found.
 */
function getInterpretation(
  hasDayPattern: boolean,
  hasMonthPattern: boolean,
): SeasonalPatterns['interpretation'] {
  if (hasDayPattern && hasMonthPattern) return 'both_patterns';
  if (hasDayPattern) return 'day_pattern';
  if (hasMonthPattern) return 'month_pattern';
  return 'no_pattern';
}
