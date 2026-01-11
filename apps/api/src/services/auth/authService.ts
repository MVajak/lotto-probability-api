import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';

import type {LoggerService, SubscriptionService, UserService} from '@lotto/core';
import type {User} from '@lotto/database';
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
    @inject('services.UserService')
    private userService: UserService,
    @inject('services.SubscriptionService')
    private subscriptionService: SubscriptionService,
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
    let user = await this.userService.findByEmail(normalizedEmail);
    let isNewUser = false;

    if (!user) {
      user = await this.userService.createUser(normalizedEmail);
      await this.subscriptionService.createFreeSubscription(user.id);
      isNewUser = true;
      this.loggerService.log(`New user created: ${normalizedEmail}`);
    } else {
      this.loggerService.log(`Existing user login request: ${normalizedEmail}`);
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
    const user = await this.userService.findByEmail(normalizedEmail);

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
      await this.userService.activateUser(user.id);
      this.loggerService.log(`User activated: ${user.email}`);
    }

    // Track login
    await this.userService.trackLogin(user.id, ipAddress);

    // Get subscription with tier
    const subscription = await this.subscriptionService.getOrCreateSubscription(user.id);
    const tierCode = await this.subscriptionService.getTierCode(subscription.tierId);

    // Generate JWT tokens
    const tokens = this.generateTokens(user, tierCode);

    this.loggerService.log(`User logged in: ${user.email} (${tierCode})`);

    return tokens;
  }

  /**
   * Get current user data by user ID
   */
  async getCurrentUser(userId: string): Promise<{
    user: AuthUserResponse;
    subscription: AuthSubscriptionResponse;
  }> {
    const user = await this.userService.findById(userId);
    const subscription = await this.subscriptionService.findByUserId(user.id);

    if (!subscription) {
      throw new HttpErrors.InternalServerError('User subscription not found');
    }

    const tierCode = await this.subscriptionService.getTierCode(subscription.tierId);

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
    const user = await this.userService.findById(payload.userId);
    const subscription = await this.subscriptionService.getOrCreateSubscription(user.id);
    const tierCode = await this.subscriptionService.getTierCode(subscription.tierId);

    // Generate new tokens
    return this.generateTokens(user, tierCode);
  }

  /**
   * Accept terms of service
   */
  async acceptTerms(
    userId: string,
    acceptedTermsVersion: string,
  ): Promise<{user: AuthUserResponse; subscription: AuthSubscriptionResponse}> {
    await this.userService.acceptTerms(userId, acceptedTermsVersion);
    return this.getCurrentUser(userId);
  }

  // ─────────────────────────────────────────────────────────────────────
  // Private Helper Methods
  // ─────────────────────────────────────────────────────────────────────

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
   * Generate JWT access and refresh tokens
   */
  private generateTokens(user: User, subscriptionTierCode: SubscriptionTierCode): AuthTokens {
    const payload = {
      userId: user.id,
      email: user.email,
      subscriptionTierCode,
    };

    return {
      accessToken: this.jwtService.generateToken(payload),
      refreshToken: this.jwtService.generateRefreshToken(payload),
    };
  }
}
