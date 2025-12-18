import {MIN_DRAWS_FOR_STATISTICS} from '@lotto/shared';

import type {AutocorrelationAnalysis, MarkovChainAnalysis} from '../../../models';

import {
  CORRELATION_INTERPRETATION_THRESHOLD,
  GAMBLERS_FALLACY_THRESHOLD_MULTIPLIER,
  HOT_HAND_THRESHOLD_MULTIPLIER,
} from './constants';

/**
 * Calculate autocorrelation for a binary time series (appeared/not appeared)
 *
 * Uses single-pass variance calculation with the formula: Var(X) = E[X²] - E[X]²
 *
 * @param appearanceSequence - Binary array where 1 = appeared, 0 = not appeared
 * @param maxLag - Maximum lag to calculate (default: 5)
 * @returns Autocorrelation analysis
 */
export function calculateAutocorrelation(
  appearanceSequence: number[],
  maxLag: number = 5,
): AutocorrelationAnalysis | undefined {
  const n = appearanceSequence.length;

  // Need sufficient draws for meaningful autocorrelation
  if (n < MIN_DRAWS_FOR_STATISTICS) {
    return undefined;
  }

  // Single-pass calculation for mean and variance using: Var(X) = E[X²] - E[X]²
  let sum = 0;
  let sumSquared = 0;
  for (const val of appearanceSequence) {
    sum += val;
    sumSquared += val * val;
  }
  const mean = sum / n;
  const variance = sumSquared / n - mean * mean;

  if (variance === 0) {
    // No variance means all values are the same (all 0s or all 1s)
    return undefined;
  }

  const lagCorrelations: Array<{
    lag: number;
    correlation: number;
    pValue: number;
    isSignificant: boolean;
  }> = [];

  let hasSignificantCorrelation = false;
  let sumCorrelations = 0;

  // Pre-calculate constants outside the loop
  const standardError = 1 / Math.sqrt(n);
  const maxLagLimit = Math.min(maxLag, Math.floor(n / 4));

  // Calculate autocorrelation for each lag
  for (let lag = 1; lag <= maxLagLimit; lag++) {
    let covariance = 0;

    // Calculate covariance at this lag
    for (let i = 0; i < n - lag; i++) {
      covariance += (appearanceSequence[i] - mean) * (appearanceSequence[i + lag] - mean);
    }
    covariance /= n;

    // Autocorrelation coefficient
    const correlation = covariance / variance;

    // Calculate z-score and p-value (two-tailed test)
    const zScore = Math.abs(correlation) / standardError;
    // Approximate p-value using normal distribution
    // For |z| > 1.96, p < 0.05 (95% confidence)
    const pValue = 2 * (1 - normalCDF(zScore));

    const isSignificant = pValue < 0.05;

    lagCorrelations.push({
      lag,
      correlation: Math.round(correlation * 1000) / 1000,
      pValue: Math.round(pValue * 1000) / 1000,
      isSignificant,
    });

    if (isSignificant) {
      hasSignificantCorrelation = true;
    }
    sumCorrelations += correlation;
  }

  // Determine overall interpretation
  let interpretation: 'random' | 'positive_correlation' | 'negative_correlation' = 'random';

  if (hasSignificantCorrelation) {
    const avgCorrelation = sumCorrelations / lagCorrelations.length;
    if (avgCorrelation > CORRELATION_INTERPRETATION_THRESHOLD) {
      interpretation = 'positive_correlation';
    } else if (avgCorrelation < -CORRELATION_INTERPRETATION_THRESHOLD) {
      interpretation = 'negative_correlation';
    }
  }

  return {
    lagCorrelations,
    interpretation,
  };
}

/**
 * Calculate Markov chain transition probabilities
 *
 * Uses array-based indexing for branch-free transition counting:
 * - Index formula: current * 2 + next
 * - transitions[0] = 0→0 (notAppearedToNotAppeared)
 * - transitions[1] = 0→1 (notAppearedToAppeared)
 * - transitions[2] = 1→0 (appearedToNotAppeared)
 * - transitions[3] = 1→1 (appearedToAppeared)
 *
 * @param appearanceSequence - Binary array where 1 = appeared, 0 = not appeared
 * @param theoreticalProbability - Theoretical probability of appearance
 * @returns Markov chain analysis
 */
