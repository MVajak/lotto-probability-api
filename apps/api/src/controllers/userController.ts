import {AuthenticationBindings, authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {del, get, getModelSchemaRef, patch, requestBody, response} from '@loopback/rest';

import {
  UpdateUserProfileDto,
  type UserProfileResponse,
  UserProfileResponseDto,
} from '@lotto/core';
import type {LoggerService, UserService} from '@lotto/core';

import type {AuthenticatedUser} from '../types/auth.types';

@authenticate('jwt')
export class UserController {
  constructor(
    @inject('services.LoggerService')
    private loggerService: LoggerService,
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
    currentUser: AuthenticatedUser,
  ): Promise<UserProfileResponse> {
    return this.userService.getUserProfile(currentUser.id);
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
    currentUser: AuthenticatedUser,
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
    this.loggerService.log(`Profile update: user=${currentUser.id}`);
    return this.userService.updateUserProfile(currentUser.id, body);
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
    currentUser: AuthenticatedUser,
  ): Promise<void> {
    this.loggerService.log(`Account deletion: user=${currentUser.id}`);
    await this.userService.deleteUser(currentUser.id);
  }
}
