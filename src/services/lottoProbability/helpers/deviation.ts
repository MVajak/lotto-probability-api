import {DeviationAnalysis} from '../../../common/types';

/**
 * Deviation calculation utilities for comparing observed vs theoretical frequencies
 */

/**
 * Calculate deviation from theoretical probability
 *
 * @param observed - Observed frequency (0 to 1)
 * @param theoretical - Theoretical probability (0 to 1)
 * @param confidenceIntervalLower - Lower bound of confidence interval
 * @param confidenceIntervalUpper - Upper bound of confidence interval
 * @returns Deviation analysis
 *
 * @example
 * const deviation = calculateDeviation(0.15, 0.10, 0.089, 0.231);
 * // Returns:
 * // {
 * //   absolute: 0.05,
 * //   relative: 0.50,  (50% higher than expected)
 * //   isSignificant: false  (0.10 is within [0.089, 0.231])
 * // }
 */
export function calculateDeviation(
  observed: number,
  theoretical: number,
  confidenceIntervalLower: number,
  confidenceIntervalUpper: number,
): DeviationAnalysis {
  const absolute = observed - theoretical;
  const relative = theoretical !== 0 ? absolute / theoretical : 0;

  // Deviation is significant if theoretical probability falls outside CI
  const isSignificant =
    theoretical < confidenceIntervalLower || theoretical > confidenceIntervalUpper;

  return {
    absolute,
    relative,
    isSignificant,
  };
}
