import {Entity, hasOne, model, property} from '@loopback/repository';

import {Subscription} from '../Subscription';

export type UserState = 'pending' | 'active' | 'suspended' | 'deleted';

@model({
  settings: {
    postgresql: {
      table: 'user',
    },
  },
})
export class User extends Entity {
  @property({
    type: 'string',
    id: true,
    postgresql: {columnName: 'id', dataType: 'uuid'},
  })
  id: string;

  // Identity
  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'email'},
    index: {unique: true},
  })
  email: string;

  @property({
    type: 'boolean',
    default: false,
    postgresql: {columnName: 'email_verified'},
  })
  emailVerified: boolean;

  @property({
    type: 'string',
    required: true,
    default: 'pending',
    postgresql: {columnName: 'user_state'},
  })
  userState: UserState;

  // Personal Info
  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'first_name'},
  })
  firstName?: string | null;

  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'last_name'},
  })
  lastName?: string | null;

  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'avatar_url'},
  })
  avatarUrl?: string | null;

  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'phone_number'},
  })
  phoneNumber?: string | null;

  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'country'},
  })
  country?: string | null;

  // Preferences
  @property({
    type: 'string',
    default: 'en',
    postgresql: {columnName: 'language'},
  })
  language: string;

  @property({
    type: 'string',
    default: 'UTC',
    postgresql: {columnName: 'timezone'},
  })
  timezone: string;

  @property({
    type: 'boolean',
    default: true,
    postgresql: {columnName: 'email_notifications'},
  })
  emailNotifications: boolean;

  // Activity Tracking
  @property({
    type: 'number',
    default: 0,
    postgresql: {columnName: 'login_count'},
  })
  loginCount: number;

  @property({
    type: 'date',
    required: false,
    postgresql: {columnName: 'last_login_at'},
  })
  lastLoginAt?: Date | null;

  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'last_login_ip'},
  })
  lastLoginIp?: string | null;

  // Referral
  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'referral_code'},
  })
  referralCode?: string | null;

  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'referred_by_user_id'},
  })
  referredByUserId?: string | null;

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

  @property({
    type: 'date',
    required: false,
    postgresql: {columnName: 'deleted_at'},
  })
  deletedAt?: Date | null;

  // Relations
  @hasOne(() => Subscription, {keyTo: 'userId'})
  subscription?: Subscription;

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {
  subscription?: Subscription;
}

export type UserWithRelations = User & UserRelations;
