import {BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';
import type Stripe from 'stripe';

import type {Subscription, SubscriptionTier} from '@lotto/database';
import {SubscriptionRepository, SubscriptionTierRepository, UserRepository} from '@lotto/database';
import type {SubscriptionTierCode} from '@lotto/shared';
import type {StripeService} from '../stripe/stripeService';
import type {SubscriptionHistoryService} from './subscriptionHistoryService';

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

// ─────────────────────────────────────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────────────────────────────────────

@injectable({scope: BindingScope.TRANSIENT})
export class SubscriptionService {
  constructor(
    @inject('services.StripeService')
    private stripeService: StripeService,
    @inject('services.SubscriptionHistoryService')
    private subscriptionHistoryService: SubscriptionHistoryService,
    @repository(SubscriptionRepository)
    private subscriptionRepository: SubscriptionRepository,
    @repository(SubscriptionTierRepository)
    private subscriptionTierRepository: SubscriptionTierRepository,
    @repository(UserRepository)
    private userRepository: UserRepository,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // Public Methods
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Create a Stripe Checkout session for new subscription (FREE → Paid only)
   * For tier changes between paid tiers, use changeTier() instead
   */
  async createCheckoutSession(params: CreateCheckoutParams): Promise<string> {
    const {userId, email, tierCode, successUrl, cancelUrl} = params;

    const targetTier = await this.getValidatedTargetTier(tierCode);
    const subscription = await this.getRequiredSubscription(userId);

    // Block if user already has an active Stripe subscription
    if (subscription.stripeSubscriptionId) {
      throw new HttpErrors.BadRequest(
        'You already have an active subscription. Use change-tier to switch plans.',
      );
    }

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
   * Handle incoming Stripe webhook
   * Verifies signature and routes event to appropriate handler
   */
  async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const event = this.stripeService.constructWebhookEvent(rawBody, signature);
    await this.routeWebhookEvent(event);
  }

  /**
   * Change subscription tier (PRO ↔ PREMIUM)
   * Uses Stripe's subscription update for proper proration
   */
  async changeTier(userId: string, newTierCode: 'PRO' | 'PREMIUM'): Promise<void> {
    const subscription = await this.getRequiredSubscription(userId);

    // Must have existing Stripe subscription
    if (!subscription.stripeSubscriptionId) {
      throw new HttpErrors.BadRequest('No active subscription. Use checkout to subscribe.');
    }

    // Can't change to same tier
    const currentTier = await this.subscriptionTierRepository.findById(subscription.tierId);
    if (currentTier.code === newTierCode) {
      throw new HttpErrors.Conflict('Already on this tier.');
    }

    // Get new tier
    const newTier = await this.subscriptionTierRepository.findByCode(newTierCode);
    if (!newTier?.stripePriceId) {
      throw new HttpErrors.BadRequest('Tier not configured for payments.');
    }

    // If cancelled, resume first
    if (subscription.cancelAtPeriodEnd) {
      await this.stripeService.resumeSubscription(subscription.stripeSubscriptionId);
    }

    // Update subscription in Stripe (handles proration)
    const updatedSub = await this.stripeService.updateSubscriptionPrice(
      subscription.stripeSubscriptionId,
      newTier.stripePriceId,
    );

    // Update local DB
    const oldTierId = subscription.tierId;
    const periodDates = this.extractPeriodDates(updatedSub);
    await this.subscriptionRepository.updateById(subscription.id, {
      tierId: newTier.id,
      stripePriceId: newTier.stripePriceId,
      cancelAtPeriodEnd: false,
      cancelAt: this.extractCancelAt(updatedSub),
      ...(periodDates && {
        currentPeriodStart: periodDates.start,
        currentPeriodEnd: periodDates.end,
      }),
    });

    // Log history
    const isUpgrade = currentTier.code === 'PRO' && newTierCode === 'PREMIUM';
    await this.subscriptionHistoryService.createEntry({
      subscriptionId: subscription.id,
      userId,
      oldTierId,
      newTierId: newTier.id,
      fromStatus: subscription.status,
      toStatus: 'active',
      eventType: isUpgrade ? 'upgraded' : 'downgraded',
    });
  }

  /**
   * Resume a cancelled subscription (undo cancel at period end)
   */
  async resumeSubscription(userId: string): Promise<void> {
    const subscription = await this.getRequiredSubscription(userId);

    if (!subscription.stripeSubscriptionId) {
      throw new HttpErrors.BadRequest('No active subscription to resume.');
    }

    if (!subscription.cancelAtPeriodEnd) {
      throw new HttpErrors.Conflict('Subscription is not cancelled.');
    }

    // Resume in Stripe - capture the response
    const stripeSub = await this.stripeService.resumeSubscription(subscription.stripeSubscriptionId);

    // Update local DB with period dates from Stripe
    const periodDates = this.extractPeriodDates(stripeSub);
    await this.subscriptionRepository.updateById(subscription.id, {
      cancelAtPeriodEnd: false,
      cancelAt: this.extractCancelAt(stripeSub),
      ...(periodDates && {
        currentPeriodStart: periodDates.start,
        currentPeriodEnd: periodDates.end,
      }),
    });

    // Log history
    await this.subscriptionHistoryService.createEntry({
      subscriptionId: subscription.id,
      userId,
      oldTierId: subscription.tierId,
      newTierId: subscription.tierId,
      fromStatus: subscription.status,
      toStatus: 'active',
      eventType: 'reactivated',
      reason: 'User resumed cancelled subscription',
    });
  }

  /**
   * Cancel subscription at end of current billing period
   * User keeps access until period ends, then reverts to FREE
   */
  async cancelSubscription(userId: string): Promise<void> {
    const subscription = await this.getRequiredSubscription(userId);

    // Validate user has an active paid subscription
    if (!subscription.stripeSubscriptionId) {
      throw new HttpErrors.BadRequest('No active paid subscription to cancel.');
    }

    // Check if already set to cancel
    if (subscription.cancelAtPeriodEnd) {
      throw new HttpErrors.Conflict('Subscription is already set to cancel at period end.');
    }

    // Cancel in Stripe and get updated subscription
    const stripeSub = await this.stripeService.cancelSubscriptionAtPeriodEnd(
      subscription.stripeSubscriptionId,
    );

    // Update local DB with period end date and cancel_at
    const periodDates = this.extractPeriodDates(stripeSub);
    await this.subscriptionRepository.updateById(subscription.id, {
      cancelAtPeriodEnd: true,
      cancelAt: this.extractCancelAt(stripeSub),
      ...(periodDates && {
        currentPeriodEnd: periodDates.end,
      }),
    });

    // Log to history
    await this.subscriptionHistoryService.createEntry({
      subscriptionId: subscription.id,
      userId,
      oldTierId: subscription.tierId,
      newTierId: subscription.tierId,
      fromStatus: subscription.status,
      toStatus: subscription.status,
      eventType: 'canceled',
      reason: 'User requested cancellation',
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private Webhook Handlers
  // ───────────────────────────────────────────────────────────────────────────

  private async routeWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
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

    const oldTierId = subscription.tierId;

    const stripeSub = session.subscription
      ? await this.stripeService.getSubscription(session.subscription as string)
      : null;

    const updateData = this.buildSubscriptionUpdate(newTier, session, stripeSub);
    await this.subscriptionRepository.updateById(subscription.id, updateData);

    await this.subscriptionHistoryService.createEntry({
      subscriptionId: subscription.id,
      userId,
      oldTierId,
      newTierId: newTier.id,
      fromStatus: subscription.status,
      toStatus: 'active',
      eventType: 'upgraded',
      stripeEventId: session.id,
    });
  }

  private async handleSubscriptionUpdated(stripeSub: Stripe.Subscription): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {stripeSubscriptionId: stripeSub.id},
    });

    if (!subscription) {
      console.error(`Subscription not found for Stripe subscription ${stripeSub.id}`);
      return;
    }

    const updateData: Partial<Subscription> = {
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      cancelAt: this.extractCancelAt(stripeSub),
      status: stripeSub.status === 'active' ? 'active' : subscription.status,
    };

    const periodDates = this.extractPeriodDates(stripeSub);
    if (periodDates) {
      updateData.currentPeriodStart = periodDates.start;
      updateData.currentPeriodEnd = periodDates.end;
    }

    await this.subscriptionRepository.updateById(subscription.id, updateData);
  }

  private async handleSubscriptionDeleted(stripeSub: Stripe.Subscription): Promise<void> {
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

    const oldTierId = subscription.tierId;

    await this.subscriptionRepository.updateById(subscription.id, {
      tierId: freeTier.id,
      stripeSubscriptionId: null,
      stripePriceId: null,
      status: 'active',
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      cancelAt: null,
      canceledAt: new Date(),
    });

    await this.subscriptionHistoryService.createEntry({
      subscriptionId: subscription.id,
      userId: subscription.userId,
      oldTierId,
      newTierId: freeTier.id,
      fromStatus: subscription.status,
      toStatus: 'active',
      stripeEventId: stripeSub.id,
    });
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
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

    await this.subscriptionHistoryService.createEntry({
      subscriptionId: subscription.id,
      userId: subscription.userId,
      oldTierId: subscription.tierId,
      newTierId: subscription.tierId,
      fromStatus: subscription.status,
      toStatus: 'past_due',
      eventType: 'payment_failed',
      reason: 'Payment failed',
      stripeEventId: invoice.id,
    });
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
      cancelAt: stripeSub ? this.extractCancelAt(stripeSub) : null,
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

  private extractCancelAt(stripeSub: Stripe.Subscription): Date | null {
    return stripeSub.cancel_at ? new Date(stripeSub.cancel_at * 1000) : null;
  }

  private extractSubscriptionId(invoice: Stripe.Invoice): string | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionData = (invoice as any).subscription;
    return typeof subscriptionData === 'string' ? subscriptionData : (subscriptionData?.id ?? null);
  }
}
