import {authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {
  type Request,
  type Response,
  RestBindings,
  get,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import type Stripe from 'stripe';

import type {StripeService} from '@lotto/core';
import type {CurrentSubscriptionResponse, SubscriptionService} from '@lotto/core';

// ─────────────────────────────────────────────────────────────────────────────
// Request Types
// ─────────────────────────────────────────────────────────────────────────────

interface CreateCheckoutSessionRequest {
  tierCode: 'PRO' | 'PREMIUM';
  successUrl: string;
  cancelUrl: string;
}

interface CreatePortalSessionRequest {
  returnUrl: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────────────────────────────────────

export class SubscriptionController {
  constructor(
    @inject('services.SubscriptionService')
    private subscriptionService: SubscriptionService,
    @inject('services.StripeService')
    private stripeService: StripeService,
  ) {}

  @authenticate('jwt')
  @post('/subscriptions/create-checkout-session')
  @response(200, {
    description: 'Stripe Checkout Session URL',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            checkoutUrl: {type: 'string'},
          },
        },
      },
    },
  })
  async createCheckoutSession(
    @requestBody() body: CreateCheckoutSessionRequest,
    @inject('authentication.currentUser') currentUser: {userId: string; email: string},
  ): Promise<{checkoutUrl: string}> {
    const checkoutUrl = await this.subscriptionService.createCheckoutSession({
      userId: currentUser.userId,
      email: currentUser.email,
      tierCode: body.tierCode,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
    });

    return {checkoutUrl};
  }

  @authenticate('jwt')
  @post('/subscriptions/create-portal-session')
  @response(200, {
    description: 'Stripe Billing Portal URL',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            portalUrl: {type: 'string'},
          },
        },
      },
    },
  })
  async createPortalSession(
    @requestBody() body: CreatePortalSessionRequest,
    @inject('authentication.currentUser') currentUser: {userId: string},
  ): Promise<{portalUrl: string}> {
    const portalUrl = await this.subscriptionService.createPortalSession(
      currentUser.userId,
      body.returnUrl,
    );

    return {portalUrl};
  }

  @authenticate('jwt')
  @get('/subscriptions/current')
  @response(200, {description: 'Current subscription details'})
  async getCurrentSubscription(
    @inject('authentication.currentUser') currentUser: {userId: string},
  ): Promise<CurrentSubscriptionResponse> {
    return this.subscriptionService.getCurrentSubscription(currentUser.userId);
  }

  @post('/subscriptions/webhook')
  @response(200, {description: 'Webhook processed'})
  async handleStripeWebhook(
    @inject(RestBindings.Http.REQUEST) request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<{received: boolean}> {
    const signature = request.headers['stripe-signature'] as string;

    if (!signature) {
      response.status(400);
      return {received: false};
    }

    const rawBody = (request as Request & {rawBody?: Buffer}).rawBody;
    if (!rawBody) {
      response.status(400);
      return {received: false};
    }

    let event: Stripe.Event;
    try {
      event = this.stripeService.constructWebhookEvent(rawBody, signature);
    } catch {
      response.status(400);
      return {received: false};
    }

    await this.routeWebhookEvent(event);

    return {received: true};
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private
  // ───────────────────────────────────────────────────────────────────────────

  private async routeWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.subscriptionService.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;

      case 'customer.subscription.updated':
        await this.subscriptionService.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.deleted':
        await this.subscriptionService.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'invoice.payment_failed':
        await this.subscriptionService.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }
}
