import type {DrawOccurrence, TrendAnalysis} from '../../../models';

/** Time series entry for monthly aggregates */
export interface TimeSeriesEntry {
  month: string;
  appearances: number;
  expectedAppearances: number;
}

const MS_PER_DAY = 86400000; // 1000 * 60 * 60 * 24

/**
 * Calculate trend analysis for a number's appearances.
 * Analyzes droughts (gaps between appearances), streaks (consecutive appearances),
 * and generates monthly time series data for charting.
 *
 * @param occurrences - All draw occurrences where the number appeared
 * @param appearanceSequence - Binary sequence (1=appeared, 0=didn't) for all draws in order
 * @param startTime - Period start timestamp (ms)
 * @param endTime - Period end timestamp (ms)
 * @param totalDraws - Total number of draws in period
 * @param theoreticalProb - Theoretical probability per draw
 * @returns Trend analysis data including droughts, streaks, and time series
 */
export function calculateTrendAnalysis(
  occurrences: DrawOccurrence[],
  appearanceSequence: number[],
  startTime: number,
  endTime: number,
  totalDraws: number,
  theoreticalProb: number,
): TrendAnalysis {
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

    // Calculate drought before first appearance
    const daysBeforeFirst = Math.floor((timestamps[0] - startTime) / MS_PER_DAY);
    longestDroughtDays = Math.max(longestDroughtDays, daysBeforeFirst);

    // Calculate gaps between consecutive appearances
    for (let i = 1; i < len; i++) {
      const daysDiff = Math.floor((timestamps[i] - timestamps[i - 1]) / MS_PER_DAY);
      droughtSum += daysDiff;
      droughtCount++;
      longestDroughtDays = Math.max(longestDroughtDays, daysDiff);
    }

    // Current drought: 0 if appeared in most recent draw, otherwise days since last appearance
    const mostRecentDrawHadNumber =
      appearanceSequence.length > 0 && appearanceSequence[appearanceSequence.length - 1] === 1;
    currentDroughtDays = mostRecentDrawHadNumber
      ? 0
      : Math.floor((endTime - timestamps[len - 1]) / MS_PER_DAY);

    // Also consider current drought for longest drought calculation
    longestDroughtDays = Math.max(longestDroughtDays, currentDroughtDays);
  }

  // Calculate average days between appearances
  // If only 1 appearance, use the average of drought before and after
  let averageDaysBetweenAppearances: number;
  if (droughtCount > 0) {
    averageDaysBetweenAppearances = Math.round(droughtSum / droughtCount);
  } else if (len === 1) {
    // Only 1 appearance: average the drought before first and after last
    const totalDays = Math.floor((endTime - startTime) / MS_PER_DAY);
    averageDaysBetweenAppearances = Math.round(totalDays / 2);
  } else {
    averageDaysBetweenAppearances = 0;
  }

  // Calculate streaks (consecutive draws where number appeared)
  // Using appearanceSequence which is a binary array [0,1,0,1,1,0,1,0,1]
  // Single pass: track longest streak and current streak simultaneously
  let longestStreak = 0;
  let tempStreak = 0;

  for (const appeared of appearanceSequence) {
    if (appeared === 1) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }
  // After the loop, tempStreak holds the trailing streak count (current streak)
  const currentStreak = tempStreak;

  // Calculate time series (monthly aggregates)
  const timeSeries = calculateTimeSeries(
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

/** Precomputed zero-padded month strings to avoid repeated padStart calls */
const PADDED_MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

/** Generate month key in YYYY-MM format */
function toMonthKey(year: number, month: number): string {
  return `${year}-${PADDED_MONTHS[month]}`;
}

/**
 * Calculate monthly time series data for charting.
 * Aggregates appearances by month and compares to expected value.
 *
 * @param occurrences - All occurrences sorted by date
 * @param startTime - Period start timestamp (ms)
 * @param endTime - Period end timestamp (ms)
 * @param totalDraws - Total draws in period
 * @param theoreticalProb - Theoretical probability
 * @returns Monthly time series data
 */
export function calculateTimeSeries(
  occurrences: DrawOccurrence[],
  startTime: number,
  endTime: number,
  totalDraws: number,
  theoreticalProb: number,
): TimeSeriesEntry[] {
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

  // Build result array directly (already in chronological order)
  // Use Map for O(1) lookup during occurrence counting
  const monthIndexMap = new Map<string, number>();
  const result: TimeSeriesEntry[] = new Array(totalMonths);

  let year = startYear;
  let month = startMonth;
  for (let i = 0; i < totalMonths; i++) {
    const monthKey = toMonthKey(year, month);
    monthIndexMap.set(monthKey, i);
    result[i] = {month: monthKey, appearances: 0, expectedAppearances: roundedExpected};

    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
  }

  // Count appearances per month using direct index lookup
  for (const occurrence of occurrences) {
    const date = occurrence.drawDate;
    const monthKey = toMonthKey(date.getFullYear(), date.getMonth());
    const idx = monthIndexMap.get(monthKey);
    if (idx !== undefined) {
      result[idx].appearances++;
    }
  }

  return result;
}
