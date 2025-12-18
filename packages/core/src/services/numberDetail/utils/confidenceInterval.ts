import type {WilsonConfidenceInterval} from '@lotto/shared';

import type {ConfidenceIntervalDto} from '../../../models';

/**
 * Convert Wilson confidence interval to DTO format.
 * This is a PRO+ tier feature.
 *
 * @param wilsonCI - Wilson confidence interval result
 * @returns Formatted confidence interval DTO
 */
export function calculateConfidenceIntervalDto(
  wilsonCI: WilsonConfidenceInterval,
): ConfidenceIntervalDto {
  return {
    lower: Math.round(wilsonCI.lower * 100000) / 100000,
    upper: Math.round(wilsonCI.upper * 100000) / 100000,
    center: Math.round(wilsonCI.center * 100000) / 100000,
    confidenceLevel: 0.95,
  };
}
