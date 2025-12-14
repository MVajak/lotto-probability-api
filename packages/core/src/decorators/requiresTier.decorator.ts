import 'reflect-metadata';

import type {SubscriptionTierCode} from '@lotto/shared';

const REQUIRES_TIER_KEY = Symbol('requiresTier');

/**
 * Metadata stored for each tier-gated property
 */
export interface TierRequirement {
  propertyKey: string;
  requiredTier: SubscriptionTierCode;
}

/**
 * Decorator to mark a DTO property as requiring a minimum subscription tier.
 * Used as a double-safety mechanism alongside service-level feature gating.
 *
 * @example
 * ```typescript
 * @model()
 * export class MyResponseDto {
 *   @RequiresTier('PRO')
 *   @property({ type: 'object', required: false })
 *   trends?: TrendAnalysis;
 * }
 * ```
 */
export function RequiresTier(tier: SubscriptionTierCode): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existingRequirements: TierRequirement[] =
      Reflect.getMetadata(REQUIRES_TIER_KEY, target.constructor) || [];

    existingRequirements.push({
      propertyKey: String(propertyKey),
      requiredTier: tier,
    });

    Reflect.defineMetadata(REQUIRES_TIER_KEY, existingRequirements, target.constructor);
  };
}

/**
 * Get all tier requirements for a class
 */
export function getTierRequirements(target: Function): TierRequirement[] {
  return Reflect.getMetadata(REQUIRES_TIER_KEY, target) || [];
}
