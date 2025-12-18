import {Entity, model, property} from '@loopback/repository';

import type {SubscriptionFeature, SubscriptionTierCode} from '@lotto/shared';

@model({
  settings: {
    postgresql: {
      table: 'subscription_tier',
    },
  },
})
export class SubscriptionTier extends Entity {
  @property({
    type: 'string',
    id: true,
    postgresql: {columnName: 'id', dataType: 'uuid'},
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'code'},
  })
  code: SubscriptionTierCode;

  @property({
    type: 'number',
    required: true,
    default: 0,
    postgresql: {columnName: 'price', dataType: 'decimal'},
  })
  price: number;

  @property({
    type: 'array',
    itemType: 'string',
    required: true,
    default: [],
    postgresql: {columnName: 'features', dataType: 'jsonb'},
  })
  features: SubscriptionFeature[];

  @property({
    type: 'number',
    required: true,
    default: 0,
    postgresql: {columnName: 'display_order'},
  })
  displayOrder: number;

  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'stripe_price_id'},
  })
  stripePriceId?: string | null;

  @property({
    type: 'date',
    required: true,
    postgresql: {columnName: 'created_at'},
  })
  createdAt: Date;

  @property({
    type: 'date',
    required: true,
    postgresql: {columnName: 'updated_at'},
  })
  updatedAt: Date;
}

export type SubscriptionTierRelations = {};

export type SubscriptionTierWithRelations = SubscriptionTier & SubscriptionTierRelations;
