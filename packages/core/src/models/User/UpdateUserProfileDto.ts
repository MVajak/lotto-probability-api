import {model, property} from '@loopback/repository';

/**
 * DTO for updating user profile
 * Only includes fields that users are allowed to update
 */
@model()
export class UpdateUserProfileDto {
  @property({
    type: 'string',
    required: false,
    description: 'User first name',
  })
  firstName?: string | null;

  @property({
    type: 'string',
    required: false,
    description: 'User last name',
  })
  lastName?: string | null;

  @property({
    type: 'string',
    required: false,
    description: 'User phone number',
  })
  phoneNumber?: string | null;

  @property({
    type: 'string',
    required: false,
    description: 'User country',
  })
  country?: string | null;
}
