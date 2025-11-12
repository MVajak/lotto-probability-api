import {LottoType} from '../../../common/types';

/**
 * Configuration for a lottery game
 */
export interface LotteryConfig {
  type: LottoType;
  name: string;

  // Primary numbers (main draw)
  primaryRange: {
    min: number;
    max: number;
  };
  primaryCount: number; // How many numbers are drawn

  // Secondary numbers (bonus/star numbers)
  secondaryRange?: {
    min: number;
    max: number;
  };
  secondaryCount?: number;

  // Bingo-specific variants (different win patterns)
  bingoVariants?: {
    center: {min: number; max: number; winClass: number};
    corner: {min: number; max: number; winClass: number};
    diagonal: {min: number; max: number; winClass: number};
  };
}

/**
 * Lottery configurations for all supported lottery types
 */
export const LOTTERY_CONFIGS: Record<LottoType, LotteryConfig> = {
  [LottoType.EURO]: {
    type: LottoType.EURO,
    name: 'EuroJackpot',
    primaryRange: {min: 1, max: 50},
    primaryCount: 5,
    secondaryRange: {min: 1, max: 12},
    secondaryCount: 2,
  },
  [LottoType.VIKINGLOTTO]: {
    type: LottoType.VIKINGLOTTO,
    name: 'Viking Lotto',
    primaryRange: {min: 1, max: 48},
    primaryCount: 6,
    secondaryRange: {min: 1, max: 5},
    secondaryCount: 1,
  },
  [LottoType.KENO]: {
    type: LottoType.KENO,
    name: 'Keno',
    primaryRange: {min: 1, max: 64},
    primaryCount: 20, // 20 numbers drawn from 64
  },
  [LottoType.BINGO]: {
    type: LottoType.BINGO,
    name: 'Bingo Lotto',
    primaryRange: {min: 1, max: 75},
    primaryCount: 6,
    bingoVariants: {
      center: {min: 31, max: 45, winClass: 5},
      corner: {min: 1, max: 75, winClass: 4}, // Same as primary
      diagonal: {min: 1, max: 75, winClass: 3}, // Same as primary
    },
  },
  [LottoType.JOKKER]: {
    type: LottoType.JOKKER,
    name: 'Jokker',
    primaryRange: {min: 0, max: 9}, // Digits 0-9
    primaryCount: 6, // 6 digit number
  },
};

/**
 * Get lottery configuration by type
 *
 * @param lottoType - Type of lottery
 * @returns Lottery configuration
 *
 * @example
 * const config = getLotteryConfig(LottoType.EURO);
 * // Returns config with primaryRange: {min: 1, max: 50}, primaryCount: 5
 */
export function getLotteryConfig(lottoType: LottoType): LotteryConfig {
  const config = LOTTERY_CONFIGS[lottoType];

  if (!config) {
    throw new Error(`Lottery configuration not found for type: ${lottoType}`);
  }

  return config;
}

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
 * Calculate theoretical probability for a single number to appear
 *
 * For a lottery where k numbers are drawn from a range of n numbers,
 * the probability that any specific number appears is: k / n
 *
 * @param config - Lottery configuration
 * @param useSecondaryNumbers - Whether to calculate for secondary numbers (stars/bonus)
 * @returns Theoretical probability (0 to 1)
 *
 * @example
 * // EuroJackpot main numbers: 5 drawn from 1-50
 * const prob = calculateTheoreticalProbability(euroConfig, false);
 * // Returns 5/50 = 0.10 (10%)
 *
 * // EuroJackpot stars: 2 drawn from 1-12
 * const starProb = calculateTheoreticalProbability(euroConfig, true);
 * // Returns 2/12 = 0.167 (16.7%)
 */
export function calculateTheoreticalProbability(
  config: LotteryConfig,
  useSecondaryNumbers: boolean = false,
): number {
  if (useSecondaryNumbers) {
    if (!config.secondaryRange || !config.secondaryCount) {
      return 0;
    }

    const range = config.secondaryRange.max - config.secondaryRange.min + 1;
    return config.secondaryCount / range;
  }

  const range = config.primaryRange.max - config.primaryRange.min + 1;
  return config.primaryCount / range;
}
