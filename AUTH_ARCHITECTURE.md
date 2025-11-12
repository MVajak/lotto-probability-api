# 🏗️ Authentication Architecture - Service Layer Pattern

## Overview

The authentication system follows a **clean layered architecture** with proper separation of concerns:

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

---

## 📁 File Structure

```
src/
├── controllers/
│   └── authController.ts          # HTTP layer (thin)
├── services/
│   └── auth/
│       ├── authService.ts         # Business logic (NEW!)
│       ├── jwtService.ts          # JWT operations
│       ├── magicLinkService.ts    # Magic link operations
│       ├── emailService.ts        # Email operations
│       └── index.ts               # Exports
├── repositories/
│   ├── userRepository.ts          # User data access
│   ├── subscriptionRepository.ts  # Subscription data access
│   └── ...
└── models/
    ├── User/
    ├── Subscription/
    └── ...
```

---

## 🎯 Responsibilities

### AuthController (HTTP Layer)
**File:** `src/controllers/authController.ts`

**What it does:**
- Handles HTTP requests/responses
- Extracts data from HTTP context (IP address, user agent, request body)
- Delegates all business logic to `AuthService`
- Returns formatted HTTP responses

**What it does NOT do:**
- ❌ Database queries
- ❌ Token generation
- ❌ Email sending
- ❌ Business logic validation

**Code size:** ~110 lines (down from 244 lines!)

**Endpoints:**
```typescript
POST   /auth/request-magic-link  → authService.requestMagicLink()
GET    /auth/verify              → authService.verifyMagicLink()
POST   /auth/refresh             → authService.refreshAccessToken()
GET    /auth/me                  → authService.getCurrentUser()
```

---

### AuthService (Business Logic Layer)
**File:** `src/services/auth/authService.ts`

**What it does:**
- Core authentication business logic
- User registration (find or create)
- Magic link generation and verification
- User activation (pending → active)
- Login tracking
- Token generation (access + refresh)
- Data sanitization (remove sensitive fields)
- Can be reused in middleware, cron jobs, other controllers

**What it does NOT do:**
- ❌ HTTP handling (no Request/Response objects)
- ❌ Direct email/JWT/magic link operations (delegates to specialized services)

**Public Methods:**
```typescript
// Login/Signup Flow
requestMagicLink(email, ip, userAgent)
  → {message: string, isNewUser: boolean}

verifyMagicLink(token, ip)
  → {accessToken, refreshToken, user, subscription}

// Token Management
refreshAccessToken(refreshToken)
  → {accessToken, refreshToken}

validateAccessToken(accessToken)
  → User

// User Data
getCurrentUser(userId)
  → {user, subscription}
```

**Private Helper Methods:**
```typescript
createNewUser()          // Create user + free subscription
activateUser()           // pending → active
generateAndSendMagicLink()  // Generate token + send email
getOrCreateSubscription()   // Ensure subscription exists
generateTokens()         // Create JWT tokens
sanitizeUserData()       // Remove sensitive fields
sanitizeSubscriptionData()  // Remove sensitive fields
```

---

## 🔄 Request Flow Examples

### Example 1: Request Magic Link

```
User submits email
       │
       ▼
┌──────────────────────────────────────┐
│ AuthController.requestMagicLink()   │
│ - Extract: email, IP, user agent    │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ AuthService.requestMagicLink()      │
│ ├─ Validate email                   │
│ ├─ Find or create user              │
│ ├─ Call generateAndSendMagicLink()  │
│ └─ Return message                   │
└──────────┬───────────────────────────┘
           │
           ├─────────────────────────────┐
           │                             │
           ▼                             ▼
┌────────────────────────┐  ┌─────────────────────────┐
│ MagicLinkService       │  │ EmailService            │
│ - Generate token       │  │ - Send magic link email │
│ - Store in DB          │  │   via Resend API        │
└────────────────────────┘  └─────────────────────────┘
```

### Example 2: Verify Magic Link

```
User clicks magic link
       │
       ▼
┌──────────────────────────────────────┐
│ AuthController.verifyMagicLink()    │
│ - Extract: token, IP                │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ AuthService.verifyMagicLink()       │
│ ├─ Verify token (via service)       │
│ ├─ Mark token as used               │
│ ├─ Get user + subscription          │
│ ├─ Activate user if pending         │
│ ├─ Track login                      │
│ ├─ Generate JWT tokens              │
│ └─ Return user data + tokens        │
└──────────┬───────────────────────────┘
           │
           ├────────────────┬──────────────┬─────────────┐
           │                │              │             │
           ▼                ▼              ▼             ▼
┌──────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────────┐
│ MagicLink    │  │ User        │  │ Sub.     │  │ JWT          │
│ Service      │  │ Repository  │  │ Repo.    │  │ Service      │
└──────────────┘  └─────────────┘  └──────────┘  └──────────────┘
```

---

## ✅ Benefits of This Architecture

### 1. **Separation of Concerns**
- Controllers handle HTTP only
- Services contain business logic
- Repositories handle data access
- Each layer has a single responsibility

### 2. **Reusability**
```typescript
// ✅ AuthService can be used anywhere:

// In a controller
const result = await authService.verifyMagicLink(token);

// In middleware
const user = await authService.validateAccessToken(token);

// In a cron job
const user = await authService.getCurrentUser(userId);

// In another service
const tokens = await authService.refreshAccessToken(refreshToken);
```

