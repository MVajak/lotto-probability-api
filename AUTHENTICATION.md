# 🔐 Authentication System

Complete guide for the lottery probability API authentication system.

---

## 📋 Overview

**Passwordless authentication system** using magic links sent via email. Users can sign up and log in without passwords, receive JWT tokens, and have their activity tracked.

### Features

✅ **Magic Link Authentication** - Passwordless login via email
✅ **User Management** - Track login count, IP addresses, user state
✅ **3-Tier Subscriptions** - Free, Pro ($4.99), Premium ($9.99)
✅ **JWT Tokens** - 7-day access tokens, 30-day refresh tokens
✅ **User State Lifecycle** - pending → active → suspended → deleted
✅ **Audit Trail** - Subscription change history tracked
✅ **Referral System** - Built-in referral code support

---

## 🚀 Quick Start

### 1. Start the Application

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### 2. Authentication Flow

#### Step 1: Request a Magic Link

```bash
curl -X POST http://localhost:3000/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Response:**

```json
{
  "message": "Magic link sent to your email. Please check your inbox."
}
```

**What happens:**

- New user created with state `pending`
- Free subscription automatically created
- Magic link token generated (expires in 15 minutes)
- Email sent (or logged to console in dev mode)

**Dev Mode:** Check your terminal for the magic link URL:

```
╔═══════════════════════════════════════════════════════════════════╗
║  📧  [DEV MODE] Magic Link Email                                 ║
╠═══════════════════════════════════════════════════════════════════╣
║  To: user@example.com                                            ║
╠═══════════════════════════════════════════════════════════════════╣
║  🔗 VERIFY LINK (click or copy to test):                         ║
║                                                                   ║
║  http://localhost:3000/auth/verify?token=abc123...               ║
║                                                                   ║
║  ⏱  Link expires in 15 minutes                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

#### Step 2: Verify the Magic Link

```bash
curl "http://localhost:3000/auth/verify?token=YOUR_TOKEN_HERE"
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": null,
    "lastName": null,
    "userState": "active",
    "emailVerified": true,
    "loginCount": 1
  },
  "subscription": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "tier": "free",
    "status": "active"
  }
}
```

**What happens:**

- Token validated (not expired, not used)
- Token marked as used (one-time use)
- User state changed: `pending` → `active`
- Email verified: `emailVerified` set to `true`
- Login tracked: `loginCount` incremented
- JWT tokens generated

#### Step 3: Use the Access Token

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Response:**

```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "userState": "active"
  },
  "subscription": {
    "tier": "free",
    "status": "active"
  }
}
```

---

## 📊 API Endpoints

### POST `/auth/request-magic-link`

Request a magic link for login/signup.

**Request:**

```json
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

### GET `/auth/verify?token=xxx`

Verify magic link token and receive JWT tokens.

**Query Parameters:**

- `token` (required) - The magic link token from the email

**Response:**

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {},
  "subscription": {}
}
```

### GET `/auth/me`

Get current user information (requires authentication).

**Headers:**

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**

```json
{
  "user": {},
  "subscription": {}
}
```

### POST `/auth/refresh`

Refresh access token using refresh token.

**Request:**

```json
{
  "refreshToken": "your-refresh-token"
}
```

**Response:**

```json
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token"
}
```

---

