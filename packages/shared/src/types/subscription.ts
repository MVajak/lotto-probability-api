/**
 * Subscription tier codes
 */
export type SubscriptionTierCode = 'FREE' | 'PRO' | 'PREMIUM';

/**
 * All subscription features stored in the database.
 * This is the single source of truth for feature names.
 */
export type SubscriptionFeature =
  // PRO tier analysis features
  | 'TIMELINE'
  | 'TRENDS'
  | 'WILSON_CI'
  | 'STD_DEVIATION'
  // PREMIUM tier analysis features
  | 'MARKOV_CHAIN'
  | 'AUTOCORRELATION'
  | 'PAIR_ANALYSIS'
  | 'MONTE_CARLO'
  | 'SEASONAL_PATTERNS';
