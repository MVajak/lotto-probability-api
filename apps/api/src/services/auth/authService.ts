import {BindingScope, inject, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import {HttpErrors} from '@loopback/rest';

import type {LoggerService} from '@lotto/core';
import type {Subscription, User} from '@lotto/database';
import {SubscriptionRepository, SubscriptionTierRepository, UserRepository} from '@lotto/database';
import type {SubscriptionTierCode} from '@lotto/shared';
import {
  type AuthSubscriptionResponse,
  type AuthTokens,
  type AuthUserResponse,
  toAuthSubscriptionResponse,
  toAuthUserResponse,
} from '../../types/auth.types';

import type {EmailService} from './emailService';
import type {JWTService} from './jwtService';
import type {OTPService} from './otpService';

@injectable({scope: BindingScope.TRANSIENT})
export class AuthService {
  constructor(
    @inject('services.LoggerService')
    private loggerService: LoggerService,
    @repository(UserRepository)
    private userRepository: UserRepository,
    @repository(SubscriptionRepository)
    private subscriptionRepository: SubscriptionRepository,
    @repository(SubscriptionTierRepository)
    private subscriptionTierRepository: SubscriptionTierRepository,
    @inject('services.JWTService')
    private jwtService: JWTService,
    @inject('services.OTPService')
    private otpService: OTPService,
    @inject('services.EmailService')
    private emailService: EmailService,
  ) {}

  /**
   * Request OTP for user (login or signup)
   * Creates new user if doesn't exist, generates OTP, sends email
   */
  async requestOTP(
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
      this.loggerService.log(`✨ New user created: ${normalizedEmail}`);
    } else {
      this.loggerService.log(`👤 Existing user login request: ${normalizedEmail}`);
    }

    // Generate and send OTP
    await this.generateAndSendOTP(user.id, normalizedEmail, ipAddress, userAgent);

    return {
      message: 'Verification code sent to your email. Please check your inbox.',
      isNewUser,
    };
  }

  /**
   * Verify OTP code and return JWT tokens
   * Requires both email and code for security
   */
  async verifyOTP(email: string, code: string, ipAddress?: string): Promise<AuthTokens> {
    if (!email || !code) {
      throw new HttpErrors.BadRequest('Email and verification code are required');
    }

    const normalizedEmail = email.toLowerCase();
    const normalizedCode = code.trim();

    // Find user by email first
    const user = await this.userRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new HttpErrors.Unauthorized('Invalid email or verification code. Please try again.');
    }

    // Verify OTP for this user
    const otpRecord = await this.otpService.verifyOTP(user.id, normalizedCode);

    if (!otpRecord) {
      throw new HttpErrors.Unauthorized(
        'Invalid or expired verification code. Please request a new one.',
      );
    }

    // Mark OTP as used (one-time use)
    await this.otpService.markAsUsed(otpRecord.id);

    // Activate user on first login
    if (user.userState === 'pending') {
      await this.activateUser(user.id);
      this.loggerService.log(`✅ User activated: ${user.email}`);
    }

    // Track login
    await this.userRepository.trackLogin(user.id, ipAddress);

    // Get subscription with tier
    const subscription = await this.getOrCreateSubscription(user.id);
    const tierCode = await this.getTierCode(subscription.tierId);

    // Generate JWT tokens
    const tokens = this.generateTokens(user, tierCode);

    this.loggerService.log(`🔐 User logged in: ${user.email} (${tierCode})`);

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
   * Generate and send OTP email
   */
  private async generateAndSendOTP(
    userId: string,
    email: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    // Invalidate any pending OTPs for this user (only one active at a time)
    await this.otpService.invalidatePendingOTPs(userId);

    // Generate new OTP
    const otpRecord = await this.otpService.generateOTP(userId, ipAddress, userAgent);

    // Send email with code
    await this.emailService.sendOTPEmail(email, otpRecord.token);
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
