# 🔐 Authentication System Implementation Guide

## ✅ What's Been Created

### Database Tables (4 new tables)
- ✅ `user` - User accounts with all profile data
- ✅ `subscription` - Subscription details (Free/Pro/Premium)
- ✅ `subscription_history` - Audit trail of all subscription changes
- ✅ `magic_link_token` - Passwordless authentication tokens

### Models (4 LoopBack models)
- ✅ `User.model.ts` - src/models/User/
- ✅ `Subscription.model.ts` - src/models/Subscription/
- ✅ `SubscriptionHistory.model.ts` - src/models/SubscriptionHistory/
- ✅ `MagicLinkToken.model.ts` - src/models/MagicLinkToken/

### Repositories (4 repositories)
- ✅ `userRepository.ts` - User CRUD + helpers
- ✅ `subscriptionRepository.ts` - Subscription CRUD
- ✅ `subscriptionHistoryRepository.ts` - History tracking
- ✅ `magicLinkTokenRepository.ts` - Token management

### Services
- ✅ `jwtService.ts` - JWT token generation/verification

---

## 🚧 What Still Needs to Be Created

I'll provide the complete code for the remaining files below. You can create these manually or I can create them for you.

---

## 📁 File 1: Magic Link Service

**Path:** `src/services/auth/magicLinkService.ts`

```typescript
import {BindingScope, inject, injectable} from '@loopback/core';
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
    const magicLinkToken = await this.magicLinkTokenRepository.create({
      userId,
      token,
      expiresAt,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      createdAt: new Date(),
    });

    return magicLinkToken;
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
    return `${baseUrl}/auth/verify?token=${token}`;
  }

  /**
   * Cleanup expired tokens (run periodically via cron)
   */
  async cleanupExpiredTokens(): Promise<number> {
    return await this.magicLinkTokenRepository.deleteExpiredTokens();
  }
}
```

---

## 📁 File 2: Email Service (Resend Integration)

**Path:** `src/services/auth/emailService.ts`

```typescript
import {BindingScope, inject, injectable} from '@loopback/core';

@injectable({scope: BindingScope.SINGLETON})
export class EmailService {
  private readonly RESEND_API_KEY: string;
  private readonly FROM_EMAIL: string = 'noreply@yourdomain.com'; // Change this!
  private readonly APP_NAME: string = 'LottoProbability';

  constructor(
    @inject('email.resendApiKey', {optional: true})
    resendApiKey?: string,
  ) {
    this.RESEND_API_KEY = resendApiKey || process.env.RESEND_API_KEY || '';

    if (!this.RESEND_API_KEY) {
      console.warn(
        '⚠️  WARNING: RESEND_API_KEY not set. Email sending will fail. Add RESEND_API_KEY to .env',
      );
    }
  }

  /**
   * Send magic link email
   */
  async sendMagicLinkEmail(email: string, magicLinkUrl: string): Promise<void> {
    if (!this.RESEND_API_KEY) {
      console.log(`📧 [DEV MODE] Magic link for ${email}: ${magicLinkUrl}`);
      return; // In development, just log the link
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: this.FROM_EMAIL,
          to: email,
          subject: `Log in to ${this.APP_NAME}`,
          html: this.generateMagicLinkEmailHTML(magicLinkUrl),
        }),
      });

      if (!response.ok) {
        throw new Error(`Email sending failed: ${response.statusText}`);
      }

      console.log(`✅ Magic link email sent to ${email}`);
    } catch (error) {
      console.error('❌ Failed to send magic link email:', error);
      throw error;
    }
  }

  /**
   * Generate HTML for magic link email
   */
  private generateMagicLinkEmailHTML(magicLinkUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button {
              display: inline-block;
              background: #0070f3;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 500;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Log in to ${this.APP_NAME}</h1>
            <p>Click the button below to securely log in to your account:</p>
            <p>
              <a href="${magicLinkUrl}" class="button">Log in to ${this.APP_NAME}</a>
            </p>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 15 minutes.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't request this email, you can safely ignore it.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              Or copy and paste this URL into your browser:<br>
              ${magicLinkUrl}
            </p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Send welcome email (when user first signs up)
   */
  async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    // TODO: Implement welcome email
    console.log(`📧 Welcome email would be sent to ${email}`);
  }
}
```

---

## 📁 File 3: Auth Controller

**Path:** `src/controllers/authController.ts`

