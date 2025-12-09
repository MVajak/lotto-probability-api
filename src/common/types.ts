export enum LottoType {
  EURO = 'EURO',
  VIKINGLOTTO = 'VIKINGLOTTO',
  BINGO = 'BINGO',
  KENO = 'KENO',
  JOKKER = 'JOKKER',
}

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
 * Frequency status classification
 */
export type FrequencyStatus = 'frequent' | 'rare' | 'normal';

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
 * Note: confidenceInterval, theoreticalProbability, and deviation are available via /number-history endpoint
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
}

export enum DateFormat {
  European = 'dd.MM.yyyy',
}

export const OVERALL_PROBABILITY_LOTTO = [
  LottoType.EURO,
  LottoType.VIKINGLOTTO,
  LottoType.KENO,
  LottoType.BINGO,
];
export const POSITIONAL_PROBABILITY_LOTTO = [LottoType.JOKKER];

export const ALL_PROBABILITY_LOTTO = [
  ...OVERALL_PROBABILITY_LOTTO,
  ...POSITIONAL_PROBABILITY_LOTTO,
];
