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
  // Spanish lotteries
  ES_LA_PRIMITIVA = 'ES_LA_PRIMITIVA',
  ES_BONOLOTO = 'ES_BONOLOTO',
  ES_EL_GORDO = 'ES_EL_GORDO',
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
  // Spanish lotteries
  LottoType.ES_LA_PRIMITIVA,
  LottoType.ES_BONOLOTO,
  LottoType.ES_EL_GORDO,
  // Shared
  LottoType.EURODREAMS,
];

export const POSITIONAL_PROBABILITY_LOTTO = [LottoType.EST_JOKKER];

export const ALL_PROBABILITY_LOTTO = [
  ...OVERALL_PROBABILITY_LOTTO,
  ...POSITIONAL_PROBABILITY_LOTTO,
];
