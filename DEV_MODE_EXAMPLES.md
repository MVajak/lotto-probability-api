# 🛠️ Development Mode Examples

## Magic Link Email Logging

When `RESEND_API_KEY` is not set in `.env`, the application runs in **development mode** and logs magic links to the console instead of sending emails.

---

## 📧 Console Output Example

When you request a magic link in development mode, you'll see:

```
╔═══════════════════════════════════════════════════════════════════╗
║  📧  [DEV MODE] Magic Link Email                                 ║
╠═══════════════════════════════════════════════════════════════════╣
║  To: user@example.com                                            ║
╠═══════════════════════════════════════════════════════════════════╣
║  🔗 VERIFY LINK (click or copy to test):                         ║
║                                                                   ║
║  http://localhost:3000/auth/verify?token=a1b2c3d4e5f6...         ║
║                                                                   ║
║  ⏱  Link expires in 15 minutes                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 🧪 Testing Flow

### Step 1: Request Magic Link

```bash
curl -X POST http://localhost:3000/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Response:**
```json
{
  "message": "Magic link sent to your email. Please check your inbox."
}
```

**Console Output:**
```
✨ New user created: test@example.com

╔═══════════════════════════════════════════════════════════════════╗
║  📧  [DEV MODE] Magic Link Email                                 ║
╠═══════════════════════════════════════════════════════════════════╣
║  To: test@example.com                                            ║
╠═══════════════════════════════════════════════════════════════════╣
║  🔗 VERIFY LINK (click or copy to test):                         ║
║                                                                   ║
║  http://localhost:3000/auth/verify?token=abc123def456...         ║
║                                                                   ║
║  ⏱  Link expires in 15 minutes                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Step 2: Copy and Use the Link

**Option A: Click the link** (if your terminal supports clickable links)

**Option B: Copy-paste the URL:**
```bash
# Copy the verify link from console
curl "http://localhost:3000/auth/verify?token=abc123def456..."
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "test@example.com",
    "firstName": null,
    "lastName": null,
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

**Console Output:**
```
✅ User activated: test@example.com
🔐 User logged in: test@example.com (free)
```

### Step 3: Use Access Token

```bash
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 🎨 Benefits of Enhanced Logging

### ✅ Visual Clarity
- **Box design** makes the link stand out in console output
- Easy to spot among other logs
- Professional appearance

### ✅ Easy to Copy
- Link is on its own line
- Clear spacing around it
- No surrounding quotes or punctuation

### ✅ Important Information Highlighted
- Email recipient clearly shown
- Expiration time reminder
- Dev mode indicator

### ✅ Terminal Link Support
Many modern terminals (VS Code, iTerm2, Hyper, Windows Terminal) make URLs clickable:
- **macOS**: Cmd + Click
- **Windows/Linux**: Ctrl + Click

---

## 🔄 Existing User Login

When an existing user requests a magic link:

```bash
curl -X POST http://localhost:3000/auth/request-magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Console Output:**
```
👤 Existing user login request: test@example.com

╔═══════════════════════════════════════════════════════════════════╗
║  📧  [DEV MODE] Magic Link Email                                 ║
╠═══════════════════════════════════════════════════════════════════╣
║  To: test@example.com                                            ║
╠═══════════════════════════════════════════════════════════════════╣
║  🔗 VERIFY LINK (click or copy to test):                         ║
║                                                                   ║
║  http://localhost:3000/auth/verify?token=xyz789abc123...         ║
║                                                                   ║
║  ⏱  Link expires in 15 minutes                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 🚀 Switching to Production Mode

When you're ready to send real emails:

### Step 1: Get Resend API Key

1. Go to https://resend.com
2. Sign up for free account (100 emails/day)
3. Create API key
4. Verify your sending domain

### Step 2: Update Environment

Add to `.env`:
```env
RESEND_API_KEY=re_your_actual_api_key_here
```

### Step 3: Restart Application

```bash
npm run dev
```

**Console Output (on startup):**
```
✅ RESEND_API_KEY configured - emails will be sent via Resend API
```

Now emails will be sent via Resend instead of logged to console!

---

## 🔧 Advanced: Custom Base URL

By default, magic links use `http://localhost:3000`. To test with a different URL:

Update `.env`:
```env
APP_BASE_URL=https://your-domain.com
```

Or for ngrok/tunneling:
```env
APP_BASE_URL=https://abc123.ngrok.io
```

**Console Output:**
```
╔═══════════════════════════════════════════════════════════════════╗
║  📧  [DEV MODE] Magic Link Email                                 ║
╠═══════════════════════════════════════════════════════════════════╣
║  To: test@example.com                                            ║
╠═══════════════════════════════════════════════════════════════════╣
║  🔗 VERIFY LINK (click or copy to test):                         ║
║                                                                   ║
║  https://abc123.ngrok.io/auth/verify?token=xyz789...             ║
║                                                                   ║
║  ⏱  Link expires in 15 minutes                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 📋 Quick Reference

### Check Current Mode

**Look for this on startup:**
```
⚠️  WARNING: RESEND_API_KEY not set. Email sending will be simulated (logged to console).
Add RESEND_API_KEY to .env for production.
```

### Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `RESEND_API_KEY` | Resend API key for sending emails | Empty (dev mode) |
| `APP_BASE_URL` | Base URL for magic links | `http://localhost:3000` |
| `JWT_SECRET` | Secret for signing JWT tokens | Auto-generated in dev |

### Common Scenarios

| Scenario | What Happens |
|----------|--------------|
| `RESEND_API_KEY` not set | 📧 Logs to console (dev mode) |
| `RESEND_API_KEY` set | ✉️ Sends real emails via Resend |
| Link clicked within 15 min | ✅ User logged in, JWT returned |
| Link clicked after 15 min | ❌ "Invalid or expired token" error |
| Same link used twice | ❌ "Invalid or expired token" error (one-time use) |

---

## 💡 Tips for Development

### Tip 1: Keep Console Visible
Run your app with `npm run dev` and keep the terminal visible to easily copy magic links.

### Tip 2: Test with Multiple Emails
```bash
# User 1
curl -X POST http://localhost:3000/auth/request-magic-link \
  -d '{"email": "user1@test.com"}'

# User 2
curl -X POST http://localhost:3000/auth/request-magic-link \
  -d '{"email": "user2@test.com"}'
```

Each request generates a unique token!

### Tip 3: Test Token Expiration
Magic link tokens expire in 15 minutes. To test this:
1. Request a magic link
2. Wait 16 minutes
3. Try to use the link
4. Verify you get "Invalid or expired token" error

### Tip 4: Test One-Time Use
1. Request a magic link
2. Use it successfully (get JWT tokens)
3. Try to use the same link again
4. Verify you get "Invalid or expired token" error

---

## 🎉 Summary

**Development mode makes testing authentication easy:**
- ✅ No email service required
- ✅ Magic links logged to console
- ✅ Easy to copy and test
- ✅ Visual, clear formatting
- ✅ Quick iteration and testing

**When ready for production:**
- Add `RESEND_API_KEY` to `.env`
- Restart application
- Real emails sent automatically!

Happy developing! 🚀
