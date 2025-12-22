import {AuthenticationBindings, authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {del, get, getModelSchemaRef, patch, requestBody, response} from '@loopback/rest';
import type {UserProfile} from '@loopback/security';

import {
  UpdateUserProfileDto,
  type UserProfileResponse,
  UserProfileResponseDto,
  type UserService,
} from '@lotto/core';

@authenticate('jwt')
export class UserController {
  constructor(
    @inject('services.UserService')
    private userService: UserService,
  ) {}

  /**
   * Get current user's profile
   */
  @get('/users/me')
  @response(200, {
    description: 'Current user profile',
    content: {
      'application/json': {
        schema: getModelSchemaRef(UserProfileResponseDto),
      },
    },
  })
  async getProfile(
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
  ): Promise<UserProfileResponse> {
    const userId = currentUser.id as string;
    return this.userService.getUserProfile(userId);
  }

  /**
   * Update current user's profile
   */
  @patch('/users/me')
  @response(200, {
    description: 'Updated user profile',
    content: {
      'application/json': {
        schema: getModelSchemaRef(UserProfileResponseDto),
      },
    },
  })
  async updateProfile(
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
    @requestBody({
      description: 'User profile fields to update',
      required: true,
      content: {
        'application/json': {
          schema: getModelSchemaRef(UpdateUserProfileDto),
        },
      },
    })
    body: UpdateUserProfileDto,
  ): Promise<UserProfileResponse> {
    const userId = currentUser.id as string;
    return this.userService.updateUserProfile(userId, body);
  }

  /**
   * Delete current user's account (soft delete)
   */
  @del('/users/me')
  @response(204, {
    description: 'User account deleted',
  })
  async deleteProfile(
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
  ): Promise<void> {
    const userId = currentUser.id as string;
    await this.userService.deleteUser(userId);
  }
}
