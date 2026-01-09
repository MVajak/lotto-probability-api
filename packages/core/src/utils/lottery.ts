import {
  type LottoType,
  calculateTheoreticalProbability as calculateProbability,
} from '@lotto/shared';
import {
  type LotteryConfig,
  getLotteryConfig,
} from '../services/lottoProbability/helpers/lotteryConfigs';

/**
 * Lottery-specific utility functions
 * Works with lottery configurations
 */

/**
 * Get the number range for a lottery type
 *
 * @param lottoType - Type of lottery
 * @param useSecondaryNumbers - Whether to get secondary numbers range
 * @param winClass - Win class (for lotteries with per-winClass configurations)
 * @returns Number range with start and end values
 *
 * @example
 * getNumberRange(LottoType.EUROJACKPOT, false);  // {start: 1, end: 50}
 * getNumberRange(LottoType.EUROJACKPOT, true);   // {start: 1, end: 12}
 * getNumberRange(LottoType.EST_BINGO, false, 5);  // {start: 31, end: 45} (center)
 * getNumberRange(LottoType.ES_LA_PRIMITIVA, false, 2);  // {start: 0, end: 9} (reintegro)
 */
export function getNumberRange(
  lottoType: LottoType,
  useSecondaryNumbers?: boolean,
  winClass?: number,
): {start: number; end: number} {
  const config = getLotteryConfig(lottoType);

  // Check for winClass-specific config
  if (winClass !== undefined && config.winClassConfig?.[winClass]) {
    const wcConfig = config.winClassConfig[winClass];
    const range =
      useSecondaryNumbers && wcConfig.secondaryRange
        ? wcConfig.secondaryRange
        : wcConfig.primaryRange;
    return {start: range.min, end: range.max};
  }

  // Fall back to default ranges
  const range =
    useSecondaryNumbers && config.secondaryRange ? config.secondaryRange : config.primaryRange;

  if (!range) {
    return {start: 0, end: 0};
  }

  return {start: range.min, end: range.max};
}

/**
 * Calculate theoretical probability for a lottery number to appear
 *
 * Convenience wrapper that extracts the correct values from lottery config
 *
 * @param config - Lottery configuration
 * @param useSecondaryNumbers - Whether to calculate for secondary numbers (stars/bonus)
 * @param winClass - Win class (for lotteries with per-winClass configurations)
 * @returns Theoretical probability (0 to 1)
 *
 * @example
 * const config = getLotteryConfig(LottoType.EUROJACKPOT);
 * const prob = calculateLotteryTheoreticalProbability(config, false);
 * // Returns 5/50 = 0.10 (10%)
 */
export function calculateLotteryTheoreticalProbability(
  config: LotteryConfig,
  useSecondaryNumbers: boolean = false,
  winClass?: number,
): number {
  // Check for winClass-specific config
  if (winClass !== undefined && config.winClassConfig?.[winClass]) {
    const wcConfig = config.winClassConfig[winClass];
    if (useSecondaryNumbers) {
      if (!wcConfig.secondaryRange || !wcConfig.secondaryCount) {
        return 0;
      }
      const range = wcConfig.secondaryRange.max - wcConfig.secondaryRange.min + 1;
      return calculateProbability(wcConfig.secondaryCount, range);
    }
    const range = wcConfig.primaryRange.max - wcConfig.primaryRange.min + 1;
    return calculateProbability(wcConfig.primaryCount, range);
  }

  // Fall back to default config
  if (useSecondaryNumbers) {
    if (!config.secondaryRange || !config.secondaryCount) {
      return 0;
    }
    const range = config.secondaryRange.max - config.secondaryRange.min + 1;
    return calculateProbability(config.secondaryCount, range);
  }

  const range = config.primaryRange.max - config.primaryRange.min + 1;
  return calculateProbability(config.primaryCount, range);
}
