# 🔐 Authentication System - Usage Guide

## Overview

Your lottery probability API now has a complete **passwordless authentication system** using magic links sent via email. Users can sign up and log in without passwords, receive JWT tokens, and have their activity tracked.

## 📋 Features

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

### 2. Test Authentication Flow

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

**Dev Mode:** Check your terminal for the magic link URL. It will look like:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 [DEV MODE] Magic Link Email
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
To: user@example.com
Magic Link: http://localhost:3000/auth/verify?token=abc123...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### Step 2: Verify the Magic Link

Copy the token from the console and visit the URL:

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
    "avatarUrl": null,
    "userState": "active",
    "emailVerified": true,
    "language": "en",
    "timezone": "UTC",
    "loginCount": 1,
    "createdAt": "2025-01-15T10:30:00.000Z"
  },
  "subscription": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "tier": "free",
    "status": "active",
    "currentPeriodEnd": null,
    "cancelAtPeriodEnd": false
  }
}
```

**What happens:**
- Token validated (not expired, not used)
- Token marked as used (one-time use)
- User state changed: `pending` → `active`
- Email verified: `emailVerified` set to `true`
- Login tracked: `loginCount` incremented, `lastLoginAt` and `lastLoginIp` updated
- JWT tokens generated

#### Step 3: Use the Access Token

Use the `accessToken` in subsequent requests:

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
    "userState": "active",
    "subscriptionTier": "free"
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

---

### GET `/auth/verify?token=xxx`

Verify magic link token and receive JWT tokens.

**Query Parameters:**
- `token` (required) - The magic link token from the email

**Response:**
```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": { ... },
  "subscription": { ... }
}
```

---

### GET `/auth/me`

Get current user information (requires authentication).

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "user": { ... },
  "subscription": { ... }
}
```

**Note:** This endpoint currently has authentication middleware marked as TODO. You'll need to implement the middleware to enforce authentication.

---

## 🔒 Security Features

| Feature | Details |
|---------|---------|
| **Token Security** | 32-byte cryptographically secure random tokens |
| **Token Expiration** | 15 minutes (configurable in `magicLinkService.ts`) |
| **One-Time Use** | Tokens automatically marked as used after verification |
| **JWT Expiration** | Access: 7 days, Refresh: 30 days |
| **IP Tracking** | Login IP addresses stored in `last_login_ip` |
| **User Agent Tracking** | Device info stored with magic link tokens |
| **Soft Deletes** | User data preserved with `deleted_at` for GDPR compliance |

---

## 💼 Subscription Tiers

### Free Tier (Default)
- **Price:** $0/month
- **Access:** Last 2 months of probability data
- **Features:** Basic lottery probability calculations
- **Ads:** Displayed

### Pro Tier
- **Price:** $4.99/month
- **Access:** Unlimited historical data
- **Features:** All basic features + advanced analytics
- **Ads:** Removed

### Premium Tier
- **Price:** $9.99/month
- **Access:** Unlimited historical data
- **Features:** All Pro features + custom alerts, priority support, API access
- **Ads:** Removed

### Example: Protecting Routes by Tier

```typescript
// In your controllers
if (user.subscriptionTier === 'free') {
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  if (requestedDate < twoMonthsAgo) {
    throw new HttpErrors.Forbidden(
      'Upgrade to Pro for historical data access'
    );
  }
}
```

---

## 🗄️ Database Schema

### User Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `email` | VARCHAR | Unique email address |
| `email_verified` | BOOLEAN | Email verification status |
| `user_state` | VARCHAR | `pending`, `active`, `suspended`, `deleted` |
| `first_name` | VARCHAR | User's first name (optional) |
| `last_name` | VARCHAR | User's last name (optional) |
| `avatar_url` | VARCHAR | Profile picture URL (optional) |
| `phone_number` | VARCHAR | Phone number (optional) |
| `country` | VARCHAR | Country code (optional) |
| `language` | VARCHAR | Preferred language (default: `en`) |
| `timezone` | VARCHAR | User's timezone (default: `UTC`) |
| `email_notifications` | BOOLEAN | Email notification preference |
| `login_count` | INTEGER | Total number of logins |
| `last_login_at` | TIMESTAMP | Last login timestamp |
| `last_login_ip` | VARCHAR | Last login IP address |
| `referral_code` | VARCHAR | Unique referral code |
| `referred_by_user_id` | UUID | Referrer's user ID |
| `created_at` | TIMESTAMP | Account creation time |
| `updated_at` | TIMESTAMP | Last update time |
| `deleted_at` | TIMESTAMP | Soft delete timestamp |

### Subscription Table

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to user table (unique) |
| `tier` | VARCHAR | `free`, `pro`, `premium` |
| `status` | VARCHAR | `active`, `canceled`, `past_due`, `trialing` |
| `stripe_customer_id` | VARCHAR | Stripe customer ID (optional) |
| `stripe_subscription_id` | VARCHAR | Stripe subscription ID (optional) |
| `stripe_price_id` | VARCHAR | Stripe price ID (optional) |
| `current_period_start` | TIMESTAMP | Current billing period start |
| `current_period_end` | TIMESTAMP | Current billing period end |
| `cancel_at_period_end` | BOOLEAN | Cancel at period end flag |
| `canceled_at` | TIMESTAMP | Cancellation timestamp |
| `trial_ends_at` | TIMESTAMP | Trial end timestamp |
| `created_at` | TIMESTAMP | Subscription creation time |
| `updated_at` | TIMESTAMP | Last update time |

### Subscription History Table

