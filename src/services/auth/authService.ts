import {BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';

import {Subscription, SubscriptionTierCode, User} from '../../models';
import {
  SubscriptionRepository,
  SubscriptionTierRepository,
  UserRepository,
} from '../../repositories';
import {
  AuthSubscriptionResponse,
  AuthTokens,
  AuthUserResponse,
  toAuthSubscriptionResponse,
  toAuthUserResponse,
} from '../../types/auth.types';

import {EmailService} from './emailService';
import {JWTService} from './jwtService';
import {MagicLinkService} from './magicLinkService';

@injectable({scope: BindingScope.TRANSIENT})
export class AuthService {
  constructor(
    @repository(UserRepository)
    private userRepository: UserRepository,
    @repository(SubscriptionRepository)
    private subscriptionRepository: SubscriptionRepository,
    @repository(SubscriptionTierRepository)
    private subscriptionTierRepository: SubscriptionTierRepository,
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
   * Verify magic link token and return JWT tokens only
   */
  async verifyMagicLink(token: string, ipAddress?: string): Promise<AuthTokens> {
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

    // Get user
    const user = await this.userRepository.findById(magicLinkToken.userId);

    // Activate user on first login
    if (user.userState === 'pending') {
      await this.activateUser(user.id);
      console.log(`✅ User activated: ${user.email}`);
    }

    // Track login
    await this.userRepository.trackLogin(user.id, ipAddress);

    // Get subscription with tier
    const subscription = await this.getOrCreateSubscription(user.id);
    const tierCode = await this.getTierCode(subscription.tierId);

    // Generate JWT tokens
    const tokens = this.generateTokens(user, tierCode);

    console.log(`🔐 User logged in: ${user.email} (${tierCode})`);

    return tokens;
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

    const tierCode = await this.getTierCode(subscription.tierId);

    return {
      user: toAuthUserResponse(user),
      subscription: toAuthSubscriptionResponse(subscription, tierCode),
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
    const subscription = await this.getOrCreateSubscription(user.id);
    const tierCode = await this.getTierCode(subscription.tierId);

    // Generate new tokens
    return this.generateTokens(user, tierCode);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Private Helper Methods
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Get tier code by tier ID
   */
  private async getTierCode(tierId: string): Promise<SubscriptionTierCode> {
    const tier = await this.subscriptionTierRepository.findById(tierId);
    return tier.code;
  }

  /**
   * Get tier ID by code
   */
  private async getTierIdByCode(code: SubscriptionTierCode): Promise<string> {
    const tier = await this.subscriptionTierRepository.findByCode(code);
    if (!tier) {
      throw new HttpErrors.InternalServerError(`Subscription tier ${code} not found`);
    }
    return tier.id;
  }

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

    // Get the FREE tier ID
    const freeTierId = await this.getTierIdByCode('FREE');

    // Create free subscription for new user
    await this.subscriptionRepository.create({
      userId: user.id,
      tierId: freeTierId,
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
      // Get the FREE tier ID
      const freeTierId = await this.getTierIdByCode('FREE');

      // Create default free subscription if missing
      subscription = await this.subscriptionRepository.create({
        userId,
        tierId: freeTierId,
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
  private generateTokens(user: User, subscriptionTier: SubscriptionTierCode): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email,
      subscriptionTier,
    };

    return {
      accessToken: this.jwtService.generateToken(payload),
      refreshToken: this.jwtService.generateRefreshToken(payload),
    };
  }
}
