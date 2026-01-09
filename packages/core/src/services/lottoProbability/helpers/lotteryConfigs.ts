import {LottoType} from '@lotto/shared';

/**
 * Number range with min/max values
 */
export interface NumberRange {
  min: number;
  max: number;
}

/**
 * Base configuration for number pools (primary and secondary numbers)
 * Used by both LotteryConfig (defaults) and per-winClass overrides
 */
export interface NumberPoolConfig {
  primaryRange: NumberRange;
  primaryCount: number;
  secondaryRange?: NumberRange;
  secondaryCount?: number;
}

/**
 * Configuration for a lottery game
 */
export interface LotteryConfig extends NumberPoolConfig {
  type: LottoType;
  name: string;

  // Per-winClass overrides (optional)
  // When a winClass has different number ranges than the defaults
  winClassConfig?: Record<number, NumberPoolConfig>;
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
    winClassConfig: {
      3: {primaryRange: {min: 1, max: 75}, primaryCount: 6}, // diagonal
      4: {primaryRange: {min: 1, max: 75}, primaryCount: 6}, // corner
      5: {primaryRange: {min: 31, max: 45}, primaryCount: 1}, // center
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
  [LottoType.UK_HOT_PICKS]: {
    type: LottoType.UK_HOT_PICKS,
    name: 'Lotto HotPicks',
    primaryRange: {min: 1, max: 59},
    primaryCount: 6,
  },
  // Spanish Lotteries
  [LottoType.ES_LA_PRIMITIVA]: {
    type: LottoType.ES_LA_PRIMITIVA,
    name: 'La Primitiva',
    primaryRange: {min: 1, max: 49},
    primaryCount: 6,
    secondaryRange: {min: 1, max: 49}, // Complementario
    secondaryCount: 1,
    winClassConfig: {
      2: {primaryRange: {min: 0, max: 9}, primaryCount: 1}, // Reintegro
    },
  },
  [LottoType.ES_BONOLOTO]: {
    type: LottoType.ES_BONOLOTO,
    name: 'Bonoloto',
    primaryRange: {min: 1, max: 49},
    primaryCount: 6,
    secondaryRange: {min: 1, max: 49}, // Complementario
    secondaryCount: 1,
    winClassConfig: {
      2: {primaryRange: {min: 0, max: 9}, primaryCount: 1}, // Reintegro
    },
  },
  [LottoType.ES_EL_GORDO]: {
    type: LottoType.ES_EL_GORDO,
    name: 'El Gordo de la Primitiva',
    primaryRange: {min: 1, max: 54},
    primaryCount: 5,
    secondaryRange: {min: 0, max: 9}, // Reintegro (called "Número clave" in El Gordo)
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
