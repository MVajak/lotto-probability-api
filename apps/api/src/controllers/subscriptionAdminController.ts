import {AuthenticationBindings, authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {patch, requestBody, response} from '@loopback/rest';
import {type UserProfile, securityId} from '@loopback/security';

import type {SubscriptionAdminService} from '@lotto/core';

interface UpdateTierRequest {
  tierId: string;
}

/**
 * Admin controller for subscription management.
 * This controller does NOT depend on Stripe and can be used without Stripe credentials.
 */
export class SubscriptionAdminController {
  constructor(
    @inject('services.SubscriptionAdminService')
    private subscriptionAdminService: SubscriptionAdminService,
  ) {}

  @authenticate('jwt')
  @patch('/subscriptions/tier')
  @response(204, {description: 'Subscription tier updated'})
  async updateTier(
    @requestBody() body: UpdateTierRequest,
    @inject(AuthenticationBindings.CURRENT_USER) currentUser: UserProfile,
  ): Promise<void> {
    await this.subscriptionAdminService.updateUserTier(currentUser[securityId], body.tierId);
  }
}
