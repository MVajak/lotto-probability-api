import {Subscription, User} from '../models';

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
  tier: 'free' | 'pro' | 'premium';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * Current user info from JWT (injected by authentication middleware)
 */
export interface CurrentUser {
  userId: string;
  email: string;
  subscriptionTier: 'free' | 'pro' | 'premium';
  iat?: number;
  exp?: number;
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
export function toAuthSubscriptionResponse(subscription: Subscription): AuthSubscriptionResponse {
  return {
    id: subscription.id,
    tier: subscription.tier,
    status: subscription.status,
    currentPeriodEnd: subscription.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
  };
}
