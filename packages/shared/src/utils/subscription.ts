import type {SubscriptionFeature, SubscriptionTierCode} from '../types';

/**
 * Features available for each tier
 * Note: Higher tiers inherit all features from lower tiers
 */
export const TIER_FEATURES: Record<SubscriptionTierCode, SubscriptionFeature[]> = {
  FREE: [],
  PRO: ['TIMELINE', 'TRENDS', 'WILSON_CI', 'STD_DEVIATION'],
  PREMIUM: ['TIMELINE', 'TRENDS', 'WILSON_CI', 'STD_DEVIATION', 'MARKOV_CHAIN', 'AUTOCORRELATION'],
};

/**
 * Maximum date range in months for each tier
 */
export const TIER_DATE_RANGE_MONTHS: Record<SubscriptionTierCode, number> = {
  FREE: 2,
  PRO: 24, // 2 years
  PREMIUM: 60, // 5 years
};

/**
 * Check if a tier has access to a specific feature
 */
export function hasFeature(tier: SubscriptionTierCode, feature: SubscriptionFeature): boolean {
  return TIER_FEATURES[tier].includes(feature);
}

/**
 * Get the maximum date range in months for a tier
 */
export function getMaxDateRangeMonths(tier: SubscriptionTierCode): number {
  return TIER_DATE_RANGE_MONTHS[tier];
}

/**
 * Enforce the minimum allowed date based on tier's max range
 * If the requested dateFrom is older than allowed, returns the earliest allowed date
 */
export function enforceMinDate(dateFrom: string, tier: SubscriptionTierCode): string {
  const maxMonths = getMaxDateRangeMonths(tier);
  const now = new Date();
  const minAllowedDate = new Date(now.getFullYear(), now.getMonth() - maxMonths, now.getDate());

  const requestedDate = new Date(dateFrom);

  if (requestedDate < minAllowedDate) {
    return minAllowedDate.toISOString().split('T')[0];
  }

  return dateFrom;
}
