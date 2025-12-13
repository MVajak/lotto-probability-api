import {LottoType} from '@lotto/shared';

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
  // US Lotteries
  [LottoType.POWERBALL]: {
    type: LottoType.POWERBALL,
    name: 'Powerball',
    primaryRange: {min: 1, max: 69},
    primaryCount: 5,
    secondaryRange: {min: 1, max: 26},
    secondaryCount: 1,
  },
  [LottoType.MEGA_MILLIONS]: {
    type: LottoType.MEGA_MILLIONS,
    name: 'Mega Millions',
    primaryRange: {min: 1, max: 70},
    primaryCount: 5,
    secondaryRange: {min: 1, max: 24}, // Changed from 25 to 24 in April 2025
    secondaryCount: 1,
  },
  [LottoType.CASH4LIFE]: {
    type: LottoType.CASH4LIFE,
    name: 'Cash4Life',
    primaryRange: {min: 1, max: 60},
    primaryCount: 5,
    secondaryRange: {min: 1, max: 4},
    secondaryCount: 1,
  },
  // UK Lotteries
  [LottoType.UK_EUROMILLIONS]: {
    type: LottoType.UK_EUROMILLIONS,
    name: 'UK EuroMillions',
    primaryRange: {min: 1, max: 50},
    primaryCount: 5,
    secondaryRange: {min: 1, max: 12},
    secondaryCount: 2,
  },
  [LottoType.UK_LOTTO]: {
    type: LottoType.UK_LOTTO,
    name: 'UK Lotto',
    primaryRange: {min: 1, max: 59},
    primaryCount: 6,
    secondaryRange: {min: 1, max: 59}, // Bonus ball from same pool
    secondaryCount: 1,
  },
  [LottoType.UK_THUNDERBALL]: {
    type: LottoType.UK_THUNDERBALL,
    name: 'Thunderball',
    primaryRange: {min: 1, max: 39},
    primaryCount: 5,
    secondaryRange: {min: 1, max: 14},
    secondaryCount: 1,
  },
  [LottoType.UK_SET_FOR_LIFE]: {
    type: LottoType.UK_SET_FOR_LIFE,
    name: 'Set For Life',
    primaryRange: {min: 1, max: 47},
    primaryCount: 5,
    secondaryRange: {min: 1, max: 10},
    secondaryCount: 1,
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
