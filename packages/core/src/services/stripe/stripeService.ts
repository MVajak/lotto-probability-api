import {BindingScope, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import Stripe from 'stripe';

@injectable({scope: BindingScope.SINGLETON})
export class StripeService {
  private readonly stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    this.stripe = new Stripe(secretKey);
  }

  /**
   * Create a new Stripe customer
   */
  async createCustomer(email: string, userId: string): Promise<Stripe.Customer> {
    return this.stripe.customers.create({
      email,
      metadata: {userId},
    });
  }

  /**
   * Get an existing Stripe customer by ID
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      if (customer.deleted) {
        return null;
      }
      return customer as Stripe.Customer;
    } catch {
      return null;
    }
  }

  /**
   * Create a Stripe Checkout Session for subscription upgrade
   */
  async createCheckoutSession(params: {
    customerId: string;
    priceId: string;
    userId: string;
    tierCode: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    const {customerId, priceId, userId, tierCode, successUrl, cancelUrl} = params;

    return this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        tierCode,
      },
      subscription_data: {
        metadata: {
          userId,
          tierCode,
        },
      },
    });
  }

  /**
   * Create a Stripe Billing Portal session for managing subscription
   */
  async createBillingPortalSession(
    customerId: string,
    returnUrl: string,
  ): Promise<Stripe.BillingPortal.Session> {
    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  /**
   * Retrieve a subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch {
      return null;
    }
  }

  /**
   * Cancel a subscription at period end
   */
  async cancelSubscriptionAtPeriodEnd(subscriptionId: string): Promise<Stripe.Subscription> {
    return this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  /**
   * Construct and verify a webhook event from Stripe
   */
  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new HttpErrors.InternalServerError('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new HttpErrors.BadRequest(
        `Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Get Stripe instance for advanced operations
   */
  getStripeInstance(): Stripe {
    return this.stripe;
  }
}
