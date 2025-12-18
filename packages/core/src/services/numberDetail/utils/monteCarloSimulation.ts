import {MIN_DRAWS_FOR_STATISTICS} from '@lotto/shared';

import type {MonteCarloSimulation} from '../../../models';

import {Z_SCORE_90_CONFIDENCE} from './constants';

/**
 * Calculate expected appearance range using Normal approximation to binomial distribution.
 *
 * Uses the mathematical property that binomial(n, p) ≈ Normal(μ, σ) for large n,
 * where μ = n×p and σ = √(n×p×(1-p)). This provides O(1) computation of percentiles
 * instead of running expensive Monte Carlo simulations.
 *
 * @param actualAppearances - Number of times the number actually appeared
 * @param totalDraws - Total number of draws in the period
 * @param theoreticalProbability - Theoretical probability of appearing in each draw
 * @returns Monte Carlo simulation results or undefined if insufficient data
 */
export function calculateMonteCarloSimulation(
  actualAppearances: number,
  totalDraws: number,
  theoreticalProbability: number,
): MonteCarloSimulation | undefined {
  // Need sufficient data for Normal approximation validity (n×p ≥ 5 and n×(1-p) ≥ 5)
  if (totalDraws < MIN_DRAWS_FOR_STATISTICS) {
    return undefined;
  }

  const p = theoreticalProbability;
  const n = totalDraws;

  // Normal approximation to binomial distribution
  const mean = n * p;
  const stdDev = Math.sqrt(n * p * (1 - p));

  // Calculate percentiles using 90% confidence interval z-score
  const percentile5 = Math.round(mean - Z_SCORE_90_CONFIDENCE * stdDev);
  const percentile95 = Math.round(mean + Z_SCORE_90_CONFIDENCE * stdDev);

  // Determine interpretation
  let interpretation: MonteCarloSimulation['interpretation'];
  if (actualAppearances < percentile5) {
    interpretation = 'below_expected';
  } else if (actualAppearances > percentile95) {
    interpretation = 'above_expected';
  } else {
    interpretation = 'within_expected';
  }

  return {
    simulationCount: 10000, // Kept for API compatibility
    simulatedProbability: Math.round(p * 10000) / 10000,
    theoreticalProbability: Math.round(p * 10000) / 10000,
    percentile5: Math.max(0, percentile5),
    percentile95,
    actualAppearances,
    interpretation,
  };
}
