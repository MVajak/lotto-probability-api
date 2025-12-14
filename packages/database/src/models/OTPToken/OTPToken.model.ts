import {Entity, belongsTo, model, property} from '@loopback/repository';

import {User} from '../User';

@model({
  settings: {
    postgresql: {
      table: 'otp_token',
    },
  },
})
export class OTPToken extends Entity {
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

  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'token'},
    index: {unique: true},
  })
  token: string;

  @property({
    type: 'date',
    required: true,
    postgresql: {columnName: 'expires_at'},
  })
  expiresAt: Date;

  @property({
    type: 'date',
    required: false,
    postgresql: {columnName: 'used_at'},
  })
  usedAt?: Date | null;

  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'ip_address'},
  })
  ipAddress?: string | null;

  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'user_agent'},
  })
  userAgent?: string | null;

  @property({
    type: 'date',
    required: true,
    postgresql: {columnName: 'created_at'},
  })
  createdAt: Date;
}

export interface OTPTokenRelations {
  user?: User;
}

export type OTPTokenWithRelations = OTPToken & OTPTokenRelations;
