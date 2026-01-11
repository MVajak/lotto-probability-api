import {AuthenticationBindings, authenticate} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {type Request, RestBindings, get, post, requestBody} from '@loopback/rest';

import type {AuthService} from '../services';
import type {
  AuthSubscriptionResponse,
  AuthTokens,
  AuthUserResponse,
  AuthenticatedUser,
} from '../types/auth.types';

export class AuthController {
  constructor(
    @inject('services.AuthService')
    public authService: AuthService,
    @inject(RestBindings.Http.REQUEST)
    private request: Request,
  ) {}

  /**
   * Request OTP - Step 1 of login/signup
   * Sends a 6-digit verification code to the user's email
   */
  @post('/auth/request-otp')
  async requestOTP(
    @requestBody({
      description: 'Request OTP verification code for login/signup',
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

    const result = await this.authService.requestOTP(body.email, ipAddress, userAgent);

    return {message: result.message};
  }

  /**
   * Verify OTP - Step 2 of login/signup
   * Validates the 6-digit code and returns JWT tokens
   */
  @post('/auth/verify-otp')
  async verifyOTP(
    @requestBody({
      description: 'Verify OTP code to complete login/signup',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'code'],
            properties: {
              email: {
                type: 'string',
                format: 'email',
                description: 'User email address',
              },
              code: {
                type: 'string',
                minLength: 6,
                maxLength: 6,
                pattern: '^[0-9]{6}$',
                description: '6-digit verification code',
              },
            },
          },
        },
      },
    })
    body: {
      email: string;
      code: string;
    },
  ): Promise<AuthTokens> {
    const ipAddress = this.request.ip;
    return await this.authService.verifyOTP(body.email, body.code, ipAddress);
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
    currentUser: AuthenticatedUser,
  ): Promise<{user: AuthUserResponse; subscription: AuthSubscriptionResponse}> {
    return await this.authService.getCurrentUser(currentUser.id);
  }

  /**
   * Accept terms of service
   * Requires valid JWT token in Authorization header
   */
  @authenticate('jwt')
  @post('/auth/accept-terms')
  async acceptTerms(
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: AuthenticatedUser,
    @requestBody({
      description: 'Accept terms of service',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['acceptedTermsVersion'],
            properties: {
              acceptedTermsVersion: {
                type: 'string',
                description: 'Version of terms accepted (e.g. "1.0")',
              },
            },
          },
        },
      },
    })
    body: {
      acceptedTermsVersion: string;
    },
  ): Promise<{user: AuthUserResponse; subscription: AuthSubscriptionResponse}> {
    return this.authService.acceptTerms(currentUser.id, body.acceptedTermsVersion);
  }
}
