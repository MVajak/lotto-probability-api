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

## Production Deployment (Railway) ⭐

Railway provides the simplest deployment experience with everything managed in one dashboard.

### Quick Deploy (5 Minutes)

**Cost: ~$15/month** (PostgreSQL ~$5 + API ~$5 + Worker ~$5)

### Step 1: Create New Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `lotto-probability-api` repository
5. Railway will create a project

### Step 2: Add PostgreSQL Database

1. In your project, click "+ New"
2. Select "Database" → "Add PostgreSQL"
3. Railway automatically provisions the database
4. The `DATABASE_URL` is automatically available to all services in your project

### Step 3: Add API Service

1. Click "+ New" → "GitHub Repo"
2. Select your repository (same one)
3. Configure the service:
   - **Service Name**: `api`
   - **Start Command**: `pnpm start:api`
   - **Build Command**: (leave empty - Railway auto-detects)
4. Railway will automatically build and deploy

### Step 4: Add Worker Service

1. Click "+ New" → "GitHub Repo"
2. Select your repository again (yes, same repo!)
3. Configure the service:
   - **Service Name**: `worker`
   - **Start Command**: `pnpm start:worker`
   - **Build Command**: (leave empty - Railway auto-detects)
4. Railway will automatically build and deploy

### Step 5: Set Environment Variables

Click on the **API service** and add variables:

**Required:**
```
JWT_SECRET=your-secure-random-jwt-secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Optional:**
```
RESEND_API_KEY=re_...
OPEN_API_SPEC_HOST=your-api-domain.railway.app
PORT=3000
HOST=0.0.0.0
```

Click on the **Worker service** and add the same variables (Railway shares `DATABASE_URL` automatically).

**Optional - Configure Cron Jobs:**
```
POWERBALL_CRON_INTERVAL=0 7 * * 0,2,4
MEGA_MILLIONS_CRON_INTERVAL=0 7 * * 3,6
CASH4LIFE_CRON_INTERVAL=0 5 * * *
```
Set any you don't need to `off`.

### Step 6: Run Database Migrations

After the API service deploys:

1. Click on the **API service**
2. Go to "Settings" tab
3. Scroll to "Deploy"
4. Add **Custom Start Command**: `pnpm migrate && pnpm start:api`
5. Redeploy the service

Or run migrations manually once via the Railway CLI:
```sh
railway login
railway link
railway run pnpm migrate
```

### Step 7: Verify Deployment

1. Click on the **API service**
2. Go to "Settings" → "Networking"
3. Click "Generate Domain" to get a public URL
4. Visit `https://your-api.railway.app/ping` to verify it's running
5. Visit `https://your-api.railway.app/explorer` to see the API docs

### Features You Get

✅ **Auto-deploy on git push** - Push to main and Railway deploys automatically
✅ **Unified dashboard** - All services, logs, and metrics in one place
✅ **Automatic HTTPS** - SSL certificates included
✅ **Easy rollbacks** - One-click rollback to previous deployments
✅ **Environment branching** - Create staging environments easily
✅ **Logs & monitoring** - Built-in logging and performance metrics

### Updating Your App

Just push to your GitHub repository:
```sh
git push origin main
```

Railway automatically:
1. Detects the push
2. Builds your services
3. Runs tests (if configured)
4. Deploys the new version
5. Zero-downtime deployment

### Useful Railway Commands

View logs:
```sh
railway logs
```

Run commands:
```sh
railway run pnpm migrate
railway run pnpm migrate:create new-migration
```

Open dashboard:
```sh
railway open
```

### Cost Breakdown

- **PostgreSQL**: ~$5/month (500MB storage, shared CPU)
- **API Service**: ~$5/month (512MB RAM, shared CPU)
- **Worker Service**: ~$5/month (512MB RAM, shared CPU)
- **Total**: ~$15/month

**Includes:**
- Automatic deploys
- HTTPS/SSL
- Logging & monitoring
- 100GB bandwidth
- Unlimited deployments

### Custom Domain (Optional)

1. Click on API service → "Settings" → "Networking"
2. Add your custom domain
3. Update your DNS records as shown
4. Railway handles SSL automatically

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
└── .env.example      # Example environment variables
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