## 🏗️ Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      HTTP Layer                              │
│  AuthController - Handles HTTP requests/responses           │
│  - Extracts request data (IP, user agent, body)            │
│  - Delegates business logic to AuthService                  │
│  - Returns HTTP responses                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│  AuthService - Core authentication logic                    │
│  - User registration and login flows                        │
│  - Token generation and verification                        │
│  - User activation and tracking                             │
│  - Reusable across controllers, middleware, cron jobs       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Layer                        │
│  ├─ JWTService - JWT token operations                      │
│  ├─ MagicLinkService - Magic link generation/validation    │
│  ├─ EmailService - Email sending (Resend API)              │
│  ├─ UserRepository - User data access                      │
│  └─ SubscriptionRepository - Subscription data access      │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── controllers/
│   └── authController.ts          # HTTP layer (~110 lines)
├── services/
│   └── auth/
│       ├── authService.ts         # Business logic (~305 lines)
│       ├── jwtService.ts          # JWT operations
│       ├── magicLinkService.ts    # Magic link operations
│       ├── emailService.ts        # Email operations
│       └── index.ts               # Exports
├── middleware/
│   └── auth.middleware.ts         # JWT authentication strategy
├── repositories/
│   ├── userRepository.ts          # User data access
│   └── subscriptionRepository.ts  # Subscription data access
└── models/
    ├── User.ts
    ├── Subscription.ts
    └── MagicLinkToken.ts
```

### Component Responsibilities

**AuthController** (HTTP Layer)

- Handles HTTP requests/responses
- Extracts data from HTTP context
- Delegates all business logic to AuthService
- Returns formatted HTTP responses

**AuthService** (Business Logic)

- Core authentication business logic
- User registration (find or create)
- Magic link generation and verification
- User activation (pending → active)
- Token generation and validation
- Data sanitization

**Specialized Services**

- `JWTService` - JWT token signing and verification
- `MagicLinkService` - Magic link token management
- `EmailService` - Email sending via Resend API

---

## 🔐 JWT Authentication Middleware

### How It Works

```
1. Client makes request with Authorization header
   ↓
2. AuthenticationMiddleware intercepts request
   ↓
3. JWTAuthenticationStrategy extracts token
   ↓
4. JWTService verifies token
   ↓
5. User profile injected into request context
   ↓
6. Controller receives authenticated user data
```

### Protecting Endpoints

```typescript
import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {UserProfile} from '@loopback/security';

export class AuthController {
  @authenticate('jwt') // ← Require authentication
  @get('/auth/me')
  async getCurrentUser(
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile, // ← Authenticated user
  ) {
    const userId = currentUser.id as string;
    return await this.authService.getCurrentUser(userId);
  }
}
```

### Making Authenticated Requests

```bash
# Get access token from login
curl "http://localhost:3000/auth/verify?token=YOUR_TOKEN"

# Use token in Authorization header
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Error Responses

| Error                     | HTTP Status | Message                                          |
| ------------------------- | ----------- | ------------------------------------------------ |
| No `Authorization` header | 401         | "Authorization header not found..."              |
| Invalid format            | 401         | "Authorization header must use Bearer scheme..." |
| Token expired             | 401         | "Token expired"                                  |
| Invalid signature         | 401         | "Invalid token"                                  |
| Malformed token           | 401         | "Token verification failed"                      |

### UserProfile Structure

```typescript
interface UserProfile {
  [securityId]: string; // Primary identifier
  id: string; // User ID
  email: string; // User email
  subscriptionTier: 'free' | 'pro' | 'premium';
}
```

---

## 🔒 Security Features

| Feature                 | Details                                        |
| ----------------------- | ---------------------------------------------- |
| **Token Security**      | 32-byte cryptographically secure random tokens |
| **Token Expiration**    | Magic links: 15 minutes                        |
| **One-Time Use**        | Tokens marked as used after verification       |
| **JWT Expiration**      | Access: 7 days, Refresh: 30 days               |
| **IP Tracking**         | Login IP addresses tracked                     |
| **User Agent Tracking** | Device info stored                             |

---

## 💼 Subscription Tiers

### Free Tier (Default)

- **Price:** $0/month
- **Access:** Last 2 months of probability data
- **Features:** Basic lottery probability calculations

### Pro Tier

- **Price:** $4.99/month
- **Access:** Unlimited historical data
- **Features:** Advanced analytics

### Premium Tier

- **Price:** $9.99/month
- **Access:** Unlimited historical data
- **Features:** Custom alerts, priority support, API access

