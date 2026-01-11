import {
  type Interceptor,
  type InvocationContext,
  type InvocationResult,
  type Provider,
  type ValueOrPromise,
  inject,
} from '@loopback/core';
import {HttpErrors, type Request} from '@loopback/rest';
import {SecurityBindings} from '@loopback/security';

import type {UserService} from '@lotto/core';
import type {AuthenticatedUser} from '../types/auth.types';

/**
 * Routes that are excluded from terms acceptance check.
 * These routes need to be accessible even if terms haven't been accepted.
 */
const EXCLUDED_PATHS = [
  '/auth/me',
  '/auth/accept-terms',
  '/auth/request-otp',
  '/auth/verify-otp',
  '/auth/refresh',
  '/ping',
  '/explorer',
];

/**
 * Interceptor that checks if authenticated users have accepted the terms of service.
 *
 * Returns 403 Forbidden with { code: 'TERMS_NOT_ACCEPTED' } if the user
 * hasn't accepted any terms version yet.
 */
export class TermsAcceptanceInterceptor implements Provider<Interceptor> {
  constructor(
    @inject('services.UserService')
    private userService: UserService,
    @inject('rest.http.request', {optional: true})
    private request: Request | undefined,
  ) {}

  value() {
    return this.intercept.bind(this);
  }

  async intercept(
    invocationCtx: InvocationContext,
    next: () => ValueOrPromise<InvocationResult>,
  ): Promise<InvocationResult> {
    // Get the current user from security context
    const user = await invocationCtx.get<AuthenticatedUser>(SecurityBindings.USER, {
      optional: true,
    });

    // If no authenticated user, skip check (let auth handle it)
    if (!user) {
      return next();
    }

    // Check if current path is excluded
    const currentPath = this.request?.path || '';
    const isExcluded = EXCLUDED_PATHS.some(
      path => currentPath === path || currentPath.startsWith(`${path}/`),
    );

    if (isExcluded) {
      return next();
    }

    // Check terms acceptance via service
    const userId = user.id;
    if (!userId) {
      return next();
    }

    const hasAccepted = await this.userService.hasAcceptedTerms(userId);

    if (!hasAccepted) {
      throw Object.assign(new HttpErrors.Forbidden('Terms of service not accepted'), {
        code: 'TERMS_NOT_ACCEPTED',
      });
    }

    return next();
  }
}
