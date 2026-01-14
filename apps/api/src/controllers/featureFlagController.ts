import {AuthenticationBindings, authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {get, response} from '@loopback/rest';

import type {FeatureFlagService} from '@lotto/core';

import type {AuthenticatedUser} from '../types/auth.types';

@authenticate('jwt')
export class FeatureFlagController {
  constructor(
    @inject('services.FeatureFlagService')
    private featureFlagService: FeatureFlagService,
  ) {}

  /**
   * Get feature flags for current user
   */
  @get('/features')
  @response(200, {
    description: 'Feature flags for current user',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          additionalProperties: {type: 'boolean'},
        },
      },
    },
  })
  async getFeatureFlags(
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: AuthenticatedUser,
  ): Promise<Record<string, boolean>> {
    return this.featureFlagService.getFlags(currentUser.email);
  }
}
