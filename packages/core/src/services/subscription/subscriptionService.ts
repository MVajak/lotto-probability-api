import {BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import type Stripe from 'stripe';

import type {
  Subscription,
  SubscriptionEventType,
  SubscriptionStatus,
  SubscriptionTier,
  SubscriptionTierCode,
} from '@lotto/database';
import {
  SubscriptionHistoryRepository,
  SubscriptionRepository,
  SubscriptionTierRepository,
  UserRepository,
} from '@lotto/database';
import type {StripeService} from '../stripe/stripeService';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateCheckoutParams {
  userId: string;
  email: string;
  tierCode: 'PRO' | 'PREMIUM';
  successUrl: string;
  cancelUrl: string;
}

export interface CurrentSubscriptionResponse {
  id: string;
  tier: {
    code: SubscriptionTierCode;
    price: number;
    features: string[];
  };
  status: string;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@injectable({scope: BindingScope.TRANSIENT})
export class SubscriptionService {
  constructor(
    @inject('services.StripeService')
    private stripeService: StripeService,
    @repository(SubscriptionRepository)
    private subscriptionRepository: SubscriptionRepository,
    @repository(SubscriptionTierRepository)
    private subscriptionTierRepository: SubscriptionTierRepository,
    @repository(SubscriptionHistoryRepository)
    private subscriptionHistoryRepository: SubscriptionHistoryRepository,
    @repository(UserRepository)
    private userRepository: UserRepository,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // Public Methods
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Create a Stripe Checkout session for upgrading subscription
   */
  async createCheckoutSession(params: CreateCheckoutParams): Promise<string> {
    const {userId, email, tierCode, successUrl, cancelUrl} = params;

    const targetTier = await this.getValidatedTargetTier(tierCode);
    const subscription = await this.getRequiredSubscription(userId);

    await this.validateNotAlreadySubscribed(subscription.tierId, tierCode);

    const stripeCustomerId = await this.ensureStripeCustomer(subscription, userId, email);

    const session = await this.stripeService.createCheckoutSession({
      customerId: stripeCustomerId,
      priceId: targetTier.stripePriceId!,
      userId,
      tierCode,
      successUrl,
      cancelUrl,
    });

    if (!session.url) {
      throw new HttpErrors.InternalServerError('Failed to create checkout session.');
    }

    return session.url;
  }

  /**
   * Create a Stripe Billing Portal session
   */
  async createPortalSession(userId: string, returnUrl: string): Promise<string> {
    const subscription = await this.getRequiredSubscription(userId);

    if (!subscription.stripeCustomerId) {
      throw new HttpErrors.BadRequest('No active paid subscription found.');
    }

    const session = await this.stripeService.createBillingPortalSession(
      subscription.stripeCustomerId,
      returnUrl,
    );

    return session.url;
  }

  /**
   * Get current subscription with tier details
   */
  async getCurrentSubscription(userId: string): Promise<CurrentSubscriptionResponse> {
    const subscription = await this.getRequiredSubscription(userId);
    const tier = await this.subscriptionTierRepository.findById(subscription.tierId);

    return {
      id: subscription.id,
      tier: {
        code: tier.code,
        price: tier.price,
        features: tier.features,
      },
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Webhook Handlers
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Handle checkout.session.completed event
   */
  async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const tierCode = session.metadata?.tierCode as SubscriptionTierCode | undefined;

    if (!userId || !tierCode) {
      console.error('Missing userId or tierCode in checkout session metadata');
      return;
    }

    const newTier = await this.subscriptionTierRepository.findByCode(tierCode);
    if (!newTier) {
      console.error(`Tier ${tierCode} not found`);
      return;
    }

    const subscription = await this.subscriptionRepository.findByUserId(userId);
    if (!subscription) {
      console.error(`Subscription not found for user ${userId}`);
      return;
    }

    const oldTier = await this.subscriptionTierRepository.findById(subscription.tierId);

    const stripeSub = session.subscription
      ? await this.stripeService.getSubscription(session.subscription as string)
      : null;

    const updateData = this.buildSubscriptionUpdate(newTier, session, stripeSub);
    await this.subscriptionRepository.updateById(subscription.id, updateData);

    await this.createHistoryEntry({
      subscriptionId: subscription.id,
      userId,
      eventType: 'upgraded',
      fromTier: oldTier.code,
      toTier: newTier.code,
      fromStatus: subscription.status,
      toStatus: 'active',
      stripeEventId: session.id,
    });

    console.log(`✅ User ${userId} upgraded to ${tierCode}`);
  }

  /**
   * Handle customer.subscription.updated event
   */
  async handleSubscriptionUpdated(stripeSub: Stripe.Subscription): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {stripeSubscriptionId: stripeSub.id},
    });

    if (!subscription) {
      console.error(`Subscription not found for Stripe subscription ${stripeSub.id}`);
      return;
    }

    const updateData: Partial<Subscription> = {
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      status: stripeSub.status === 'active' ? 'active' : subscription.status,
    };

    const periodDates = this.extractPeriodDates(stripeSub);
    if (periodDates) {
      updateData.currentPeriodStart = periodDates.start;
      updateData.currentPeriodEnd = periodDates.end;
    }

    await this.subscriptionRepository.updateById(subscription.id, updateData);
    console.log(`📝 Subscription ${subscription.id} updated`);
  }

  /**
   * Handle customer.subscription.deleted event
   */
  async handleSubscriptionDeleted(stripeSub: Stripe.Subscription): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {stripeSubscriptionId: stripeSub.id},
    });

    if (!subscription) {
      console.error(`Subscription not found for Stripe subscription ${stripeSub.id}`);
      return;
    }

    const freeTier = await this.subscriptionTierRepository.findByCode('FREE');
    if (!freeTier) {
      console.error('FREE tier not found');
      return;
    }

    const oldTier = await this.subscriptionTierRepository.findById(subscription.tierId);

    await this.subscriptionRepository.updateById(subscription.id, {
      tierId: freeTier.id,
      stripeSubscriptionId: null,
      stripePriceId: null,
      status: 'active',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      canceledAt: new Date(),
    });

    await this.createHistoryEntry({
      subscriptionId: subscription.id,
      userId: subscription.userId,
      eventType: 'downgraded',
      fromTier: oldTier.code,
      toTier: 'FREE',
      fromStatus: subscription.status,
      toStatus: 'active',
      stripeEventId: stripeSub.id,
    });

    console.log(`⬇️ Subscription ${subscription.id} downgraded to FREE`);
  }

  /**
   * Handle invoice.payment_failed event
   */
  async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const stripeSubscriptionId = this.extractSubscriptionId(invoice);
    if (!stripeSubscriptionId) return;

    const subscription = await this.subscriptionRepository.findOne({
      where: {stripeSubscriptionId},
    });

    if (!subscription) {
      console.error(`Subscription not found for Stripe subscription ${stripeSubscriptionId}`);
      return;
    }

    await this.subscriptionRepository.updateById(subscription.id, {
      status: 'past_due',
    });

    const tier = await this.subscriptionTierRepository.findById(subscription.tierId);

    await this.createHistoryEntry({
      subscriptionId: subscription.id,
      userId: subscription.userId,
      eventType: 'payment_failed',
      fromTier: tier.code,
      toTier: tier.code,
      fromStatus: subscription.status,
      toStatus: 'past_due',
      reason: 'Payment failed',
      stripeEventId: invoice.id,
    });

    console.log(`⚠️ Payment failed for subscription ${subscription.id}`);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private Helpers
  // ───────────────────────────────────────────────────────────────────────────

  private async getValidatedTargetTier(tierCode: string): Promise<SubscriptionTier> {
    if (!['PRO', 'PREMIUM'].includes(tierCode)) {
      throw new HttpErrors.BadRequest('Invalid tier code. Must be PRO or PREMIUM.');
    }

    const tier = await this.subscriptionTierRepository.findByCode(tierCode as SubscriptionTierCode);
    if (!tier?.stripePriceId) {
      throw new HttpErrors.BadRequest(`Tier ${tierCode} is not configured for payments.`);
    }

    return tier;
  }

  private async getRequiredSubscription(userId: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findByUserId(userId);
    if (!subscription) {
      throw new HttpErrors.NotFound('Subscription not found.');
    }
    return subscription;
  }

  private async validateNotAlreadySubscribed(
    currentTierId: string,
    targetTierCode: string,
  ): Promise<void> {
    const currentTier = await this.subscriptionTierRepository.findById(currentTierId);
    if (currentTier.code === targetTierCode) {
      throw new HttpErrors.Conflict('You are already subscribed to this tier.');
    }
  }

  private async ensureStripeCustomer(
    subscription: Subscription,
    userId: string,
    email: string,
  ): Promise<string> {
    if (subscription.stripeCustomerId) {
      return subscription.stripeCustomerId;
    }

    const customer = await this.stripeService.createCustomer(email, userId);

    await this.subscriptionRepository.updateById(subscription.id, {
      stripeCustomerId: customer.id,
    });

    return customer.id;
  }

  private buildSubscriptionUpdate(
    newTier: SubscriptionTier,
    session: Stripe.Checkout.Session,
    stripeSub: Stripe.Subscription | null,
  ): Partial<Subscription> {
    const updateData: Partial<Subscription> = {
      tierId: newTier.id,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      stripePriceId: newTier.stripePriceId ?? undefined,
      status: 'active',
      cancelAtPeriodEnd: false,
    };

    const periodDates = stripeSub ? this.extractPeriodDates(stripeSub) : null;
    if (periodDates) {
      updateData.currentPeriodStart = periodDates.start;
      updateData.currentPeriodEnd = periodDates.end;
    }

    return updateData;
  }

  private extractPeriodDates(stripeSub: Stripe.Subscription): {start: Date; end: Date} | null {
    if (stripeSub.items.data.length === 0) return null;

    const firstItem = stripeSub.items.data[0];
    return {
      start: new Date(firstItem.current_period_start * 1000),
      end: new Date(firstItem.current_period_end * 1000),
    };
  }

  private extractSubscriptionId(invoice: Stripe.Invoice): string | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionData = (invoice as any).subscription;
    return typeof subscriptionData === 'string' ? subscriptionData : (subscriptionData?.id ?? null);
  }

  private async createHistoryEntry(data: {
    subscriptionId: string;
    userId: string;
    eventType: SubscriptionEventType;
    fromTier: SubscriptionTierCode;
    toTier: SubscriptionTierCode;
    fromStatus: SubscriptionStatus;
    toStatus: SubscriptionStatus;
    stripeEventId?: string;
    reason?: string;
  }): Promise<void> {
    await this.subscriptionHistoryRepository.create({
      ...data,
      createdAt: new Date(),
    });
  }
}
