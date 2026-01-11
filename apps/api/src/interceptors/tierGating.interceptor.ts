import type {
  Interceptor,
  InvocationContext,
  InvocationResult,
  Provider,
  ValueOrPromise,
} from '@loopback/core';
import {SecurityBindings} from '@loopback/security';

import {getTierGatedResponseClass, getTierRequirements} from '@lotto/core';
import type {SubscriptionTierCode} from '@lotto/shared';
import type {AuthenticatedUser} from '../types/auth.types';

/**
 * Tier hierarchy for access checks (higher index = more access)
 */
const TIER_HIERARCHY: SubscriptionTierCode[] = ['FREE', 'PRO', 'PREMIUM'];

/**
 * Check if a user's tier has access to a required tier
 */
function tierHasAccess(
  userTier: SubscriptionTierCode,
  requiredTier: SubscriptionTierCode,
): boolean {
  const userIndex = TIER_HIERARCHY.indexOf(userTier);
  const requiredIndex = TIER_HIERARCHY.indexOf(requiredTier);
  return userIndex >= requiredIndex;
}

/**
 * Strip tier-gated fields from a response based on user's subscription tier.
 */
function stripTierGatedFields<T extends object>(
  response: T,
  responseClass: Function,
  userTier: SubscriptionTierCode,
): T {
  const requirements = getTierRequirements(responseClass);

  if (requirements.length === 0) {
    return response;
  }

  for (const {propertyKey, requiredTier} of requirements) {
    if (!tierHasAccess(userTier, requiredTier)) {
      delete (response as Record<string, unknown>)[propertyKey];
    }
  }

  return response;
}

/**
 * Interceptor that automatically strips tier-gated fields from responses.
 *
 * For controller methods decorated with @TierGatedResponse(DtoClass),
 * this interceptor will remove fields marked with @RequiresTier
 * if the user's subscription tier is insufficient.
 */
export class TierGatingInterceptor implements Provider<Interceptor> {
  value() {
    return this.intercept.bind(this);
  }

  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ): Promise<InvocationResult> {
    // Execute the method first
    const result = await next();

    // If no result or no authenticated user, return as-is
    if (!result || typeof result !== 'object') {
      return result;
    }

    // Get the response class from method metadata
    const responseClass = getTierGatedResponseClass(invocationCtx.target, invocationCtx.methodName);

    // If method isn't decorated with @TierGatedResponse, return as-is
    if (!responseClass) {
      return result;
    }

    // Get user's subscription tier from the security context
    const user = await invocationCtx.get<AuthenticatedUser>(SecurityBindings.USER, {
      optional: true,
    });

    if (!user) {
      // No authenticated user - return as-is (should be handled by auth)
      return result;
    }

    const userTier = user.subscriptionTierCode;

    if (!userTier) {
      // No tier info - default to FREE
      return stripTierGatedFields(result as object, responseClass, 'FREE');
    }

    // Strip fields based on user's tier
    return stripTierGatedFields(result as object, responseClass, userTier);
  }
}
