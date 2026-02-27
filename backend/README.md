# AdStack Backend API

REST API and service layer for the AdStack decentralized advertising platform.

## Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Cache**: Redis (ioredis)
- **Blockchain**: Stacks (via @stacks/transactions)
- **Payments**: Stripe
- **Email**: Nodemailer / SendGrid
- **Auth**: JWT with wallet-based authentication
- **Scheduler**: node-cron for background jobs

## Getting Started

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6

### Setup

```bash
cd backend
cp .env.example .env    # Edit with your config
npm install
npm run migrate         # Run database migrations
npm run dev             # Start dev server with hot reload
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with auto-reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run migrate` | Run pending database migrations |
| `npm run migrate:status` | Show migration status |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Type-check without emitting |

## API Endpoints

### Authentication
- `POST /api/auth/wallet` - Authenticate with Stacks wallet
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/verify-token` - Verify JWT token

### Campaigns
- `GET /api/campaigns` - List campaigns (filtered, paginated)
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/:id` - Get campaign by ID
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `PUT /api/campaigns/:id/status` - Update campaign status
- `GET /api/campaigns/:id/stats` - Get campaign statistics

### Subscriptions
- `GET /api/subscriptions/plans` - List subscription plans
- `GET /api/subscriptions/:userId` - Get user subscription
- `POST /api/subscriptions` - Create subscription
- `POST /api/subscriptions/:id/cancel` - Cancel subscription
- `POST /api/subscriptions/:id/change-plan` - Change plan
- `GET /api/subscriptions/:id/usage` - Get usage metrics
- `POST /api/subscriptions/:id/usage` - Track usage event
- `GET /api/subscriptions/:id/invoices` - Get invoices

### Analytics
- `GET /api/analytics/summary` - Analytics summary
- `GET /api/analytics/timeseries` - Time series data
- `GET /api/analytics/top-campaigns` - Top performing campaigns
- `GET /api/analytics/usage` - Usage breakdown

### Payments
- `GET /api/payments/methods` - List payment methods
- `POST /api/payments/methods` - Add payment method
- `DELETE /api/payments/methods/:id` - Remove payment method
- `PUT /api/payments/methods/:id/default` - Set default method
- `GET /api/payments/history` - Payment history
- `POST /api/payments/:id/retry` - Retry failed payment
- `GET /api/payments/invoices` - List invoices
- `GET /api/payments/invoices/:id` - Get invoice

### Users (Admin)
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id/tier` - Update user tier
- `PUT /api/users/:id/admin` - Set admin status
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/audit-log` - View audit log

### Webhooks
- `POST /api/webhooks/stripe` - Stripe webhook receiver
- `POST /api/webhooks/stacks` - Stacks webhook receiver
- `GET /api/webhooks` - List registered webhooks
- `POST /api/webhooks/register` - Register webhook endpoint
- `DELETE /api/webhooks/:id` - Delete webhook

### Health
- `GET /api/health` - Basic health check
- `GET /api/health/ready` - Readiness check (DB + Redis)
- `GET /api/health/live` - Liveness check
- `GET /api/health/info` - Environment info

## Database

Migrations are in `db/migrations/` and run sequentially by filename.

```bash
npm run migrate         # Apply pending migrations
npm run migrate:status  # Check migration status
```

Schema is defined in `db/schema.sql` with the full reference schema.

## Project Structure

```
backend/
  api/            # Express route handlers
  config/         # Configuration management
  db/             # Schema and migrations
  lib/            # Core libraries (database, cache, email, etc.)
  middleware/     # Express middleware (auth, rate limit, validation)
  services/       # Business logic layer
  templates/      # Email HTML templates
  types/          # TypeScript type definitions
  app.ts          # Express app setup
  server.ts       # Server entry point
  migrate.ts      # Migration CLI
```

## Environment Variables

See `.env.example` for all available configuration options.

Required in production:
- `DATABASE_URL`
- `JWT_SECRET`
- `EMAIL_API_KEY`
- `STRIPE_SECRET_KEY`
