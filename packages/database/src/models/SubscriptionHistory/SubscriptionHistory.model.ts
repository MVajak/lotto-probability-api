import {Entity, belongsTo, model, property} from '@loopback/repository';

import {Subscription, type SubscriptionStatus} from '../Subscription';
import type {SubscriptionTierCode} from '../SubscriptionTier';
import {User} from '../User';

export type SubscriptionEventType =
  | 'created'
  | 'upgraded'
  | 'downgraded'
  | 'canceled'
  | 'renewed'
  | 'trial_started'
  | 'trial_ended'
  | 'payment_failed'
  | 'reactivated';

@model({
  settings: {
    postgresql: {
      table: 'subscription_history',
    },
  },
})
export class SubscriptionHistory extends Entity {
  @property({
    type: 'string',
    id: true,
    postgresql: {columnName: 'id', dataType: 'uuid'},
  })
  id: string;

  @belongsTo(
    () => Subscription,
    {},
    {
      postgresql: {columnName: 'subscription_id'},
    },
  )
  subscriptionId: string;

  @belongsTo(
    () => User,
    {},
    {
      postgresql: {columnName: 'user_id'},
    },
  )
  userId: string;

  // What Changed
  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'event_type'},
  })
  eventType: SubscriptionEventType;

  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'from_tier'},
  })
  fromTier?: SubscriptionTierCode | null;

  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'to_tier'},
  })
  toTier: SubscriptionTierCode;

  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'from_status'},
  })
  fromStatus?: SubscriptionStatus | null;

  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'to_status'},
  })
  toStatus: SubscriptionStatus;

  // Why it Changed
  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'reason'},
  })
  reason?: string | null;

  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'stripe_event_id'},
  })
  stripeEventId?: string | null;

  // Metadata
  @property({
    type: 'date',
    required: true,
    postgresql: {columnName: 'created_at'},
  })
  createdAt: Date;
}

export interface SubscriptionHistoryRelations {
  subscription?: Subscription;
  user?: User;
}

export type SubscriptionHistoryWithRelations = SubscriptionHistory & SubscriptionHistoryRelations;
