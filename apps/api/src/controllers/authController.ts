import {AuthenticationBindings, authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {type Request, RestBindings, get, param, post, requestBody} from '@loopback/rest';
import type {UserProfile} from '@loopback/security';

import type {AuthService} from '../services/auth';
import type {AuthSubscriptionResponse, AuthTokens, AuthUserResponse} from '../types/auth.types';

export class AuthController {
  constructor(
    @inject('services.AuthService')
    public authService: AuthService,
    @inject(RestBindings.Http.REQUEST)
    private request: Request,
  ) {}

  /**
   * Request magic link - Step 1 of login/signup
   */
  @post('/auth/request-magic-link')
  async requestMagicLink(
    @requestBody({
      description: 'Request magic link for login/signup',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
                description: 'User email address',
              },
            },
          },
        },
      },
    })
    body: {
      email: string;
    },
  ): Promise<{message: string}> {
    const ipAddress = this.request.ip;
    const userAgent = this.request.get('user-agent') || undefined;

    const result = await this.authService.requestMagicLink(body.email, ipAddress, userAgent);

    return {message: result.message};
  }

  /**
   * Verify magic link - Step 2 of login/signup
   */
  @get('/auth/verify')
  async verifyMagicLink(@param.query.string('token') token: string): Promise<AuthTokens> {
    const ipAddress = this.request.ip;
    return await this.authService.verifyMagicLink(token, ipAddress);
  }

  /**
   * Refresh access token using refresh token
   */
  @post('/auth/refresh')
  async refreshToken(
    @requestBody({
      description: 'Refresh access token',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['refreshToken'],
            properties: {
              refreshToken: {
                type: 'string',
                description: 'Refresh token',
              },
            },
          },
        },
      },
    })
    body: {
      refreshToken: string;
    },
  ): Promise<AuthTokens> {
    return await this.authService.refreshAccessToken(body.refreshToken);
  }

  /**
   * Get current user info from JWT token
   * Requires valid JWT token in Authorization header
   */
  @authenticate('jwt')
  @get('/auth/me')
  async getCurrentUser(
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
  ): Promise<{user: AuthUserResponse; subscription: AuthSubscriptionResponse}> {
    // UserProfile has 'id' field which contains userId
    const userId = currentUser.id as string;
    return await this.authService.getCurrentUser(userId);
  }
}
