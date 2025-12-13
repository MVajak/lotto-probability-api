import {BindingScope, inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import {
  JsonWebTokenError,
  type JwtPayload as JsonWebTokenPayload,
  type SignOptions,
  TokenExpiredError,
  type VerifyOptions,
  sign,
  verify,
} from 'jsonwebtoken';

import type {SubscriptionTier} from '@lotto/database';

/**
 * Custom JWT payload interface
 * Extends the standard JWT payload with our custom fields
 */
export interface JWTPayload extends JsonWebTokenPayload {
  userId: string;
  email: string;
  subscriptionTier: SubscriptionTier;
}

@injectable({scope: BindingScope.SINGLETON})
export class JWTService {
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN = '7d' as const; // 7 days
  private readonly REFRESH_TOKEN_EXPIRES_IN = '30d' as const; // 30 days

  constructor(
    @inject('jwt.secret', {optional: true})
    jwtSecret?: string,
  ) {
    const secret = jwtSecret || process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    this.JWT_SECRET = secret;
  }

  /**
   * Generate JWT access token
   */
  generateToken(
    payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'sub' | 'aud' | 'nbf' | 'jti'>,
  ): string {
    const options: SignOptions = {
      expiresIn: this.JWT_EXPIRES_IN,
    };
    return sign(payload, this.JWT_SECRET, options);
  }

  /**
   * Generate refresh token (longer expiry)
   */
  generateRefreshToken(
    payload: Omit<JWTPayload, 'iat' | 'exp' | 'iss' | 'sub' | 'aud' | 'nbf' | 'jti'>,
  ): string {
    const options: SignOptions = {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    };
    return sign(payload, this.JWT_SECRET, options);
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): JWTPayload {
    try {
      const options: VerifyOptions = {
        complete: false,
      };
      const decoded = verify(token, this.JWT_SECRET, options);

      // Type guard to ensure decoded has our expected shape
      if (this.isJWTPayload(decoded)) {
        return decoded;
      }

      throw new HttpErrors.Unauthorized('Invalid token payload structure');
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new HttpErrors.Unauthorized('Token expired');
      }
      if (error instanceof JsonWebTokenError) {
        throw new HttpErrors.Unauthorized('Invalid token');
      }
      if (error instanceof HttpErrors.HttpError) {
        throw error;
      }
      throw new HttpErrors.Unauthorized('Token verification failed');
    }
  }

  /**
   * Type guard to check if decoded token has our expected payload structure
   */
  private isJWTPayload(decoded: unknown): decoded is JWTPayload {
    if (typeof decoded !== 'object' || decoded === null) {
      return false;
    }

    const payload = decoded as Record<string, unknown>;

    return (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.subscriptionTier === 'string'
    );
  }
}
