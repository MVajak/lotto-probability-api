# 🔐 JWT Authentication Middleware

## Overview

The `/auth/me` endpoint is now protected with JWT authentication middleware. Users must provide a valid JWT token in the `Authorization` header to access authenticated endpoints.

---

## 📁 Files Created

### 1. **Authentication Middleware** (`src/middleware/auth.middleware.ts`)

Implements JWT authentication strategy for LoopBack:
- Extracts JWT from `Authorization` header
- Verifies token signature and expiration
- Injects authenticated user data into request context
- Returns proper error messages for invalid/missing tokens

---

## 🔧 How It Works

### Authentication Flow

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

### Code Flow

```typescript
// 1. Client Request
GET /auth/me
Headers:
  Authorization: Bearer eyJhbGc...

// 2. Middleware extracts token
const token = extractToken(request);  // "eyJhbGc..."

// 3. JWT Service verifies
const decoded = jwtService.verifyToken(token);
// {userId: "123", email: "user@example.com", subscriptionTier: "free"}

// 4. Create UserProfile
const userProfile: UserProfile = {
  [securityId]: decoded.userId,
  id: decoded.userId,
  email: decoded.email,
  subscriptionTier: decoded.subscriptionTier,
};

// 5. Inject into controller
@authenticate('jwt')
async getCurrentUser(
  @inject(AuthenticationBindings.CURRENT_USER)
  currentUser: UserProfile
) {
  // currentUser is now available
}
```

---

## 🚀 Usage

### Protected Endpoint Example

```typescript
import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {get, inject} from '@loopback/core';
import {UserProfile} from '@loopback/security';

export class AuthController {
  /**
   * Protected endpoint - requires JWT
   */
  @authenticate('jwt')  // ← Add this decorator
  @get('/auth/me')
  async getCurrentUser(
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,  // ← Authenticated user injected here
  ) {
    const userId = currentUser.id as string;
    return await this.authService.getCurrentUser(userId);
  }
}
```

### Making Authenticated Requests

#### cURL Example

```bash
# 1. Login to get access token
curl -X POST http://localhost:3000/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'

# 2. Verify magic link (copy token from email/console)
curl "http://localhost:3000/auth/verify?token=YOUR_TOKEN_HERE"

# Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "...",
  "user": {...},
  "subscription": {...}
}

# 3. Use access token for authenticated requests
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### JavaScript/TypeScript Example

```typescript
// After login
const loginResponse = await fetch('/auth/verify?token=xxx');
const {accessToken} = await loginResponse.json();

// Store token (localStorage, cookies, etc.)
localStorage.setItem('accessToken', accessToken);

// Make authenticated requests
const response = await fetch('/auth/me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
  },
});

const data = await response.json();
console.log(data.user);
```

---

## 🛡️ Security Features

### 1. **Token Format Validation**

```typescript
// ✅ Valid formats
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

// ❌ Invalid formats (will be rejected)
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...  // Missing "Bearer"
Authorization: Basic dXNlcjpwYXNzd29yZA==  // Wrong scheme
```

### 2. **Token Verification**

The middleware verifies:
- ✅ Token signature (signed with JWT_SECRET)
- ✅ Token expiration (`exp` claim)
- ✅ Token structure (valid JWT format)

### 3. **Error Handling**

| Error | HTTP Status | Response |
|-------|-------------|----------|
| No `Authorization` header | 401 | "Authorization header not found..." |
| Invalid format (no "Bearer") | 401 | "Authorization header must use Bearer scheme..." |
| Token expired | 401 | "Token expired" |
| Invalid signature | 401 | "Invalid token" |
| Malformed token | 401 | "Token verification failed" |

---

## 📊 UserProfile Structure

The authenticated user data is injected as a `UserProfile` object:

```typescript
interface UserProfile {
  [securityId]: string;  // Primary identifier for security
  id: string;            // User ID
  email: string;         // User email
  subscriptionTier: 'free' | 'pro' | 'premium';  // Subscription level
}
```

### Accessing User Data in Controllers

```typescript
@authenticate('jwt')
async someProtectedEndpoint(
  @inject(AuthenticationBindings.CURRENT_USER)
  currentUser: UserProfile,
) {
  const userId = currentUser.id as string;
  const email = currentUser.email;
  const tier = currentUser.subscriptionTier;

  // Use these values...
}
```

---

## 🔧 Configuration

### Register Strategy in Application

The authentication strategy is registered in `src/application.ts`:

```typescript
import {AuthenticationComponent} from '@loopback/authentication';
import {JWTAuthenticationStrategy} from './middleware/auth.middleware';

