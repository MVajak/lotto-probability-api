import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';

import {SubscriptionTier, SubscriptionTierCode} from '../../models';
import {SubscriptionTierRepository} from '../../repositories';

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
