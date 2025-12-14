import crypto from 'node:crypto';
import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';

import type {OTPToken} from '@lotto/database';
import {OTPTokenRepository} from '@lotto/database';

@injectable({scope: BindingScope.SINGLETON})
export class OTPService {
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly OTP_LENGTH = 6;

  constructor(
    @repository(OTPTokenRepository)
    public otpRepository: OTPTokenRepository,
  ) {}

  /**
   * Generate a 6-digit OTP code for a user
   */
  async generateOTP(userId: string, ipAddress?: string, userAgent?: string): Promise<OTPToken> {
    // Generate cryptographically secure 6-digit code
    const code = this.generateSecureCode();

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    // Create OTP record (reusing MagicLinkToken table - "token" field stores the code)
    return this.otpRepository.create({
      userId,
      token: code,
      expiresAt,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      createdAt: new Date(),
    });
  }

  /**
   * Verify an OTP code for a specific user
   * Requires both email lookup (handled by caller) and code match
   */
  async verifyOTP(userId: string, code: string): Promise<OTPToken | null> {
    const normalizedCode = code.trim();

    // Find valid OTP for this user
    const tokens = await this.otpRepository.find({
      where: {
        userId,
        token: normalizedCode,
        expiresAt: {gt: new Date()},
        usedAt: {eq: null},
      },
      limit: 1,
    });

    return tokens.length > 0 ? tokens[0] : null;
  }

  /**
   * Mark OTP as used
   */
  async markAsUsed(otpId: string): Promise<void> {
    await this.otpRepository.markAsUsed(otpId);
  }

  /**
   * Cleanup expired OTPs (run periodically via cron)
   */
  async cleanupExpiredOTPs(): Promise<number> {
    return await this.otpRepository.deleteExpiredTokens();
  }

  /**
   * Invalidate all pending OTPs for a user (e.g., when new one is requested)
   */
  async invalidatePendingOTPs(userId: string): Promise<number> {
    return await this.otpRepository.deleteAllForUser(userId);
  }

  /**
   * Generate a cryptographically secure 6-digit numeric code
   */
  private generateSecureCode(): string {
    // Generate random bytes and convert to a number between 0-999999
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = randomBytes.readUInt32BE(0);
    const code = randomNumber % 1000000;

    // Pad with leading zeros to ensure 6 digits
    return code.toString().padStart(this.OTP_LENGTH, '0');
  }
}
