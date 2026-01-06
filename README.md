# Lotto Probability API

A lottery probability analysis API providing statistical analysis for various lottery games worldwide. Features include timeline analysis, trends, Wilson confidence intervals, standard deviation, Markov chains, autocorrelation, pair analysis, Monte Carlo simulations, and seasonal patterns.

## Features

- **Multi-tier Subscriptions**: FREE, PRO ($2.49), and PREMIUM ($3.99) tiers with increasing feature sets
- **JWT Authentication**: Email-based OTP verification
- **Stripe Integration**: Subscription management and payment processing
- **Background Worker**: Cron jobs for automated lottery data fetching
- **Statistical Analysis**: Advanced probability calculations and pattern recognition
- **Multi-region Support**: Estonian, US, and UK lottery games

## Tech Stack

- **Framework**: LoopBack 4 (Node.js/TypeScript)
- **Database**: PostgreSQL 15
- **Package Manager**: pnpm (monorepo workspace)
- **Payments**: Stripe
- **Email**: Resend API

## Prerequisites

- Node.js >= 20.0.0
- pnpm >= 10.0.0
- PostgreSQL 15+
- Stripe account (for subscription features)

## Local Development Setup

### 1. Install dependencies

```sh
pnpm install
```

### 2. Set up environment variables

Copy the example environment file and update with your values:

```sh
cp .env.example .env
```

Required environment variables:
- `JWT_SECRET`: Generate a secure random string
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
- `DATABASE_URL`: PostgreSQL connection string (auto-configured if using Docker Compose)

### 3. Start the database

```sh
docker-compose up -d postgres
```

### 4. Run migrations

```sh
pnpm migrate
```

### 5. Build packages

```sh
pnpm build
```

### 6. Start the development servers

```sh
pnpm dev
```

This starts both the API server and the background worker.

- **API**: http://127.0.0.1:3000
- **API Explorer**: http://127.0.0.1:3000/explorer

### Individual Services

Run API only:
```sh
pnpm dev:api
```

Run worker only:
```sh
pnpm dev:worker
```

## Production Deployment (Fly.io) - Recommended ⭐

Fly.io offers the best value with a generous free tier that can host your entire stack at no cost!

### Prerequisites

1. **Install Fly CLI**:
   ```sh
   # macOS/Linux
   curl -L https://fly.io/install.sh | sh

   # Windows
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Sign up and authenticate**:
   ```sh
   fly auth signup  # or: fly auth login
   ```

### Step 1: Create PostgreSQL Database

```sh
fly postgres create --name lotto-probability-db --region fra --initial-cluster-size 1 --vm-size shared-cpu-1x --volume-size 1
```

Save the connection details shown (you'll need them for environment variables).

### Step 2: Deploy API Service

```sh
# From project root
fly launch --config fly.api.toml --no-deploy

# Set secrets
fly secrets set \
  DATABASE_URL="postgres://user:password@host:5432/dbname" \
  JWT_SECRET="your-secret-jwt-key" \
  STRIPE_SECRET_KEY="sk_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  RESEND_API_KEY="re_..." \
  -a lotto-probability-api

# Deploy
fly deploy --config fly.api.toml
```

### Step 3: Deploy Worker Service

```sh
# From project root
fly launch --config fly.worker.toml --no-deploy

# Set secrets (same DATABASE_URL as API)
fly secrets set \
  DATABASE_URL="postgres://user:password@host:5432/dbname" \
  -a lotto-probability-worker

# Optional: Configure cron intervals
fly secrets set \
  POWERBALL_CRON_INTERVAL="0 7 * * 0,2,4" \
  MEGA_MILLIONS_CRON_INTERVAL="0 7 * * 3,6" \
  -a lotto-probability-worker

# Deploy
fly deploy --config fly.worker.toml
```

### Step 4: Verify Deployment

```sh
# Check API status
fly status -a lotto-probability-api

# View API logs
fly logs -a lotto-probability-api

# Check worker status
fly status -a lotto-probability-worker

