import {BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';

import {SubscriptionRepository, SubscriptionTierRepository} from '@lotto/database';
import type {SubscriptionHistoryService} from './subscriptionHistoryService';

/**
 * Admin/testing service for direct subscription tier management.
 * This service does NOT depend on Stripe and can be used without Stripe credentials.
 */
@injectable({scope: BindingScope.TRANSIENT})
export class SubscriptionAdminService {
  constructor(
    @repository(SubscriptionRepository)
    private subscriptionRepository: SubscriptionRepository,
    @repository(SubscriptionTierRepository)
    private subscriptionTierRepository: SubscriptionTierRepository,
    @inject('services.SubscriptionHistoryService')
    private subscriptionHistoryService: SubscriptionHistoryService,
  ) {}

  /**
   * Directly update a user's subscription tier (admin/testing use)
   */
  async updateUserTier(userId: string, tierId: string): Promise<void> {
    const subscription = await this.subscriptionRepository.findByUserId(userId);
    if (!subscription) {
      throw new HttpErrors.NotFound('Subscription not found.');
    }

    const newTier = await this.subscriptionTierRepository.findById(tierId);
    if (!newTier) {
      throw new HttpErrors.NotFound(`Tier with id ${tierId} not found.`);
    }

    const oldTierId = subscription.tierId;

    await this.subscriptionRepository.updateById(subscription.id, {
      tierId: newTier.id,
      status: 'active',
    });

    await this.subscriptionHistoryService.createEntry({
      subscriptionId: subscription.id,
      userId,
      oldTierId,
      newTierId: newTier.id,
      fromStatus: subscription.status,
      toStatus: 'active',
    });
  }
}
