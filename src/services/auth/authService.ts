import {BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';

import {Subscription, User} from '../../models';
import {SubscriptionRepository, UserRepository} from '../../repositories';
import {
  AuthSubscriptionResponse,
  AuthUserResponse,
  toAuthSubscriptionResponse,
  toAuthUserResponse,
} from '../../types/auth.types';

import {EmailService} from './emailService';
import {JWTService} from './jwtService';
import {MagicLinkService} from './magicLinkService';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUserResponse;
  subscription: AuthSubscriptionResponse;
}

@injectable({scope: BindingScope.TRANSIENT})
export class AuthService {
  constructor(
    @repository(UserRepository)
    private userRepository: UserRepository,
    @repository(SubscriptionRepository)
    private subscriptionRepository: SubscriptionRepository,
    @inject('services.JWTService')
    private jwtService: JWTService,
    @inject('services.MagicLinkService')
    private magicLinkService: MagicLinkService,
    @inject('services.EmailService')
    private emailService: EmailService,
  ) {}

  /**
   * Request magic link for user (login or signup)
   * Creates new user if doesn't exist, generates magic link, sends email
   */
  async requestMagicLink(
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{message: string; isNewUser: boolean}> {
    // Validate email
    if (!email || !email.includes('@')) {
      throw new HttpErrors.BadRequest('Valid email is required');
    }

    const normalizedEmail = email.toLowerCase();

    // Find or create user
    let user = await this.userRepository.findByEmail(normalizedEmail);
    let isNewUser = false;

    if (!user) {
      user = await this.createNewUser(normalizedEmail);
      isNewUser = true;
      console.log(`✨ New user created: ${normalizedEmail}`);
    } else {
      console.log(`👤 Existing user login request: ${normalizedEmail}`);
    }

    // Generate and send magic link
    await this.generateAndSendMagicLink(user.id, normalizedEmail, ipAddress, userAgent);

    return {
      message: 'Magic link sent to your email. Please check your inbox.',
      isNewUser,
    };
  }

  /**
   * Verify magic link token and return JWT tokens with user data
   */
  async verifyMagicLink(token: string, ipAddress?: string): Promise<LoginResponse> {
    if (!token) {
      throw new HttpErrors.BadRequest('Token is required');
    }

    // Verify token
    const magicLinkToken = await this.magicLinkService.verifyToken(token);

    if (!magicLinkToken) {
      throw new HttpErrors.Unauthorized(
        'Invalid or expired token. Please request a new magic link.',
      );
    }

    // Mark token as used (one-time use)
    await this.magicLinkService.markTokenAsUsed(magicLinkToken.id);

    // Get user with subscription
    const user = await this.userRepository.findById(magicLinkToken.userId, {
      include: ['subscription'],
    });

    // Activate user on first login
    if (user.userState === 'pending') {
      await this.activateUser(user.id);
      user.userState = 'active';
      user.emailVerified = true;
      console.log(`✅ User activated: ${user.email}`);
    }

    // Track login
    await this.userRepository.trackLogin(user.id, ipAddress);

    // Get subscription
    const subscription = await this.getOrCreateSubscription(user.id);

    // Generate JWT tokens
    const tokens = this.generateTokens(user, subscription);

    console.log(`🔐 User logged in: ${user.email} (${subscription.tier})`);

    return {
      ...tokens,
      user: toAuthUserResponse(user),
      subscription: toAuthSubscriptionResponse(subscription),
    };
  }

  /**
   * Get current user data by user ID
   */
  async getCurrentUser(userId: string): Promise<{
    user: AuthUserResponse;
    subscription: AuthSubscriptionResponse;
  }> {
    const user = await this.userRepository.findById(userId);
    const subscription = await this.subscriptionRepository.findByUserId(user.id);

    if (!subscription) {
      throw new HttpErrors.InternalServerError('User subscription not found');
    }

    return {
      user: toAuthUserResponse(user),
      subscription: toAuthSubscriptionResponse(subscription),
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const payload = this.jwtService.verifyToken(refreshToken);

    // Get fresh user data
    const user = await this.userRepository.findById(payload.userId);
    const subscription = await this.subscriptionRepository.findByUserId(user.id);

    if (!subscription) {
      throw new HttpErrors.InternalServerError('User subscription not found');
    }

    // Generate new tokens
    return this.generateTokens(user, subscription);
  }

  /**
   * Validate access token and return user data
   */
  async validateAccessToken(accessToken: string): Promise<User> {
    const payload = this.jwtService.verifyToken(accessToken);
    return await this.userRepository.findById(payload.userId);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Private Helper Methods
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Create new user with pending state
   */
  private async createNewUser(email: string): Promise<User> {
    const user = await this.userRepository.create({
      email,
      emailVerified: false,
      userState: 'pending',
      language: 'en',
      timezone: 'UTC',
      emailNotifications: true,
      loginCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create free subscription for new user
    await this.subscriptionRepository.create({
      userId: user.id,
      tier: 'free',
      status: 'active',
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return user;
  }

  /**
   * Activate user (change state from pending to active)
   */
  private async activateUser(userId: string): Promise<void> {
    await this.userRepository.updateById(userId, {
      userState: 'active',
      emailVerified: true,
    });
  }

  /**
   * Generate and send magic link email
   */
  private async generateAndSendMagicLink(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // Generate magic link token
    const token = await this.magicLinkService.generateToken(userId, ipAddress, userAgent);

    // Generate magic link URL
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3001';
    const magicLinkUrl = this.magicLinkService.generateMagicLinkUrl(token.token, baseUrl);

    // Send email
    await this.emailService.sendMagicLinkEmail(email, magicLinkUrl);
  }

  /**
   * Get subscription or create default one if missing
   */
  private async getOrCreateSubscription(userId: string): Promise<Subscription> {
    let subscription = await this.subscriptionRepository.findByUserId(userId);

    if (!subscription) {
      // Create default free subscription if missing
      subscription = await this.subscriptionRepository.create({
        userId,
        tier: 'free',
        status: 'active',
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return subscription;
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private generateTokens(user: User, subscription: Subscription): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email,
      subscriptionTier: subscription.tier,
    };

    return {
      accessToken: this.jwtService.generateToken(payload),
      refreshToken: this.jwtService.generateRefreshToken(payload),
    };
  }
}
