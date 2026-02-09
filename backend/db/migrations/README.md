# Database Migrations

This directory contains database migration scripts for the AdStack subscription system.

## Migration Files

### 001_create_subscription_system.sql
- **Purpose**: Initial database schema creation
- **Tables Created**:
  - subscriptions
  - subscription_plans
  - usage
  - usage_events
  - invoices
  - payments
  - payment_methods
  - subscription_benefits
  - usage_alerts
  - renewal_reminders
  - proration_records
  - cache
  - audit_log
- **Indexes**: Created on all foreign keys and frequently queried columns
- **Triggers**: Auto-update `updated_at` columns on record changes

### 002_seed_subscription_plans.sql
- **Purpose**: Seed default subscription plans
- **Plans Created**:
  - Free (monthly)
  - Basic (monthly & yearly)
  - Pro (monthly & yearly)
  - Enterprise (monthly & yearly)

## Running Migrations

### Using psql
```bash
# Run all migrations in order
psql -U username -d adstack_db -f backend/db/migrations/001_create_subscription_system.sql
psql -U username -d adstack_db -f backend/db/migrations/002_seed_subscription_plans.sql
```

### Using Node.js migration tool
```bash
npm run migrate
```

### Using Docker
```bash
docker exec -i adstack_postgres psql -U adstack -d adstack_db < backend/db/migrations/001_create_subscription_system.sql
docker exec -i adstack_postgres psql -U adstack -d adstack_db < backend/db/migrations/002_seed_subscription_plans.sql
```

## Migration Naming Convention

Migrations follow the pattern: `XXX_description.sql`

Where:
- `XXX` is a zero-padded sequential number (001, 002, 003, etc.)
- `description` is a snake_case description of what the migration does

## Creating New Migrations

1. Create a new file with the next sequential number
2. Wrap the migration in a transaction (BEGIN/COMMIT)
3. Add a comment header with:
   - Migration number and name
   - Description
   - Created date
   - Author
4. Test the migration on a development database first
5. Document any breaking changes in this README

## Rollback

To rollback a migration, create a new migration that reverses the changes. Do not modify existing migration files.

Example:
```sql
-- Migration: 003_rollback_feature_xyz.sql
BEGIN;
-- Reverse changes from migration 002
DROP TABLE IF EXISTS xyz;
COMMIT;
```

## Database Schema Diagram

```
subscriptions (main table)
├── subscription_plans (FK: plan_id)
├── usage (FK: subscription_id)
│   └── usage_events (FK: subscription_id)
├── invoices (FK: subscription_id)
│   └── payments (FK: invoice_id, subscription_id)
├── subscription_benefits (FK: subscription_id)
├── usage_alerts (FK: subscription_id)
├── renewal_reminders (FK: subscription_id)
└── proration_records (FK: subscription_id)

payment_methods (user payment methods)

cache (application cache)

audit_log (audit trail)
```

## Environment Setup

### Required Environment Variables

```env
DATABASE_URL=postgresql://username:password@localhost:5432/adstack_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
```

### PostgreSQL Version

- Minimum: PostgreSQL 12
- Recommended: PostgreSQL 14+

### Required Extensions

- uuid-ossp (for UUID generation)

## Backup Before Migration

Always backup your database before running migrations:

```bash
pg_dump -U username adstack_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Troubleshooting

### Migration fails with "relation already exists"
This usually means the migration was partially run. Check the database state and either:
1. Drop the partially created tables/indexes
2. Modify the migration to use `IF NOT EXISTS` clauses

### Permission errors
Ensure the database user has CREATE, ALTER, and INSERT permissions:
```sql
GRANT CREATE ON DATABASE adstack_db TO username;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO username;
```

### Transaction errors
If a migration fails partway through, the transaction will be rolled back automatically. Check the error message and fix the issue before re-running.