# Open API in browser
fly open -a lotto-probability-api
```

### Environment Variables Reference

Set these secrets for both services:

**Required:**
- `DATABASE_URL` - PostgreSQL connection string (from Step 1)
- `JWT_SECRET` - Secure random string for JWT signing
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

**Optional:**
- `RESEND_API_KEY` - For email sending (will log to console if not set)
- `OPEN_API_SPEC_HOST` - Your custom domain (if using one)
- Cron intervals for lottery data fetching (see fly.worker.toml)

### Costs

**Free Tier Includes:**
- 3 shared-cpu VMs with 256MB RAM
- 3GB persistent storage
- 160GB outbound transfer
- **Estimated cost: $0/month** (if within limits) or ~$5-10/month

### Updating Your App

```sh
# Update API
fly deploy --config fly.api.toml

# Update Worker
fly deploy --config fly.worker.toml
```

### Useful Commands

```sh
# View logs in real-time
fly logs -a lotto-probability-api -f

# SSH into container
fly ssh console -a lotto-probability-api

# Scale up/down
fly scale count 2 -a lotto-probability-api
fly scale memory 512 -a lotto-probability-api

# Check costs
fly dashboard -a lotto-probability-api
```

---

## Alternative: Production Deployment (Render)

### Quick Deploy

1. **Push to GitHub**: Ensure your code is in a GitHub repository

2. **Deploy to Render**:
   - Go to [render.com](https://render.com)
   - Click "New +" → "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and create all services

3. **Set environment variables** in Render dashboard:
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret
   - `RESEND_API_KEY`: Your Resend API key (optional)
   - Configure cron intervals for lottery data fetching (optional)

### Manual Render Setup

If not using Blueprint, create these services manually:

1. **PostgreSQL Database**
   - Name: `lotto-probability-db`
   - Plan: Starter or higher
   - Region: Frankfurt (or your preference)

2. **Web Service (API)**
   - Name: `lotto-probability-api`
   - Environment: Node
   - Build Command: `pnpm install && pnpm build && pnpm migrate`
   - Start Command: `pnpm start:api`
   - Health Check Path: `/ping`
   - Connect to database and set environment variables

3. **Background Worker**
   - Name: `lotto-probability-worker`
   - Environment: Node
   - Build Command: `pnpm install && pnpm build`
   - Start Command: `pnpm start:worker`
   - Connect to same database

## Database Migrations

Create a new migration:
```sh
pnpm migrate:create migration-name
```

Run migrations:
```sh
pnpm migrate
```

Rollback last migration:
```sh
pnpm migrate:down
```

## Code Quality

Format code:
```sh
pnpm format
```

Lint and auto-fix:
```sh
pnpm lint:fix
```

Run tests:
```sh
pnpm test
```

## Project Structure

```
lotto-probability-api/
├── apps/
│   ├── api/          # Main REST API server
│   └── worker/       # Background worker for cron jobs
├── packages/
│   ├── core/         # Business logic, services
│   ├── database/     # Database models, repositories
│   └── shared/       # Shared utilities and config
├── migrations/       # PostgreSQL migrations
├── .env.example      # Example environment variables
└── render.yaml       # Render deployment configuration
```

## Subscription Tiers

- **FREE**: Basic access
- **PRO ($2.49/mo)**: Timeline, trends, Wilson CI, standard deviation
- **PREMIUM ($3.99/mo)**: All PRO features + Markov chains, autocorrelation, pair analysis, Monte Carlo, seasonal patterns

## Supported Lotteries

### Estonian
EuroJackpot, Viking Lotto, Bingo Lotto, Jokker, Keno

### United States
Powerball, Mega Millions, Cash4Life

### United Kingdom
EuroMillions, Lotto, Thunderball, Set For Life

## Cron Job Configuration

Configure lottery data fetching intervals via environment variables. Examples:

```env
POWERBALL_CRON_INTERVAL='0 7 * * 0,2,4'  # Sun,Tue,Thu at 7AM UTC
MEGA_MILLIONS_CRON_INTERVAL='0 7 * * 3,6'  # Wed,Sat at 7AM UTC
CASH4LIFE_CRON_INTERVAL='0 5 * * *'  # Daily at 5AM UTC
```

Set to `off` to disable specific cron jobs.

## API Documentation

Once running, visit the API Explorer at `/explorer` to see all available endpoints and try them out interactively.

## License

UNLICENSED

## Author

Mihkel Vajak
