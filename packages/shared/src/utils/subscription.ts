import type {SubscriptionFeature, SubscriptionTierCode} from '../types';

/**
 * Minimum number of draws required for statistically meaningful analysis.
 * This threshold ensures validity of Normal approximation to binomial distribution
 * (rule of thumb: n×p ≥ 5 and n×(1-p) ≥ 5).
 */
export const MIN_DRAWS_FOR_STATISTICS = 20;

/**
 * Minimum number of draws required for seasonal pattern analysis.
 */
export const MIN_DRAWS_FOR_SEASONAL = 30;

/**
 * Centralized feature configuration combining subscription tier requirements
 * with minimum draw thresholds for statistical validity.
 */
export const FEATURE_CONFIG = {
  // PRO tier features (no min draws needed)
  TIMELINE: {tier: 'PRO' as const, minDraws: 0},
  TRENDS: {tier: 'PRO' as const, minDraws: 0},
  WILSON_CI: {tier: 'PRO' as const, minDraws: 0},
  STD_DEVIATION: {tier: 'PRO' as const, minDraws: 0},

  // PREMIUM tier features (require sufficient data for statistical validity)
  MARKOV_CHAIN: {tier: 'PREMIUM' as const, minDraws: MIN_DRAWS_FOR_STATISTICS},
  AUTOCORRELATION: {tier: 'PREMIUM' as const, minDraws: MIN_DRAWS_FOR_STATISTICS},
  PAIR_ANALYSIS: {tier: 'PREMIUM' as const, minDraws: MIN_DRAWS_FOR_STATISTICS},
  MONTE_CARLO: {tier: 'PREMIUM' as const, minDraws: MIN_DRAWS_FOR_STATISTICS},
  SEASONAL_PATTERNS: {tier: 'PREMIUM' as const, minDraws: MIN_DRAWS_FOR_SEASONAL},
} as const;

/**
 * Features available for each tier (derived from FEATURE_CONFIG for backward compatibility)
 * Note: Higher tiers inherit all features from lower tiers
 */
export const TIER_FEATURES: Record<SubscriptionTierCode, SubscriptionFeature[]> = {
  FREE: [],
  PRO: Object.entries(FEATURE_CONFIG)
    .filter(([_, config]) => config.tier === 'PRO')
    .map(([name]) => name as SubscriptionFeature),
  PREMIUM: Object.keys(FEATURE_CONFIG) as SubscriptionFeature[],
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
 * Get feature requirements including tier access and minimum draws needed
 */
export function getFeatureRequirements(
  tier: SubscriptionTierCode,
  feature: keyof typeof FEATURE_CONFIG,
): {allowed: boolean; minDraws: number} {
  const config = FEATURE_CONFIG[feature];
  const tierOrder: Record<SubscriptionTierCode, number> = {FREE: 0, PRO: 1, PREMIUM: 2};
  const allowed = tierOrder[tier] >= tierOrder[config.tier];
  return {allowed, minDraws: config.minDraws};
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
