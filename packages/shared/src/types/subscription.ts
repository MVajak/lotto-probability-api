/**
 * Subscription tier codes
 * Note: This is defined in shared so it can be used by both API and UI
 */
export type SubscriptionTierCode = 'FREE' | 'PRO' | 'PREMIUM';

/**
 * Features that can be gated by subscription tier
 */
export type SubscriptionFeature =
  | 'TIMELINE'
  | 'TRENDS'
  | 'WILSON_CI'
  | 'STD_DEVIATION'
  | 'MARKOV_CHAIN'
  | 'AUTOCORRELATION';