### Protecting Routes by Tier

```typescript
if (user.subscriptionTier === 'free') {
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  if (requestedDate < twoMonthsAgo) {
    throw new HttpErrors.Forbidden('Upgrade to Pro for historical data access');
  }
}
```

---

## 🗄️ Database Schema

### User Table

| Field                 | Type      | Description                                 |
| --------------------- | --------- | ------------------------------------------- |
| `id`                  | UUID      | Primary key                                 |
| `email`               | VARCHAR   | Unique email address                        |
| `email_verified`      | BOOLEAN   | Email verification status                   |
| `user_state`          | VARCHAR   | `pending`, `active`, `suspended`, `deleted` |
| `first_name`          | VARCHAR   | Optional                                    |
| `last_name`           | VARCHAR   | Optional                                    |
| `avatar_url`          | VARCHAR   | Optional                                    |
| `language`            | VARCHAR   | Default: `en`                               |
| `timezone`            | VARCHAR   | Default: `UTC`                              |
| `login_count`         | INTEGER   | Total logins                                |
| `last_login_at`       | TIMESTAMP | Last login time                             |
| `last_login_ip`       | VARCHAR   | Last login IP                               |
| `referral_code`       | VARCHAR   | Unique referral code                        |
| `referred_by_user_id` | UUID      | Referrer's ID                               |
| `created_at`          | TIMESTAMP | Creation time                               |
| `updated_at`          | TIMESTAMP | Last update                                 |
| `deleted_at`          | TIMESTAMP | Soft delete                                 |

### Subscription Table

| Field                    | Type      | Description                                  |
| ------------------------ | --------- | -------------------------------------------- |
| `id`                     | UUID      | Primary key                                  |
| `user_id`                | UUID      | Foreign key (unique)                         |
| `tier`                   | VARCHAR   | `free`, `pro`, `premium`                     |
| `status`                 | VARCHAR   | `active`, `canceled`, `past_due`, `trialing` |
| `stripe_customer_id`     | VARCHAR   | Optional                                     |
| `stripe_subscription_id` | VARCHAR   | Optional                                     |
| `current_period_start`   | TIMESTAMP | Billing period start                         |
| `current_period_end`     | TIMESTAMP | Billing period end                           |
| `cancel_at_period_end`   | BOOLEAN   | Cancel flag                                  |

### Subscription History Table

| Field             | Type      | Description                               |
| ----------------- | --------- | ----------------------------------------- |
| `id`              | UUID      | Primary key                               |
| `subscription_id` | UUID      | Foreign key                               |
| `user_id`         | UUID      | Foreign key                               |
| `event_type`      | VARCHAR   | `created`, `upgraded`, `downgraded`, etc. |
| `from_tier`       | VARCHAR   | Previous tier                             |
| `to_tier`         | VARCHAR   | New tier                                  |
| `reason`          | TEXT      | Optional                                  |
| `created_at`      | TIMESTAMP | Event time                                |

### Magic Link Token Table

| Field        | Type      | Description                 |
| ------------ | --------- | --------------------------- |
| `id`         | UUID      | Primary key                 |
| `user_id`    | UUID      | Foreign key                 |
| `token`      | VARCHAR   | 64-character random token   |
| `expires_at` | TIMESTAMP | Expiration time             |
| `used_at`    | TIMESTAMP | Usage time (null if unused) |
| `ip_address` | VARCHAR   | Request IP                  |
| `user_agent` | TEXT      | User agent string           |
| `created_at` | TIMESTAMP | Creation time               |

---

## 📧 Email Configuration

### Development Mode

If `RESEND_API_KEY` is not set, emails are logged to console with a clear format showing the magic link URL.

### Production Mode (Resend API)

1. Sign up at https://resend.com (100 emails/day free)
2. Get API key from dashboard
3. Update `.env`:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   ```
4. Verify your sending domain
5. Update `FROM_EMAIL` in `src/services/auth/emailService.ts`

---

## 🔐 Environment Variables

Required in `.env`:

```env
# App Configuration
APP_BASE_URL='http://localhost:3000'

