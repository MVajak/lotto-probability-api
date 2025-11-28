import {inject} from '@loopback/core';
import {get, getModelSchemaRef, response} from '@loopback/rest';

import {SubscriptionTier} from '../models';
import {SubscriptionTierService} from '../services/subscriptionTier/subscriptionTierService';

export class SubscriptionTierController {
  constructor(
    @inject('services.SubscriptionTierService')
    private subscriptionTierService: SubscriptionTierService,
  ) {}

  @get('/subscription-tiers')
  @response(200, {
    description: 'List of all subscription tiers',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(SubscriptionTier),
        },
      },
    },
  })
  async getAllTiers(): Promise<SubscriptionTier[]> {
    return this.subscriptionTierService.getAllTiers();
  }
}