Tracks all subscription changes for audit trail and analytics.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `subscription_id` | UUID | Foreign key to subscription table |
| `user_id` | UUID | Foreign key to user table |
| `event_type` | VARCHAR | `created`, `upgraded`, `downgraded`, `canceled`, etc. |
| `from_tier` | VARCHAR | Previous tier (if applicable) |
| `to_tier` | VARCHAR | New tier |
| `reason` | TEXT | Reason for change (optional) |
| `stripe_event_id` | VARCHAR | Stripe event ID (optional) |
| `created_at` | TIMESTAMP | Event timestamp |

### Magic Link Token Table

Stores magic link tokens for passwordless authentication.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to user table |
| `token` | VARCHAR | 64-character random token |
| `expires_at` | TIMESTAMP | Token expiration time |
| `used_at` | TIMESTAMP | When token was used (null if not used) |
| `ip_address` | VARCHAR | IP address of request |
| `user_agent` | TEXT | User agent string |
| `created_at` | TIMESTAMP | Token creation time |

---

## 📧 Email Configuration

### Development Mode

In development, if `RESEND_API_KEY` is not set, emails are logged to the console:

```
📧 [DEV MODE] Magic Link Email
To: user@example.com
Magic Link: http://localhost:3000/auth/verify?token=...
```

### Production Mode (Resend API)

1. **Sign up for Resend:** https://resend.com (100 emails/day free)
2. **Get API Key:** Create an API key in the Resend dashboard
3. **Update `.env`:**
   ```env
   RESEND_API_KEY=re_your_api_key_here
   ```
4. **Verify Domain:** Add and verify your sending domain in Resend
5. **Update FROM_EMAIL:** Edit `src/services/auth/emailService.ts`:
   ```typescript
   private readonly FROM_EMAIL: string = 'noreply@yourdomain.com';
   ```

---

## 🔐 Environment Variables

Required variables in `.env`:

```env
# App Configuration
APP_BASE_URL='http://localhost:3000'  # Used for magic link URLs

# Authentication
JWT_SECRET='your-super-secret-jwt-key-change-this-in-production-min-32-chars'

# Email (Optional for development)
RESEND_API_KEY=''  # Get from https://resend.com
```

### Generate Strong JWT Secret (Production)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and update `JWT_SECRET` in `.env`.

---

## 🧪 Testing Checklist

- [ ] Start application with `npm run dev`
- [ ] Request magic link with email
- [ ] Verify console shows magic link URL (dev mode)
- [ ] Click/curl the magic link URL
- [ ] Verify JWT tokens are returned
- [ ] Verify user state changed from `pending` to `active`
- [ ] Use access token to call `/auth/me`
- [ ] Verify user data and subscription are returned
- [ ] Request magic link again with same email (existing user flow)
- [ ] Verify login count increments

---

## 🛠️ Customization

### Change Token Expiry

Edit `src/services/auth/magicLinkService.ts`:

```typescript
private readonly TOKEN_EXPIRY_MINUTES = 15; // Change to your preference
```

### Change JWT Token Expiry

Edit `src/services/auth/jwtService.ts`:

```typescript
private readonly JWT_EXPIRES_IN = '7d'; // Access token
private readonly JWT_REFRESH_EXPIRES_IN = '30d'; // Refresh token
```

### Customize Email Template

Edit `src/services/auth/emailService.ts`, specifically the `generateMagicLinkEmailHTML` method.

---

## 🚀 Next Steps

### 1. Add Authentication Middleware

Currently, the `/auth/me` endpoint has authentication marked as TODO. You'll need to implement a middleware that:
- Extracts JWT from `Authorization: Bearer <token>` header
- Verifies JWT signature and expiration
- Injects user info into `authentication.currentUser`

### 2. Protect Your Routes

Add authentication checks to your lottery probability endpoints:

```typescript
// Require authentication
if (!currentUser) {
  throw new HttpErrors.Unauthorized('Please log in');
}

// Check subscription tier
if (currentUser.subscriptionTier === 'free' && requestHistoricalData) {
  throw new HttpErrors.Forbidden('Upgrade to Pro for historical data');
}
```

### 3. Implement Stripe Integration

When users upgrade/downgrade subscriptions:
- Create Stripe customer via Stripe API
- Create Stripe subscription
- Store `stripe_customer_id`, `stripe_subscription_id`, `stripe_price_id`
- Handle Stripe webhooks to update subscription status
- Create entries in `subscription_history` table

### 4. Add User Profile Management

Allow users to update their profile:
- Update `first_name`, `last_name`
- Upload and update `avatar_url`
- Update `phone_number`, `country`, `language`, `timezone`
- Update `email_notifications` preferences

### 5. Implement Referral System

Use the built-in referral fields:
- Generate unique `referral_code` for each user
- Track `referred_by_user_id` when users sign up via referral link
- Reward referrers (credits, discounts, etc.)

---

## 📚 Code Examples

### Get User's Subscription Tier

```typescript
const user = await userRepository.findById(userId, {
  include: ['subscription']
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
  stripeEventId: 'evt_123456',
  createdAt: new Date(),
});
```

### Clean Up Expired Tokens (Run via Cron)

```typescript
// In a cron job
const deletedCount = await magicLinkService.cleanupExpiredTokens();
console.log(`Deleted ${deletedCount} expired tokens`);
```

---

## ✅ You're All Set!

Your authentication system is fully configured and ready to use. Test the flow, customize as needed, and start building your subscription features!

**Questions?** Check the implementation files or the detailed setup documentation.
