import {LottoType, calculateTheoreticalProbability as calculateProbability} from '@lotto/shared';
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
 * @param winClass - Win class (for Bingo variants)
 * @returns Number range with start and end values
 *
 * @example
 * getNumberRange(LottoType.EURO, false);  // {start: 1, end: 50}
 * getNumberRange(LottoType.EURO, true);   // {start: 1, end: 12}
 * getNumberRange(LottoType.BINGO, false, 5);  // {start: 31, end: 45} (center)
 */
export function getNumberRange(
  lottoType: LottoType,
  useSecondaryNumbers?: boolean,
  winClass?: number,
): {start: number; end: number} {
  const config = getLotteryConfig(lottoType);

  // Handle Bingo win class variants
  if (lottoType === LottoType.BINGO && winClass && config.bingoVariants) {
    if (winClass === config.bingoVariants.center.winClass) {
      const {min, max} = config.bingoVariants.center;
      return {start: min, end: max};
    }
    if (winClass === config.bingoVariants.corner.winClass) {
      const {min, max} = config.bingoVariants.corner;
      return {start: min, end: max};
    }
    if (winClass === config.bingoVariants.diagonal.winClass) {
      const {min, max} = config.bingoVariants.diagonal;
      return {start: min, end: max};
    }
  }

  // Return secondary or primary range
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
 * @returns Theoretical probability (0 to 1)
 *
 * @example
 * const config = getLotteryConfig(LottoType.EURO);
 * const prob = calculateLotteryTheoreticalProbability(config, false);
 * // Returns 5/50 = 0.10 (10%)
 */
export function calculateLotteryTheoreticalProbability(
  config: LotteryConfig,
  useSecondaryNumbers: boolean = false,
): number {
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
