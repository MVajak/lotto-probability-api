import type {FrequencyStatus, WilsonConfidenceInterval} from '@lotto/shared';

import type {NumberDetailSummary} from '../../../models';

/**
 * Last seen information passed to buildNumberSummary
 */
interface LastSeenInput {
  drawsAgo: number;
  date: string | null;
}

/**
 * Calculate overdue score for a number.
 * Score indicates how "overdue" a number is compared to its expected appearance rate.
 *
 * Formula: overdueScore = lastSeenDrawsAgo / expectedGap
 * where expectedGap = 1 / theoreticalProbability
 *
 * Interpretation:
 * - Score = 0: Just appeared in the most recent draw
 * - Score < 1: Appeared more recently than expected
 * - Score = 1: Appeared exactly as expected
 * - Score > 1: Overdue - hasn't appeared as often as expected
 */
function calculateOverdueScore(lastSeenDrawsAgo: number, theoreticalProbability: number): number {
  if (theoreticalProbability <= 0) {
    return 0;
  }
  const expectedGap = 1 / theoreticalProbability;
  const overdueScore = lastSeenDrawsAgo / expectedGap;
  return Math.round(overdueScore * 100) / 100;
}

/**
 * Build summary statistics for a number's appearance in lottery draws.
 *
 * @param number - The lottery number being analyzed
 * @param appearanceCount - Number of times the number appeared
 * @param totalDraws - Total number of draws in the period
 * @param theoreticalProb - Theoretical probability of this number appearing (0-1)
 * @param wilsonCI - Pre-calculated Wilson confidence interval
 * @param lastSeen - Last seen information (drawsAgo and date)
 * @returns Summary statistics
 */
export function buildNumberSummary(
  number: number,
  appearanceCount: number,
  totalDraws: number,
  theoreticalProb: number,
  wilsonCI: WilsonConfidenceInterval,
  lastSeen: LastSeenInput,
): NumberDetailSummary {
  const frequency = totalDraws > 0 ? appearanceCount / totalDraws : 0;
  const frequencyPercent = frequency * 100;
  const expectedFrequencyPercent = theoreticalProb * 100;

  // Determine status based on whether theoretical probability falls within CI
  let status: FrequencyStatus = 'normal';
  if (theoreticalProb < wilsonCI.lower) {
    status = 'frequent';
  } else if (theoreticalProb > wilsonCI.upper) {
    status = 'rare';
  }

  // Calculate overdue score using the utility function
  const overdueScore = calculateOverdueScore(lastSeen.drawsAgo, theoreticalProb);

  return {
    number,
    totalDraws,
    appearanceCount,
    frequencyPercent: Math.round(frequencyPercent * 100) / 100,
    expectedFrequencyPercent: Math.round(expectedFrequencyPercent * 100) / 100,
    status,
    lastSeenDrawsAgo: lastSeen.drawsAgo,
    lastSeenDate: lastSeen.date,
    overdueScore,
  };
}