export function calculateMarkovChain(
  appearanceSequence: number[],
  theoreticalProbability: number,
): MarkovChainAnalysis | undefined {
  const n = appearanceSequence.length;

  // Need sufficient draws for meaningful Markov analysis
  if (n < MIN_DRAWS_FOR_STATISTICS) {
    return undefined;
  }

  // Count transitions using array indexing (branch-free)
  // Index: current * 2 + next → [0→0, 0→1, 1→0, 1→1]
  const transitions = [0, 0, 0, 0];
  for (let i = 0; i < n - 1; i++) {
    const idx = appearanceSequence[i] * 2 + appearanceSequence[i + 1];
    transitions[idx]++;
  }

  // Extract counts: [0→0, 0→1, 1→0, 1→1]
  const notAppearedToNotAppeared = transitions[0];
  const notAppearedToAppeared = transitions[1];
  const appearedToNotAppeared = transitions[2];
  const appearedToAppeared = transitions[3];

  // Calculate transition probabilities
  const totalFromAppeared = appearedToAppeared + appearedToNotAppeared;
  const totalFromNotAppeared = notAppearedToAppeared + notAppearedToNotAppeared;

  const probAppearedToAppeared = totalFromAppeared > 0 ? appearedToAppeared / totalFromAppeared : 0;
  const probAppearedToNotAppeared =
    totalFromAppeared > 0 ? appearedToNotAppeared / totalFromAppeared : 1;
  const probNotAppearedToAppeared =
    totalFromNotAppeared > 0 ? notAppearedToAppeared / totalFromNotAppeared : 0;
  const probNotAppearedToNotAppeared =
    totalFromNotAppeared > 0 ? notAppearedToNotAppeared / totalFromNotAppeared : 1;

  // Calculate steady-state probability (long-run equilibrium)
  // For a two-state Markov chain: π₁ = P(0→1) / [P(0→1) + P(1→0)]
  const steadyStateProbability =
    probNotAppearedToAppeared / (probNotAppearedToAppeared + probAppearedToNotAppeared);

  // Determine interpretation using extracted constants
  const hotHandThreshold = theoreticalProbability * HOT_HAND_THRESHOLD_MULTIPLIER;
  const gamblersFallacyThreshold = theoreticalProbability * GAMBLERS_FALLACY_THRESHOLD_MULTIPLIER;

  let interpretation: 'memoryless' | 'hot_hand' | 'gamblers_fallacy';
  if (probAppearedToAppeared > hotHandThreshold) {
    interpretation = 'hot_hand';
  } else if (probAppearedToAppeared < gamblersFallacyThreshold) {
    interpretation = 'gamblers_fallacy';
  } else {
    interpretation = 'memoryless';
  }

  return {
    transitionProbabilities: {
      appearedToAppeared: Math.round(probAppearedToAppeared * 1000) / 1000,
      appearedToNotAppeared: Math.round(probAppearedToNotAppeared * 1000) / 1000,
      notAppearedToAppeared: Math.round(probNotAppearedToAppeared * 1000) / 1000,
      notAppearedToNotAppeared: Math.round(probNotAppearedToNotAppeared * 1000) / 1000,
    },
    transitionCounts: {
      appearedToAppeared,
      appearedToNotAppeared,
      notAppearedToAppeared,
      notAppearedToNotAppeared,
    },
    steadyStateProbability: Math.round(steadyStateProbability * 1000) / 1000,
    interpretation,
  };
}

/**
 * Approximate cumulative distribution function (CDF) for standard normal distribution
 * Used for calculating p-values
 */
function normalCDF(z: number): number {
  // Approximation using error function
  // For z > 0: CDF(z) ≈ 0.5 * (1 + erf(z / sqrt(2)))
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const probability =
    d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return z > 0 ? 1 - probability : probability;
}
