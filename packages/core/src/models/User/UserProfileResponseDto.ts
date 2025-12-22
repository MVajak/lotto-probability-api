import {model, property} from '@loopback/repository';

/**
 * User profile response DTO
 * Excludes sensitive fields like deletedAt, lastLoginIp, referralCode, etc.
 */
@model()
export class UserProfileResponseDto {
  @property({
    type: 'string',
    required: true,
    description: 'User ID (UUID)',
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    description: 'User email address',
  })
  email: string;

  @property({
    type: 'string',
    required: false,
    description: 'User first name',
  })
  firstName: string | null;

  @property({
    type: 'string',
    required: false,
    description: 'User last name',
  })
  lastName: string | null;

  @property({
    type: 'string',
    required: false,
    description: 'User phone number',
  })
  phoneNumber: string | null;

  @property({
    type: 'string',
    required: false,
    description: 'User country',
  })
  country: string | null;

  @property({
    type: 'boolean',
    required: true,
    description: 'Whether the email has been verified',
  })
  emailVerified: boolean;

  @property({
    type: 'date',
    required: true,
    description: 'Account creation date',
  })
  createdAt: Date;
}
