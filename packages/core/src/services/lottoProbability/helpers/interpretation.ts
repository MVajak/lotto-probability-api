import type {FrequencyInterpretation, FrequencyStatus} from '@lotto/shared';

/**
 * Interpretation of number frequency status
 */

/**
 * Interpret frequency status based on percentile ranking within the dataset
 *
 * This approach compares numbers against each other rather than theoretical expectations,
 * ensuring that there are always some "frequent" and "rare" numbers regardless of dataset size.
 *
 * Returns structured data for i18n-friendly frontend rendering
 *
 * @param frequency - Observed frequency (0 to 1)
 * @param theoreticalProbability - Expected theoretical probability (0 to 1)
 * @param allFrequencies - Array of all observed frequencies in the dataset
 * @param count - Number of times digit appeared
 * @param totalDraws - Total number of draws analyzed
 * @returns Structured interpretation data
 *
 * @example
 * const allFreqs = [0.08, 0.10, 0.12, 0.15, 0.09, ...]; // frequencies of all numbers
 * const interpretation = interpretFrequency(
 *   0.15,        // 15% observed for this number
 *   0.10,        // 10% expected
 *   allFreqs,    // all frequencies for ranking
 *   15,          // appeared 15 times
 *   100          // out of 100 draws
 * );
 * // Returns: { status: 'frequent', percentDifference: 50, appearedCount: 15, totalDraws: 100 }
 */
export function interpretFrequency(
  frequency: number,
  theoreticalProbability: number,
  allFrequencies: number[],
  count: number,
  totalDraws: number,
): FrequencyInterpretation {
  // Calculate percentile rank for this frequency
  // Percentile = percentage of values that are less than this value
  const sortedFrequencies = [...allFrequencies].sort((a, b) => a - b);
  const rank = sortedFrequencies.filter(f => f < frequency).length;
  const percentile = sortedFrequencies.length > 0 ? (rank / sortedFrequencies.length) * 100 : 0;

  // Calculate percent difference from theoretical
  const percentDifference =
    theoreticalProbability > 0
      ? Math.round(((frequency - theoreticalProbability) / theoreticalProbability) * 100)
      : 0;

  // Assign status based on percentile ranking
  let status: FrequencyStatus = 'normal';

  // Top 20% → frequent
  if (percentile >= 80) {
    status = 'frequent';
  }
  // Bottom 20% → rare
  else if (percentile <= 20) {
    status = 'rare';
  }
  // Middle 60% → normal

  return {
    status,
    percentDifference,
    appearedCount: count,
    totalDraws,
  };
}
