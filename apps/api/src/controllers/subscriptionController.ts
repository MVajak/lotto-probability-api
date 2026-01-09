import {AuthenticationBindings, authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {type Request, type Response, RestBindings, post, requestBody, response} from '@loopback/rest';

import type {LoggerService, SubscriptionService} from '@lotto/core';

import type {AuthenticatedUser} from '../types/auth.types';

// ─────────────────────────────────────────────────────────────────────────────
// Request Types
// ─────────────────────────────────────────────────────────────────────────────

interface CreateCheckoutSessionRequest {
  tierCode: 'PRO' | 'PREMIUM';
  successUrl: string;
  cancelUrl: string;
}

interface ChangeTierRequest {
  tierCode: 'PRO' | 'PREMIUM';
}

// ─────────────────────────────────────────────────────────────────────────────
// Controller
// ─────────────────────────────────────────────────────────────────────────────

export class SubscriptionController {
  constructor(
    @inject('services.LoggerService')
    private loggerService: LoggerService,
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
    this.loggerService.log(`Checkout session request: user=${currentUser.id} tier=${body.tierCode}`);
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
  @post('/subscriptions/change-tier')
  @response(204, {description: 'Tier changed successfully'})
  async changeTier(
    @requestBody() body: ChangeTierRequest,
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: AuthenticatedUser,
  ): Promise<void> {
    this.loggerService.log(`Tier change request: user=${currentUser.id} newTier=${body.tierCode}`);
    await this.subscriptionService.changeTier(currentUser.id, body.tierCode);
  }

  @authenticate('jwt')
  @post('/subscriptions/resume')
  @response(204, {description: 'Subscription resumed'})
  async resumeSubscription(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: AuthenticatedUser,
  ): Promise<void> {
    this.loggerService.log(`Subscription resume request: user=${currentUser.id}`);
    await this.subscriptionService.resumeSubscription(currentUser.id);
  }

  @authenticate('jwt')
  @post('/subscriptions/cancel')
  @response(204, {description: 'Subscription cancelled at period end'})
  async cancelSubscription(
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: AuthenticatedUser,
  ): Promise<void> {
    this.loggerService.log(`Subscription cancel request: user=${currentUser.id}`);
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
      this.loggerService.log(`Webhook processing failed: ${err instanceof Error ? err.message : err}`);
      response.status(400);
      return {received: false};
    }
  }
}
