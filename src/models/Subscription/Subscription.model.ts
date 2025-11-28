import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';

import {SubscriptionHistory} from '../SubscriptionHistory';
import {SubscriptionTier} from '../SubscriptionTier';
import {User} from '../User';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

@model({
  settings: {
    postgresql: {
      table: 'subscription',
    },
  },
})
export class Subscription extends Entity {
  @property({
    type: 'string',
    id: true,
    postgresql: {columnName: 'id', dataType: 'uuid'},
  })
  id: string;

  @belongsTo(
    () => User,
    {},
    {
      postgresql: {columnName: 'user_id'},
    },
  )
  userId: string;

  @belongsTo(
    () => SubscriptionTier,
    {},
    {
      postgresql: {columnName: 'tier_id'},
    },
  )
  tierId: string;

  @property({
    type: 'string',
    required: true,
    default: 'active',
    postgresql: {columnName: 'status'},
  })
  status: SubscriptionStatus;

  // Stripe Integration
  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'stripe_customer_id'},
  })
  stripeCustomerId?: string | null;

  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'stripe_subscription_id'},
  })
  stripeSubscriptionId?: string | null;

  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'stripe_price_id'},
  })
  stripePriceId?: string | null;

  // Billing
  @property({
    type: 'date',
    required: false,
    postgresql: {columnName: 'current_period_start'},
  })
  currentPeriodStart?: Date | null;

  @property({
    type: 'date',
    required: false,
    postgresql: {columnName: 'current_period_end'},
  })
  currentPeriodEnd?: Date | null;

  @property({
    type: 'boolean',
    default: false,
    postgresql: {columnName: 'cancel_at_period_end'},
  })
  cancelAtPeriodEnd: boolean;

  @property({
    type: 'date',
    required: false,
    postgresql: {columnName: 'canceled_at'},
  })
  canceledAt?: Date | null;

  @property({
    type: 'date',
    required: false,
    postgresql: {columnName: 'trial_ends_at'},
  })
  trialEndsAt?: Date | null;

  // Metadata
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

  // Relations
  @hasMany(() => SubscriptionHistory, {keyTo: 'subscriptionId'})
  history?: SubscriptionHistory[];

  constructor(data?: Partial<Subscription>) {
    super(data);
  }
}

export interface SubscriptionRelations {
  user?: User;
  tier?: SubscriptionTier;
  history?: SubscriptionHistory[];
}

export type SubscriptionWithRelations = Subscription & SubscriptionRelations;
