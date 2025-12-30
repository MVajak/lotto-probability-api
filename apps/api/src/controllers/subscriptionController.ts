import {AuthenticationBindings, authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {type Request, type Response, RestBindings, post, requestBody, response} from '@loopback/rest';

import type {SubscriptionService} from '@lotto/core';

import type {AuthenticatedUser} from '../types/auth.types';

// ─────────────────────────────────────────────────────────────────────────────
// Request Types
// ─────────────────────────────────────────────────────────────────────────────

interface CreateCheckoutSessionRequest {
  tierCode: 'PRO' | 'PREMIUM';
  successUrl: string;
  cancelUrl: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────────────────────────────────────

export class SubscriptionController {
  constructor(
    @inject('services.SubscriptionService')
    private subscriptionService: SubscriptionService,
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
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: AuthenticatedUser,
  ): Promise<{checkoutUrl: string}> {
    const checkoutUrl = await this.subscriptionService.createCheckoutSession({
      userId: currentUser.id,
      email: currentUser.email,
      tierCode: body.tierCode,
      successUrl: body.successUrl,
      cancelUrl: body.cancelUrl,
    });

    return {checkoutUrl};
  }

  @authenticate('jwt')
  @post('/subscriptions/cancel')
  @response(204, {description: 'Subscription cancelled at period end'})
  async cancelSubscription(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: AuthenticatedUser,
  ): Promise<void> {
    await this.subscriptionService.cancelSubscription(currentUser.id);
  }

  @post('/subscriptions/webhook')
  @response(200, {description: 'Webhook processed'})
  async handleStripeWebhook(
    @requestBody({
      description: 'Stripe webhook payload',
      required: true,
      content: {
        'application/json': {
          'x-parser': 'raw',
          schema: {type: 'object'},
        },
      },
    })
    rawBody: Buffer,
    @inject(RestBindings.Http.REQUEST) request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<{received: boolean}> {
    const signature = request.headers['stripe-signature'] as string;

    if (!signature) {
      response.status(400);
      return {received: false};
    }

    try {
      await this.subscriptionService.handleWebhook(rawBody, signature);
      return {received: true};
    } catch (err) {
      console.error('[Webhook] Processing failed:', err);
      response.status(400);
      return {received: false};
    }
  }
}
