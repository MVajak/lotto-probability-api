/**
 * Subscription tier codes
 */
export type SubscriptionTierCode = 'FREE' | 'PRO' | 'PREMIUM';

/**
 * All subscription features stored in the database.
 * This is the single source of truth for feature names.
 */
export type SubscriptionFeature =
  // FREE tier features
  | 'STATS_2_MONTHS'
  | 'BASIC_FREQUENCY'
  | 'AD_SUPPORTED'
  // PRO tier analysis features
  | 'STATS_2_YEARS'
  | 'NO_ADS'
  | 'TIMELINE'
  | 'TRENDS'
  | 'WILSON_CI'
  | 'STD_DEVIATION'
  // PREMIUM tier analysis features
  | 'STATS_5_YEARS'
  | 'MARKOV_CHAIN'
  | 'AUTOCORRELATION'
  | 'PAIR_ANALYSIS'
  | 'MONTE_CARLO'
  | 'SEASONAL_PATTERNS';
