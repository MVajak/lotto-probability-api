import type {ConfidenceIntervalDto, DeviationAnalysisDto} from '../../../models';

/**
 * Calculate deviation analysis comparing observed vs expected frequency.
 * This is a PRO+ tier feature.
 *
 * @param frequency - Observed frequency (0-1 decimal)
 * @param theoreticalProb - Expected/theoretical probability (0-1 decimal)
 * @param confidenceInterval - Optional CI to determine statistical significance
 * @returns Deviation analysis DTO
 */
export function calculateDeviationAnalysis(
  frequency: number,
  theoreticalProb: number,
  confidenceInterval?: ConfidenceIntervalDto,
): DeviationAnalysisDto {
  const absoluteDeviation = frequency - theoreticalProb;
  const relativeDeviation = theoreticalProb > 0 ? absoluteDeviation / theoreticalProb : 0;

  // Deviation is significant if observed frequency is outside the CI
  const isSignificant = confidenceInterval
    ? theoreticalProb < confidenceInterval.lower || theoreticalProb > confidenceInterval.upper
    : false;

  return {
    absolute: Math.round(absoluteDeviation * 100000) / 100000,
    relative: Math.round(relativeDeviation * 100000) / 100000,
    isSignificant,
  };
}
