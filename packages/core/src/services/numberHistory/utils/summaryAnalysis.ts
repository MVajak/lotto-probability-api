import type {FrequencyStatus, WilsonConfidenceInterval} from '@lotto/shared';

import type {NumberHistorySummary} from '../../../models';

/**
 * Calculate summary statistics for a number's appearance in lottery draws.
 *
 * @param number - The lottery number being analyzed
 * @param appearanceCount - Number of times the number appeared
 * @param totalDraws - Total number of draws in the period
 * @param theoreticalProb - Theoretical probability of this number appearing (0-1)
 * @param wilsonCI - Pre-calculated Wilson confidence interval
 * @returns Summary statistics
 */
export function calculateNumberSummary(
  number: number,
  appearanceCount: number,
  totalDraws: number,
  theoreticalProb: number,
  wilsonCI: WilsonConfidenceInterval,
): NumberHistorySummary {
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

  return {
    number,
    totalDraws,
    appearanceCount,
    frequencyPercent: Math.round(frequencyPercent * 100) / 100,
    expectedFrequencyPercent: Math.round(expectedFrequencyPercent * 100) / 100,
    status,
  };
}