### 3. **Testability**
```typescript
// Easy to unit test without HTTP context
describe('AuthService', () => {
  it('should create new user on first magic link request', async () => {
    const result = await authService.requestMagicLink('new@user.com');
    expect(result.isNewUser).toBe(true);
  });

  it('should activate pending user on first login', async () => {
    // Mock magic link token
    const response = await authService.verifyMagicLink(token);
    expect(response.user.userState).toBe('active');
  });
});
```

### 4. **Maintainability**
- Changes to business logic only affect `AuthService`
- HTTP layer changes only affect `AuthController`
- Infrastructure changes only affect individual services
- Easy to understand where each piece of logic lives

### 5. **Scalability**
```typescript
// Easy to add new features:

// Add 2FA
authService.enableTwoFactor(userId)
authService.verifyTwoFactorCode(userId, code)

// Add OAuth
authService.loginWithGoogle(googleToken)
authService.loginWithGithub(githubToken)

// Add admin actions
authService.suspendUser(userId, reason)
authService.deleteUser(userId)
```

---

## 🔧 Dependency Injection

LoopBack automatically injects dependencies:

```typescript
@injectable({scope: BindingScope.TRANSIENT})
export class AuthService {
  constructor(
    @repository(UserRepository)
    public userRepository: UserRepository,
    @repository(SubscriptionRepository)
    public subscriptionRepository: SubscriptionRepository,
    private jwtService: JWTService,
    private magicLinkService: MagicLinkService,
    private emailService: EmailService,
  ) {}
}
```

**Registered in `application.ts`:**
```typescript
this.bind('services.AuthService').toClass(AuthService);
```

**Injected into controller:**
```typescript
export class AuthController {
  constructor(
    @inject('services.AuthService')
    public authService: AuthService,
  ) {}
}
```

---

## 📊 Code Metrics Comparison

### Before Refactoring
```
authController.ts: 244 lines
├─ HTTP handling: ~30 lines
├─ Business logic: ~180 lines
└─ Database queries: ~34 lines

Issues:
❌ Controller tightly coupled to repositories
❌ Business logic not reusable
❌ Hard to test without HTTP mocks
❌ Mixed concerns
```

### After Refactoring
```
authController.ts: 112 lines (54% reduction)
├─ HTTP handling: ~90 lines
└─ Business logic delegation: ~22 lines

authService.ts: 305 lines (NEW)
├─ Public methods: ~150 lines
├─ Private helpers: ~130 lines
└─ Type definitions: ~25 lines

Benefits:
✅ Clean separation of concerns
✅ Business logic fully reusable
✅ Easy to unit test
✅ Can be used in middleware, cron jobs, other controllers
✅ Single source of truth for auth logic
```

---

## 🚀 Usage Examples

### In Controller (Current Usage)

```typescript
// authController.ts
@post('/auth/request-magic-link')
async requestMagicLink(@requestBody() body: {email: string}) {
  const ipAddress = this.request.ip;
  const userAgent = this.request.get('user-agent');

  const result = await this.authService.requestMagicLink(
    body.email,
    ipAddress,
    userAgent,
  );

  return {message: result.message};
}
```

### In Middleware (Future Usage)

```typescript
// jwtAuthMiddleware.ts
export class JwtAuthMiddleware {
  constructor(
    @inject('services.AuthService')
    private authService: AuthService,
  ) {}

  async authenticate(request: Request) {
    const token = this.extractToken(request);
    const user = await this.authService.validateAccessToken(token);
    return user;
  }
}
```

### In Cron Job (Future Usage)

```typescript
// cleanupCronService.ts
export class CleanupCronService {
  constructor(
    @inject('services.AuthService')
    private authService: AuthService,
  ) {}

  async cleanupInactiveUsers() {
    // Reuse auth service methods
    const inactiveUsers = await this.findInactiveUsers();
    for (const user of inactiveUsers) {
      await this.authService.suspendUser(user.id, 'Inactivity');
    }
  }
}
```

---

## 🎓 Key Takeaways

1. **Controllers are thin** - Only handle HTTP concerns
2. **Services contain business logic** - Reusable, testable, maintainable
3. **Repositories handle data** - Abstraction over database
4. **Specialized services** (JWT, Email, MagicLink) - Single-purpose utilities
5. **Dependency injection** - Automatic, type-safe, testable

---

## 📝 Next Steps

### Immediate
- ✅ AuthService created and integrated
- ✅ AuthController refactored to be thin
- ✅ All services properly registered
- ✅ Build passes

### Future Enhancements
1. **Add Authentication Middleware** - Use `authService.validateAccessToken()`
2. **Add Authorization Middleware** - Check subscription tiers
3. **Add Admin Service** - User management operations
4. **Add 2FA Support** - Extend `authService` with 2FA methods
5. **Add OAuth Providers** - Google, GitHub, etc.

---

## 🎉 Result

You now have a **clean, maintainable, and reusable** authentication system with proper separation of concerns!

- **Controller:** HTTP handling only (thin layer)
- **Service:** Business logic (thick layer, reusable)
- **Infrastructure:** Specialized services and data access
