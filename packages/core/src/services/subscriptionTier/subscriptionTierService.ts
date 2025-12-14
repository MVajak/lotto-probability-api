import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';

import type {SubscriptionTier} from '@lotto/database';
import {SubscriptionTierRepository} from '@lotto/database';
import type {SubscriptionTierCode} from '@lotto/shared';

@injectable({scope: BindingScope.SINGLETON})
export class SubscriptionTierService {
  constructor(
    @repository(SubscriptionTierRepository)
    private subscriptionTierRepository: SubscriptionTierRepository,
  ) {}

  /**
   * Get all subscription tiers ordered by display order
   */
  async getAllTiers(): Promise<SubscriptionTier[]> {
    return this.subscriptionTierRepository.findAllOrdered();
  }

  /**
   * Get a specific tier by code
   */
  async getTierByCode(code: SubscriptionTierCode): Promise<SubscriptionTier | null> {
    return this.subscriptionTierRepository.findByCode(code);
  }

  /**
   * Get a specific tier by ID
   */
  async getTierById(id: string): Promise<SubscriptionTier | null> {
    return this.subscriptionTierRepository.findById(id);
  }
}
