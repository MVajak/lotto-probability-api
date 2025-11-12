import {
  FrequencyInterpretation,
  FrequencyStatus,
  WilsonConfidenceInterval,
} from '../../../common/types';

/**
 * Interpretation of number frequency status
 */

/**
 * Interpret frequency status based on confidence interval and theoretical probability
 *
 * Returns structured data for i18n-friendly frontend rendering
 *
 * @param frequency - Observed frequency (0 to 1)
 * @param theoreticalProbability - Expected theoretical probability (0 to 1)
 * @param confidenceInterval - Wilson confidence interval
 * @param count - Number of times digit appeared
 * @param totalDraws - Total number of draws analyzed
 * @returns Structured interpretation data
 *
 * @example
 * const interpretation = interpretFrequency(
 *   0.15,        // 15% observed
 *   0.10,        // 10% expected
 *   { lower: 0.089, upper: 0.231 },
 *   15,          // appeared 15 times
 *   100          // out of 100 draws
 * );
 * // Returns: { status: 'normal', percentDifference: 0, appearedCount: 15, totalDraws: 100 }
 */
export function interpretFrequency(
  frequency: number,
  theoreticalProbability: number,
  confidenceInterval: WilsonConfidenceInterval,
  count: number,
  totalDraws: number,
): FrequencyInterpretation {
  const {lower, upper} = confidenceInterval;

  // Check if theoretical probability falls within confidence interval
  const isNormal = theoreticalProbability >= lower && theoreticalProbability <= upper;

  // Calculate percent difference from theoretical
  let percentDifference = 0;
  let status: FrequencyStatus = 'normal';

  if (!isNormal) {
    // Number appears significantly more than expected
    if (frequency > theoreticalProbability && lower > theoreticalProbability) {
      percentDifference = Math.round((frequency / theoreticalProbability - 1) * 100);
      status = 'hot';
    }
    // Number appears significantly less than expected
    else if (frequency < theoreticalProbability && upper < theoreticalProbability) {
      percentDifference = -Math.round((1 - frequency / theoreticalProbability) * 100);
      status = 'cold';
    }
  }

  return {
    status,
    percentDifference,
    appearedCount: count,
    totalDraws,
  };
}
