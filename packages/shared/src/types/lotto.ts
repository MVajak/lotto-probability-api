export enum LottoType {
  // Estonian
  EST_BINGO = 'EST_BINGO',
  EST_KENO = 'EST_KENO',
  EST_JOKKER = 'EST_JOKKER',
  // US lotteries
  US_POWERBALL = 'US_POWERBALL',
  US_MEGA_MILLIONS = 'US_MEGA_MILLIONS',
  US_CASH4LIFE = 'US_CASH4LIFE',
  // UK lotteries
  UK_LOTTO = 'UK_LOTTO',
  UK_THUNDERBALL = 'UK_THUNDERBALL',
  UK_SET_FOR_LIFE = 'UK_SET_FOR_LIFE',
  UK_HOT_PICKS = 'UK_HOT_PICKS',
  // Irish lotteries
  IE_LOTTO = 'IE_LOTTO',
  IE_LOTTO_PLUS_1 = 'IE_LOTTO_PLUS_1',
  IE_LOTTO_PLUS_2 = 'IE_LOTTO_PLUS_2',
  IE_DAILY_MILLION = 'IE_DAILY_MILLION',
  IE_DAILY_MILLION_PLUS = 'IE_DAILY_MILLION_PLUS',
  // Spanish lotteries
  ES_LA_PRIMITIVA = 'ES_LA_PRIMITIVA',
  ES_BONOLOTO = 'ES_BONOLOTO',
  ES_EL_GORDO = 'ES_EL_GORDO',
  // French lotteries
  FR_LOTO = 'FR_LOTO',
  FR_JOKER = 'FR_JOKER',
  FR_KENO = 'FR_KENO',
  // German lotteries
  DE_LOTTO_6AUS49 = 'DE_LOTTO_6AUS49',
  DE_KENO = 'DE_KENO',
  DE_SPIEL77 = 'DE_SPIEL77',
  DE_SUPER6 = 'DE_SUPER6',
  // Canadian lotteries
  CA_LOTTO_MAX = 'CA_LOTTO_MAX',
  CA_LOTTO_649 = 'CA_LOTTO_649',
  CA_DAILY_GRAND = 'CA_DAILY_GRAND',
  CA_LOTTARIO = 'CA_LOTTARIO',
  CA_BC_49 = 'CA_BC_49',
  CA_QUEBEC_49 = 'CA_QUEBEC_49',
  CA_ATLANTIC_49 = 'CA_ATLANTIC_49',
  // Australian lotteries
  AU_POWERBALL = 'AU_POWERBALL',
  AU_SATURDAY_LOTTO = 'AU_SATURDAY_LOTTO',
  AU_OZ_LOTTO = 'AU_OZ_LOTTO',
  AU_SET_FOR_LIFE = 'AU_SET_FOR_LIFE',
  AU_WEEKDAY_WINDFALL = 'AU_WEEKDAY_WINDFALL',
  AU_CASH_3 = 'AU_CASH_3',
  AU_SUPER_66 = 'AU_SUPER_66',
  AU_LOTTO_STRIKE = 'AU_LOTTO_STRIKE',
  // Shared
  VIKINGLOTTO = 'VIKINGLOTTO',
  EUROJACKPOT = 'EUROJACKPOT',
  EUROMILLIONS = 'EUROMILLIONS',
  EURODREAMS = 'EURODREAMS',
}

/**
 * Frequency status classification
 */
export type FrequencyStatus = 'frequent' | 'rare' | 'normal';

/**
 * Wilson Score Confidence Interval for binomial proportions
 */
export interface WilsonConfidenceInterval {
  lower: number;
  upper: number;
  center: number;
}

/**
 * Deviation analysis comparing observed vs theoretical frequency
 */
export interface DeviationAnalysis {
  absolute: number; // frequency - theoretical
  relative: number; // (frequency - theoretical) / theoretical
  isSignificant: boolean; // Is deviation outside confidence interval?
}

/**
 * Structured interpretation of frequency status (i18n-friendly)
 */
export interface FrequencyInterpretation {
  status: FrequencyStatus;
  percentDifference: number; // How much above/below expected (0 for normal)
  appearedCount: number; // How many times this number appeared
  totalDraws: number; // Total number of draws
}

/**
 * Number statistics with frequency analysis
 */
export interface NumberFrequencyStat {
  position: number | null; // null for overall stats, 0-N for positional
  digit: number;

  // Raw counts
  count: number;
  totalDraws: number;

  // Historical frequency
  frequency: number; // count / totalDraws

  // Structured interpretation (i18n-friendly)
  interpretation: FrequencyInterpretation;

  // Rank by frequency (1 = most frequent)
  rank: number;
}

export enum DateFormat {
  European = 'dd.MM.yyyy',
}

export const OVERALL_PROBABILITY_LOTTO = [
  LottoType.EUROJACKPOT,
  LottoType.VIKINGLOTTO,
  LottoType.EST_KENO,
  LottoType.EST_BINGO,
  // US lotteries
  LottoType.US_POWERBALL,
  LottoType.US_MEGA_MILLIONS,
  LottoType.US_CASH4LIFE,
  // UK lotteries
  LottoType.EUROMILLIONS,
  LottoType.UK_LOTTO,
  LottoType.UK_THUNDERBALL,
  LottoType.UK_SET_FOR_LIFE,
  LottoType.UK_HOT_PICKS,
  // Irish lotteries
  LottoType.IE_LOTTO,
  LottoType.IE_LOTTO_PLUS_1,
  LottoType.IE_LOTTO_PLUS_2,
  LottoType.IE_DAILY_MILLION,
  LottoType.IE_DAILY_MILLION_PLUS,
  // Spanish lotteries
  LottoType.ES_LA_PRIMITIVA,
  LottoType.ES_BONOLOTO,
  LottoType.ES_EL_GORDO,
  // French lotteries
  LottoType.FR_LOTO,
  LottoType.FR_KENO,
  // German lotteries
  LottoType.DE_LOTTO_6AUS49,
  LottoType.DE_KENO,
  // Canadian lotteries
  LottoType.CA_LOTTO_MAX,
  LottoType.CA_LOTTO_649,
  LottoType.CA_DAILY_GRAND,
  LottoType.CA_LOTTARIO,
  LottoType.CA_BC_49,
  LottoType.CA_QUEBEC_49,
  LottoType.CA_ATLANTIC_49,
  // Australian lotteries
  LottoType.AU_POWERBALL,
  LottoType.AU_SATURDAY_LOTTO,
  LottoType.AU_OZ_LOTTO,
  LottoType.AU_SET_FOR_LIFE,
  LottoType.AU_WEEKDAY_WINDFALL,
  LottoType.AU_CASH_3,
  LottoType.AU_SUPER_66,
  LottoType.AU_LOTTO_STRIKE,
  // Shared
  LottoType.EURODREAMS,
];

export const POSITIONAL_PROBABILITY_LOTTO = [
  LottoType.EST_JOKKER,
  LottoType.FR_JOKER,
  LottoType.DE_SPIEL77,
  LottoType.DE_SUPER6,
];

export const ALL_PROBABILITY_LOTTO = [
  ...OVERALL_PROBABILITY_LOTTO,
  ...POSITIONAL_PROBABILITY_LOTTO,
];
