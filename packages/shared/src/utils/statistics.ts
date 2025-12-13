import type {WilsonConfidenceInterval} from '../types/lotto';

/**
 * Pure statistical/mathematical functions
 * No dependencies on lottery-specific config or business logic
 */

/**
 * Get z-score for common confidence levels
 *
 * Z-score represents the number of standard deviations from the mean
 * in a standard normal distribution.
 *
 * @param confidenceLevel - Confidence level between 0 and 1
 * @returns Z-score for the given confidence level
 *
 * @example
 * getZScore(0.95);  // Returns 1.96 (95% confidence)
 * getZScore(0.99);  // Returns 2.576 (99% confidence)
 */
export function getZScore(confidenceLevel: number): number {
  // Pre-calculated z-scores for common confidence levels
  const zScores: Record<number, number> = {
    0.9: 1.645, // 90% confidence
    0.95: 1.96, // 95% confidence
    0.99: 2.576, // 99% confidence
    0.999: 3.291, // 99.9% confidence
  };

  // Return pre-calculated value if available
  if (zScores[confidenceLevel]) {
    return zScores[confidenceLevel];
  }

  // Default to 95% confidence if not recognized
  return 1.96;
}

/**
 * Wilson Score Confidence Interval
 *
 * Calculates confidence intervals for binomial proportions (like lottery frequencies).
 * More accurate than normal approximation, especially for:
 * - Small sample sizes
 * - Proportions near 0 or 1
 * - Ensures intervals stay within [0, 1]
 *
 * Reference: Wilson, E. B. (1927). "Probable inference, the law of succession,
 * and statistical inference". Journal of the American Statistical Association.
 *
 * @param successes - Number of times event occurred (e.g., number appeared)
 * @param trials - Total number of trials (e.g., total draws)
 * @param confidenceLevel - Confidence level (0.90, 0.95, or 0.99)
 * @returns Confidence interval with lower and upper bounds
 *
 * @example
 * // Number 7 appeared 15 times in 100 draws
 * const ci = calculateWilsonConfidenceInterval(15, 100, 0.95);
 * // Result: { lower: 0.089, upper: 0.231, center: 0.152 }
 * // Interpretation: "95% confident true frequency is between 8.9% and 23.1%"
 */
export function calculateWilsonConfidenceInterval(
  successes: number,
  trials: number,
  confidenceLevel: number = 0.95,
): WilsonConfidenceInterval {
  // Handle edge cases
  if (trials === 0) {
    return {lower: 0, upper: 0, center: 0};
  }

  if (successes === 0) {
    // Special case: no successes, but still calculate upper bound
    const z = getZScore(confidenceLevel);
    const upper = (z * z) / (trials + z * z);
    return {lower: 0, upper, center: 0};
  }

  if (successes === trials) {
    // Special case: all successes, but still calculate lower bound
    const z = getZScore(confidenceLevel);
    const lower = trials / (trials + z * z);
    return {lower, upper: 1, center: 1};
  }

  // Calculate sample proportion
  const p = successes / trials;

  // Get z-score for confidence level
  const z = getZScore(confidenceLevel);
  const z2 = z * z;

  // Wilson score interval formula
  const denominator = 1 + z2 / trials;

  // Adjusted center (continuity correction)
  const centerAdjustment = (p + z2 / (2 * trials)) / denominator;

  // Margin of error
  const marginOfError =
    (z / denominator) * Math.sqrt((p * (1 - p)) / trials + z2 / (4 * trials * trials));

  // Calculate bounds
  const lower = Math.max(0, centerAdjustment - marginOfError);
  const upper = Math.min(1, centerAdjustment + marginOfError);

  return {
    lower,
    upper,
    center: centerAdjustment,
  };
}

/**
 * Calculate theoretical probability for a single item to appear
 *
 * For a selection where k items are drawn from a range of n items,
 * the probability that any specific item appears is: k / n
 *
 * @param drawnCount - How many items are drawn (k)
 * @param totalRange - Total number of items in the range (n)
 * @returns Theoretical probability (0 to 1)
 *
 * @example
 * // EuroJackpot main numbers: 5 drawn from 50
 * const prob = calculateTheoreticalProbability(5, 50);
 * // Returns 5/50 = 0.10 (10%)
 *
 * // EuroJackpot stars: 2 drawn from 12
 * const starProb = calculateTheoreticalProbability(2, 12);
 * // Returns 2/12 = 0.167 (16.7%)
 */
export function calculateTheoreticalProbability(drawnCount: number, totalRange: number): number {
  if (totalRange === 0) {
    return 0;
  }
  return drawnCount / totalRange;
}