export class LottoApiApplication extends ... {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Register authentication component
    this.component(AuthenticationComponent);

    // Register JWT strategy
    this.bind('authentication.strategies.jwt').toClass(JWTAuthenticationStrategy);

    // ... rest of configuration
  }
}
```

---

## 🧪 Testing

### Test Protected Endpoint Without Token

```bash
curl http://localhost:3000/auth/me

# Response: 401 Unauthorized
{
  "error": {
    "statusCode": 401,
    "message": "Authorization header not found. Please provide a valid JWT token."
  }
}
```

### Test with Invalid Token

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer invalid_token_here"

# Response: 401 Unauthorized
{
  "error": {
    "statusCode": 401,
    "message": "Invalid token"
  }
}
```

### Test with Expired Token

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <expired_token>"

# Response: 401 Unauthorized
{
  "error": {
    "statusCode": 401,
    "message": "Token expired"
  }
}
```

### Test with Valid Token

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <valid_token>"

# Response: 200 OK
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": null,
    "lastName": null,
    "userState": "active",
    ...
  },
  "subscription": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "tier": "free",
    "status": "active",
    ...
  }
}
```

---

## 🔐 Protecting Other Endpoints

### Example: Protect Lottery Probability Endpoint

```typescript
import {authenticate, AuthenticationBindings} from '@loopback/authentication';
import {inject} from '@loopback/core';
import {UserProfile} from '@loopback/security';

export class LottoProbabilityController {
  /**
   * Get lottery probability - requires authentication
   */
  @authenticate('jwt')
  @get('/lottery/probability')
  async getProbability(
    @inject(AuthenticationBindings.CURRENT_USER)
    currentUser: UserProfile,
    @param.query.string('lotteryType') lotteryType: string,
  ) {
    const userId = currentUser.id as string;
    const tier = currentUser.subscriptionTier;

    // Check subscription tier
    if (tier === 'free') {
      // Limit to last 2 months for free users
    }

    // ... rest of logic
  }
}
```

### Example: Optional Authentication

```typescript
/**
 * Endpoint that works with or without authentication
 */
@get('/public/data')
async getPublicData(
  @inject(AuthenticationBindings.CURRENT_USER, {optional: true})
  currentUser?: UserProfile,
) {
  if (currentUser) {
    // User is authenticated - provide personalized data
    return this.getPersonalizedData(currentUser.id);
  } else {
    // User is not authenticated - provide generic data
    return this.getGenericData();
  }
}
```

---

## 🚨 Common Issues

### Issue 1: "Authorization header not found"

**Cause:** Missing `Authorization` header in request

**Solution:**
```typescript
// ❌ Wrong
fetch('/auth/me')

// ✅ Correct
fetch('/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
})
```

### Issue 2: "Authorization header must use Bearer scheme"

**Cause:** Wrong authorization scheme or format

**Solution:**
```bash
# ❌ Wrong
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Authorization: Basic xxx
Authorization: Bearer: xxx

# ✅ Correct
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Issue 3: "Token expired"

**Cause:** Access token has expired (7-day expiry)

**Solution:** Use the refresh token to get a new access token:

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN"}'
```

---

## 📚 Related Documentation

- [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) - Complete auth system guide
- [AUTH_ARCHITECTURE.md](./AUTH_ARCHITECTURE.md) - Service layer architecture
- [TYPE_SAFETY_IMPROVEMENTS.md](./TYPE_SAFETY_IMPROVEMENTS.md) - Type definitions

---

## ✅ Summary

**Authentication middleware is now active!**

- ✅ JWT authentication strategy implemented
- ✅ `/auth/me` endpoint protected with `@authenticate('jwt')`
- ✅ Token extraction from `Authorization: Bearer <token>` header
- ✅ Token verification with proper error handling
- ✅ User profile injection into controller methods
- ✅ Ready to protect other endpoints

**Next Steps:**
1. Test the authentication flow end-to-end
2. Add `@authenticate('jwt')` to other endpoints that need protection
3. Implement authorization logic based on subscription tiers
4. Add rate limiting for authenticated endpoints

🎉 Your API is now securely protected!
