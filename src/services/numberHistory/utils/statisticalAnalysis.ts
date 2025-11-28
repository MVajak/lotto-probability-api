import {AutocorrelationAnalysis, MarkovChainAnalysis} from '../../../models/LottoNumbers';

/**
 * Calculate autocorrelation for a binary time series (appeared/not appeared)
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

  // Need at least 30 draws for meaningful autocorrelation
  if (n < 20) {
    return undefined;
  }

  // Calculate mean
  const mean = appearanceSequence.reduce((sum, val) => sum + val, 0) / n;

  // Calculate variance
  const variance = appearanceSequence.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;

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

  // Calculate autocorrelation for each lag
  for (let lag = 1; lag <= Math.min(maxLag, Math.floor(n / 4)); lag++) {
    let covariance = 0;

    // Calculate covariance at this lag
    for (let i = 0; i < n - lag; i++) {
      covariance += (appearanceSequence[i] - mean) * (appearanceSequence[i + lag] - mean);
    }
    covariance /= n;

    // Autocorrelation coefficient
    const correlation = covariance / variance;

    // Standard error for testing significance (under null hypothesis of no correlation)
    // For large samples, standard error ≈ 1/sqrt(n)
    const standardError = 1 / Math.sqrt(n);

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
    if (avgCorrelation > 0.1) {
      interpretation = 'positive_correlation';
    } else if (avgCorrelation < -0.1) {
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
 * @param appearanceSequence - Binary array where 1 = appeared, 0 = not appeared
 * @param theoreticalProbability - Theoretical probability of appearance
 * @returns Markov chain analysis
 */
export function calculateMarkovChain(
  appearanceSequence: number[],
  theoreticalProbability: number,
): MarkovChainAnalysis | undefined {
  const n = appearanceSequence.length;

  // Need at least 20 draws for meaningful Markov analysis
  if (n < 20) {
    return undefined;
  }

  // Count transitions
  let appearedToAppeared = 0;
  let appearedToNotAppeared = 0;
  let notAppearedToAppeared = 0;
  let notAppearedToNotAppeared = 0;

  for (let i = 0; i < n - 1; i++) {
    const current = appearanceSequence[i];
    const next = appearanceSequence[i + 1];

    if (current === 1 && next === 1) {
      appearedToAppeared++;
    } else if (current === 1 && next === 0) {
      appearedToNotAppeared++;
    } else if (current === 0 && next === 1) {
      notAppearedToAppeared++;
    } else {
      notAppearedToNotAppeared++;
    }
  }

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

  // Determine interpretation
  let interpretation: 'memoryless' | 'hot_hand' | 'gamblers_fallacy';

  // Compare transition probabilities to theoretical probability
  const hotHandThreshold = theoreticalProbability * 1.5; // 50% higher
  const gamblersFallacyThreshold = theoreticalProbability * 0.5; // 50% lower

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