# Authentication
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET='your-jwt-secret-here'

# Email (Optional for development)
RESEND_API_KEY=''
```

---

## 🧪 Testing

### Complete Flow Test

```bash
# 1. Request magic link
curl -X POST http://localhost:3000/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# 2. Check console for magic link token, then verify
curl "http://localhost:3000/auth/verify?token=TOKEN_FROM_CONSOLE"

# 3. Use access token
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Test refresh token
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

### Test Error Cases

```bash
# Missing token
curl http://localhost:3000/auth/me
# → 401: "Authorization header not found"

# Invalid token
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer invalid_token"
# → 401: "Invalid token"

# Expired token
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <expired_token>"
# → 401: "Token expired"
```

---

## 🛠️ Customization

### Change Magic Link Expiry

Edit the following line in `src/services/auth/magicLinkService.ts`:

```
private readonly TOKEN_EXPIRY_MINUTES = 15; // Change this value
```

### Change JWT Token Expiry

Edit the following lines in `src/services/auth/jwtService.ts`:

```
private readonly JWT_EXPIRES_IN = '7d' as const;
private readonly REFRESH_TOKEN_EXPIRES_IN = '30d' as const;
```

### Customize Email Template

Edit `generateMagicLinkEmailHTML()` in `src/services/auth/emailService.ts`

---

## 📝 Code Examples

### Get User with Subscription

```typescript
const user = await userRepository.findById(userId, {
  include: ['subscription'],
});

console.log(user.subscription?.tier); // 'free', 'pro', or 'premium'
```

### Track Subscription Change

```typescript
await subscriptionHistoryRepository.create({
  subscriptionId: subscription.id,
  userId: user.id,
  eventType: 'upgraded',
  fromTier: 'free',
  toTier: 'pro',
  reason: 'User upgraded via Stripe',
  createdAt: new Date(),
});
```

### Clean Up Expired Tokens

```typescript
// Run via cron job
const deletedCount = await magicLinkService.cleanupExpiredTokens();
console.log(`Deleted ${deletedCount} expired tokens`);
```

### Protect Endpoint with Optional Auth

Example controller method with optional authentication:

```
@get('/public/data')
async getPublicData(
  @inject(AuthenticationBindings.CURRENT_USER, {optional: true})
  currentUser?: UserProfile,
) {
  if (currentUser) {
    return this.getPersonalizedData(currentUser.id);
  } else {
    return this.getGenericData();
  }
}
```

---

## 🚀 Next Steps

### 1. Implement Stripe Integration

- Create Stripe customer
- Handle subscription upgrades/downgrades
- Process webhooks
- Update subscription status

### 2. Add User Profile Management

- Update first name, last name
- Upload avatar
- Update preferences (language, timezone, notifications)

### 3. Implement Referral System

- Generate unique referral codes
- Track referrals via `referred_by_user_id`
- Reward referrers

### 4. Add Admin Features

- User management (suspend, delete)
- Subscription management
- View audit trail

---

## ✅ Summary

**Your authentication system includes:**

- ✅ Passwordless magic link authentication
- ✅ JWT token-based sessions (7-day access, 30-day refresh)
- ✅ Protected endpoints with `@authenticate('jwt')`
- ✅ 3-tier subscription system
- ✅ User state management (pending → active → suspended → deleted)
- ✅ Login tracking (count, IP, timestamp)
- ✅ Audit trail for subscription changes
- ✅ Email integration (Resend API)
- ✅ Development mode with console logging
- ✅ Clean layered architecture (Controller → Service → Repository)
- ✅ Type-safe (zero type assertions in JWT service)
- ✅ Secure token generation (cryptographically random)

The system is production-ready and follows best practices for security, maintainability, and scalability! 🎉
