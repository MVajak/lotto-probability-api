import type {AuthenticationStrategy} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {HttpErrors, type RedirectRoute, type Request} from '@loopback/rest';
import {securityId} from '@loopback/security';

import type {JWTService} from '../services';
import type {AuthenticatedUser} from '../types/auth.types';

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
  async authenticate(request: Request): Promise<AuthenticatedUser | RedirectRoute | undefined> {
    const token = this.extractToken(request);

    if (!token) {
      throw new HttpErrors.Unauthorized(
        'Authorization header not found. Please provide a valid JWT token.',
      );
    }

    // Verify and decode token
    const decoded = this.jwtService.verifyToken(token);

    // Return user profile for LoopBack
    // Map to UserProfile interface with securityId
    return {
      [securityId]: decoded.userId,
      id: decoded.userId,
      email: decoded.email,
      subscriptionTierCode: decoded.subscriptionTierCode,
    };
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
