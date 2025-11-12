import {BindingScope, injectable} from '@loopback/core';
import {repository} from '@loopback/repository';
import crypto from 'crypto';

import {MagicLinkToken} from '../../models';
import {MagicLinkTokenRepository} from '../../repositories';

@injectable({scope: BindingScope.SINGLETON})
export class MagicLinkService {
  private readonly TOKEN_EXPIRY_MINUTES = 15;

  constructor(
    @repository(MagicLinkTokenRepository)
    public magicLinkTokenRepository: MagicLinkTokenRepository,
  ) {}

  /**
   * Generate a magic link token for a user
   */
  async generateToken(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<MagicLinkToken> {
    // Generate cryptographically secure random token
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.TOKEN_EXPIRY_MINUTES);

    // Create token record
    return this.magicLinkTokenRepository.create({
      userId,
      token,
      expiresAt,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      createdAt: new Date(),
    });
  }

  /**
   * Verify a magic link token
   */
  async verifyToken(token: string): Promise<MagicLinkToken | null> {
    return await this.magicLinkTokenRepository.findValidToken(token);
  }

  /**
   * Mark token as used
   */
  async markTokenAsUsed(tokenId: string): Promise<void> {
    await this.magicLinkTokenRepository.markAsUsed(tokenId);
  }

  /**
   * Generate magic link URL
   */
  generateMagicLinkUrl(token: string, baseUrl: string): string {
    return `${baseUrl}/verify?token=${token}`;
  }

  /**
   * Cleanup expired tokens (run periodically via cron)
   */
  async cleanupExpiredTokens(): Promise<number> {
    return await this.magicLinkTokenRepository.deleteExpiredTokens();
  }
}
