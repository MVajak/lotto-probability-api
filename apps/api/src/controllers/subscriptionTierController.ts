import {inject} from '@loopback/core';
import {get, getModelSchemaRef, response} from '@loopback/rest';

import type {SubscriptionTierService} from '@lotto/core';
import {SubscriptionTier} from '@lotto/database';

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