```typescript
import {inject} from '@loopback/core';
import {repository} from '@loopback/repository';
import {post, requestBody, get, param, HttpErrors, Request, RestBindings} from '@loopback/rest';

import {Subscription, User} from '../models';
import {SubscriptionRepository, UserRepository} from '../repositories';
import {EmailService, JWTService, MagicLinkService} from '../services/auth';

export class AuthController {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    @inject('services.JWTService')
    public jwtService: JWTService,
    @inject('services.MagicLinkService')
    public magicLinkService: MagicLinkService,
    @inject('services.EmailService')
    public emailService: EmailService,
    @inject(RestBindings.Http.REQUEST)
    private request: Request,
  ) {}

  /**
   * Request magic link - Step 1 of login
   */
  @post('/auth/request-magic-link')
  async requestMagicLink(
    @requestBody({
      description: 'Request magic link',
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email'],
            properties: {
              email: {type: 'string', format: 'email'},
            },
          },
        },
      },
    })
    body: {email: string},
  ): Promise<{message: string}> {
    const {email} = body;

    // Find or create user
    let user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Create new user
      user = await this.userRepository.create({
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
    }

    // Generate magic link token
    const ipAddress = this.request.ip;
    const userAgent = this.request.get('user-agent') || undefined;
    const token = await this.magicLinkService.generateToken(user.id, ipAddress, userAgent);

    // Generate magic link URL
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const magicLinkUrl = this.magicLinkService.generateMagicLinkUrl(token.token, baseUrl);

    // Send email
    await this.emailService.sendMagicLinkEmail(email, magicLinkUrl);

    return {
      message: 'Magic link sent to your email. Please check your inbox.',
    };
  }

  /**
   * Verify magic link - Step 2 of login
   */
  @get('/auth/verify')
  async verifyMagicLink(
    @param.query.string('token') token: string,
  ): Promise<{accessToken: string; refreshToken: string; user: Partial<User>}> {
    if (!token) {
      throw new HttpErrors.BadRequest('Token is required');
    }

    // Verify token
    const magicLinkToken = await this.magicLinkService.verifyToken(token);

    if (!magicLinkToken) {
      throw new HttpErrors.Unauthorized('Invalid or expired token');
    }

    // Mark token as used
    await this.magicLinkService.markTokenAsUsed(magicLinkToken.id);

    // Get user with subscription
    const user = await this.userRepository.findById(magicLinkToken.userId, {
      include: ['subscription'],
    });

    // Update user state to active on first login
    if (user.userState === 'pending') {
      await this.userRepository.updateById(user.id, {
        userState: 'active',
        emailVerified: true,
      });
    }

    // Track login
    await this.userRepository.trackLogin(user.id, this.request.ip);

    // Get subscription
    const subscription =
      (await this.subscriptionRepository.findByUserId(user.id)) ||
      ({tier: 'free'} as Subscription);

    // Generate JWT tokens
    const accessToken = this.jwtService.generateToken({
      userId: user.id,
      email: user.email,
      subscriptionTier: subscription.tier,
    });

    const refreshToken = this.jwtService.generateRefreshToken({
      userId: user.id,
      email: user.email,
      subscriptionTier: subscription.tier,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userState: user.userState,
        ...user,
      },
    };
  }

  /**
   * Get current user from JWT
   */
  @get('/auth/me')
  async getCurrentUser(
    @inject('authentication.currentUser') currentUser: any,
  ): Promise<Partial<User>> {
    const user = await this.userRepository.findById(currentUser.userId, {
      include: ['subscription'],
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userState: user.userState,
      ...user,
    };
  }
}
```

---

## 🔧 Environment Variables

Add to your `.env` file:

```env
# JWT Secret (generate a strong random string for production)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters

# Resend API Key (get from https://resend.com)
RESEND_API_KEY=re_your_api_key_here

# App Base URL (for magic link generation)
APP_BASE_URL=http://localhost:3000
```

---

## 🚀 How to Use the Authentication System

### 1. Request Magic Link (Login/Signup)

```bash
POST http://localhost:3000/auth/request-magic-link
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Magic link sent to your email. Please check your inbox."
}
```

### 2. Click Magic Link (User clicks link in email)

The link looks like:
```
http://localhost:3000/auth/verify?token=abc123...
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "userState": "active",
    "firstName": null,
    ...
  }
}
```

### 3. Use Access Token for Authenticated Requests

```bash
GET http://localhost:3000/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 📋 Next Steps to Complete

1. **Create the remaining service files** (magicLinkService.ts, emailService.ts)
2. **Create the auth controller** (authController.ts)
3. **Add authentication middleware** to protect routes
4. **Add JWT secret** to .env
5. **Test the flow** end-to-end

Would you like me to create all the remaining files now?
