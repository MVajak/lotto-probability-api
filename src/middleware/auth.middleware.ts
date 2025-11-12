import {AuthenticationStrategy} from '@loopback/authentication';
import {inject, Provider} from '@loopback/core';
import {HttpErrors, Request} from '@loopback/rest';
import {securityId, UserProfile} from '@loopback/security';

import {JWTService} from '../services/auth';

/**
 * JWT Authentication Strategy
 * Extracts JWT from Authorization header and verifies it
 */
export class JWTAuthenticationStrategy implements AuthenticationStrategy {
  name = 'jwt';

  constructor(
    @inject('services.JWTService')
    private jwtService: JWTService,
  ) {}

  /**
   * Authenticate the request by extracting and verifying JWT token
   */
  async authenticate(request: Request): Promise<UserProfile> {
    const token = this.extractToken(request);

    if (!token) {
      throw new HttpErrors.Unauthorized(
        'Authorization header not found. Please provide a valid JWT token.',
      );
    }

    try {
      // Verify and decode token
      const decoded = this.jwtService.verifyToken(token);

      // Return user profile for LoopBack
      // Map to UserProfile interface with securityId
      return {
        [securityId]: decoded.userId,
        id: decoded.userId,
        email: decoded.email,
        subscriptionTier: decoded.subscriptionTier,
      };
    } catch (error) {
      // JWTService already throws proper HttpErrors
      throw error;
    }
  }

  /**
   * Extract JWT token from Authorization header
   * Format: "Bearer <token>"
   */
  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return null;
    }

    // Check for "Bearer " prefix
    if (!authHeader.startsWith('Bearer ')) {
      throw new HttpErrors.Unauthorized(
        'Authorization header must use Bearer scheme. Format: "Bearer <token>"',
      );
    }

    // Extract token after "Bearer "
    const token = authHeader.substring(7);

    if (!token) {
      return null;
    }

    return token;
  }
}

/**
 * Provider for JWT Authentication Strategy
 * Registers the strategy with LoopBack's authentication system
 */
export class JWTAuthenticationStrategyProvider implements Provider<AuthenticationStrategy> {
  constructor(
    @inject('services.JWTService')
    private jwtService: JWTService,
  ) {}

  value(): AuthenticationStrategy {
    return new JWTAuthenticationStrategy(this.jwtService);
  }
}
