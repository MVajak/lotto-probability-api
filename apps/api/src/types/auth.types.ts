import type {UserProfile} from '@loopback/security';
import type {Subscription, User} from '@lotto/database';
import type {SubscriptionTierCode} from '@lotto/shared';

/**
 * Extended UserProfile with custom fields from JWT
 * Makes id and email required (they're always set by our JWT strategy)
 */
export interface AuthenticatedUser extends UserProfile {
  id: string;
  email: string;
  subscriptionTier: SubscriptionTierCode;
}

/**
 * JWT Token Pair
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * User data returned in authentication responses (excludes sensitive fields)
 */
export interface AuthUserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  userState: 'pending' | 'active' | 'suspended' | 'deleted';
  emailVerified: boolean;
  language: string;
  timezone: string;
  loginCount: number;
  createdAt: Date;
}

/**
 * Subscription data returned in authentication responses
 */
export interface AuthSubscriptionResponse {
  id: string;
  tier: SubscriptionTierCode;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  cancelAt: Date | null;
}

/**
 * Helper to convert User model to AuthUserResponse
 */
export function toAuthUserResponse(user: User): AuthUserResponse {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    avatarUrl: user.avatarUrl ?? null,
    userState: user.userState,
    emailVerified: user.emailVerified,
    language: user.language,
    timezone: user.timezone,
    loginCount: user.loginCount,
    createdAt: user.createdAt,
  };
}

/**
 * Helper to convert Subscription model to AuthSubscriptionResponse
 */
export function toAuthSubscriptionResponse(
  subscription: Subscription,
  tierCode: SubscriptionTierCode,
): AuthSubscriptionResponse {
  return {
    id: subscription.id,
    tier: tierCode,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    cancelAt: subscription.cancelAt ?? null,
  };
}
