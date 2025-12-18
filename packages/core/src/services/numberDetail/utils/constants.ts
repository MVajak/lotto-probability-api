/**
 * Minimum number of appearances required for meaningful pair analysis.
 * Need enough occurrences to calculate reliable co-occurrence statistics.
 */
export const MIN_APPEARANCES_FOR_PAIR_ANALYSIS = 5;

/**
 * Chi-square critical value for p < 0.05 with 1 degree of freedom.
 * Used for testing significance of association between number pairs.
 */
export const CHI_SQUARE_CRITICAL_VALUE_P05 = 3.841;

/**
 * Chi-square critical value for p < 0.05 with 6 degrees of freedom.
 * Used for day of week analysis (7 categories - 1 = 6 df).
 */
export const CHI_SQUARE_CRITICAL_6_DF = 12.592;

/**
 * Chi-square critical value for p < 0.05 with 11 degrees of freedom.
 * Used for month analysis (12 categories - 1 = 11 df).
 */
export const CHI_SQUARE_CRITICAL_11_DF = 19.675;

/**
 * Minimum samples per day of week for reliable frequency calculation.
 */
export const MIN_DAY_SAMPLES = 3;

/**
 * Minimum samples per month for reliable frequency calculation.
 */
export const MIN_MONTH_SAMPLES = 2;

/**
 * Threshold for determining positive/negative correlation interpretation.
 * Average autocorrelation above this indicates positive correlation,
 * below negative indicates negative correlation.
 */
export const CORRELATION_INTERPRETATION_THRESHOLD = 0.1;

/**
 * Multiplier for hot hand detection in Markov chain analysis.
 * If P(appeared→appeared) > theoretical × this value, indicates "hot hand" pattern.
 */
export const HOT_HAND_THRESHOLD_MULTIPLIER = 1.5;

/**
 * Multiplier for gambler's fallacy detection in Markov chain analysis.
 * If P(appeared→appeared) < theoretical × this value, indicates "gambler's fallacy" pattern.
 */
export const GAMBLERS_FALLACY_THRESHOLD_MULTIPLIER = 0.5;

/**
 * Z-score for 90% confidence interval (5th/95th percentiles).
 * Used in Monte Carlo simulation for percentile estimation.
 */
export const Z_SCORE_90_CONFIDENCE = 1.645;
