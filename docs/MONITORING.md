# Production Monitoring & DevOps Infrastructure

This document covers the monitoring, observability, and DevOps infrastructure for AdStack.

## Architecture Overview

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (Reverse   │
                    │   Proxy)    │
                    └──────┬──────┘
                           │
        ┌──────────┬───────┼───────┬──────────┐
        │          │       │       │          │
   ┌────▼───┐ ┌───▼────┐ ┌▼─────┐ ┌▼────────┐ ┌▼──────┐
   │Frontend│ │Backend │ │WS    │ │Bridge   │ │ML     │
   │Next.js │ │Express │ │Server│ │Relayer  │ │Service│
   └────────┘ └───┬────┘ └──────┘ └─────────┘ └───────┘
                   │
        ┌──────────┼──────────┐
        │          │          │
   ┌────▼───┐ ┌───▼────┐ ┌───▼────┐
   │Postgres│ │ Redis  │ │Stacks  │
   │   DB   │ │ Cache  │ │  API   │
   └────────┘ └────────┘ └────────┘

   Observability Layer:
   ┌──────────┐ ┌──────┐ ┌──────────┐ ┌────────┐
   │Prometheus│ │ Loki │ │ Grafana  │ │ Sentry │
   └──────────┘ └──────┘ └──────────┘ └────────┘
```

## Components

### Metrics (Prometheus)
- **Config**: `monitoring/prometheus/prometheus.yml`
- **Alert rules**: `monitoring/prometheus/rules/alerts.yml`
- **Custom metrics exporter**: `monitoring/prometheus/metrics.ts`
- **Scrape targets**: backend, websocket, ml-service, postgres-exporter, redis-exporter, nginx-exporter, node-exporter, cadvisor

Custom application metrics:
- `http_requests_total` - Total HTTP requests by method, route, status
- `http_request_duration_seconds` - Request latency histogram
- `db_query_duration_seconds` - Database query latency
- `db_connection_pool` - Connection pool gauge (active, idle, waiting)
- `cache_hits_total` / `cache_misses_total` - Redis cache effectiveness
- `subscriptions_active` - Active subscriptions by tier
- `payments_total` - Payment transactions by status and method
- `campaigns_active` - Active advertising campaigns
- `blockchain_tx_total` - Blockchain transactions by type and status

### Logging (Loki + Promtail)
- **Logger**: `monitoring/logging/logger.ts`
- **Loki config**: `monitoring/logging/loki-config.yml`
- **Promtail config**: `monitoring/logging/promtail-config.yml`
- **Docker Compose**: `monitoring/logging/docker-compose.yml`

Features:
- Structured JSON logging with Winston
- PII masking (email, card numbers, SSN, passwords, tokens, mnemonics)
- Request ID correlation across services
- 30-day log retention in Loki

### Dashboards (Grafana)
- **Datasources**: `monitoring/grafana/provisioning/datasources/datasources.yml`
- **Dashboard config**: `monitoring/grafana/provisioning/dashboards/dashboards.yml`
- **System Overview**: `monitoring/grafana/dashboards/system-overview.json`
- **Infrastructure**: `monitoring/grafana/dashboards/infrastructure.json`

Provisioned datasources: Prometheus, Loki, PostgreSQL, Redis

### Error Tracking (Sentry)
- **Backend**: `monitoring/sentry/backend.ts`
- **Frontend instrumentation**: `monitoring/sentry/frontend-instrumentation.ts`
- **Frontend client**: `monitoring/sentry/frontend-client.ts`
- **Error boundary**: `monitoring/sentry/global-error.tsx`

### Alerting
- **Alertmanager config**: `monitoring/alerting/alertmanager.yml`
- **Alert manager**: `monitoring/alerting/manager.ts`
- Slack and PagerDuty integration
- Severity-based routing (critical, warning, info)

### Health Checks
- **Health endpoints**: `monitoring/health/checks.ts`
- **Uptime monitor**: `monitoring/health/uptime.ts`
- Dependency checks: PostgreSQL, Redis, Stacks API
- `/health`, `/ready`, `/live` endpoints

### Blockchain Monitoring
- **Monitor**: `monitoring/blockchain/monitor.ts`
- Block height tracking and drift detection
- Contract event processing
- Pending transaction monitoring

### Audit Logging
- **Audit logger**: `monitoring/audit/audit-logger.ts`
- **Migration**: `monitoring/audit/migration.sql`
- Immutable audit trail in PostgreSQL
- GDPR compliance support

## CI/CD Pipelines

| Workflow | File | Triggers |
|----------|------|----------|
| Smart Contracts | `.github/workflows/contracts-ci.yml` | `contracts/**` changes |
| Frontend | `.github/workflows/frontend-ci.yml` | `frontend/**` changes |
| Backend | `.github/workflows/backend-ci.yml` | `backend/**` changes |
| ML Service | `.github/workflows/ml-service-ci.yml` | `ml-service/**` changes |
| Bridge Relayer | `.github/workflows/bridge-relayer-ci.yml` | `bridge-relayer/**` changes |
| Security Scan | `.github/workflows/security-scan.yml` | Weekly + PR to main |

Each pipeline includes:
- Linting and type checking
- Unit tests with service containers (PostgreSQL, Redis)
- Docker image build and push to GHCR
- Staging and production deployment stages

### Security Scanning
- **npm audit** across all Node.js services
- **Gitleaks** for secret detection
- **Trivy** for container image vulnerability scanning
- **CodeQL** for static analysis
- **Bandit** + **safety** for Python security

## Infrastructure

### Docker
All services have multi-stage Dockerfiles:
- `frontend/Dockerfile` - Next.js standalone build
- `backend/Dockerfile` - Express with dumb-init
- `bridge-relayer/Dockerfile` - Node.js bridge service
- `ml-service/Dockerfile` - Python 3.11 with uvicorn
- `websocket-server/Dockerfile` - Socket.IO server (pre-existing)

### Docker Compose
- `docker-compose.yml` - Production configuration
- `docker-compose.dev.yml` - Development with hot reload, pgAdmin, Redis Commander

### Nginx
- **Config**: `infrastructure/nginx/nginx.conf`
- **Server blocks**: `infrastructure/nginx/conf.d/default.conf`
- Rate limiting per endpoint (API: 30r/s, auth: 5r/s, payment: 10r/s)
- Security headers (HSTS, CSP, X-Frame-Options)
- WebSocket proxy support
- Static asset caching

### Redis
- **Cache service**: `infrastructure/redis/cache.ts`
- **Config**: `infrastructure/redis/redis.conf`
- TTL presets per data type
- Cache invalidation on writes
- 512MB maxmemory with allkeys-lru eviction

### Database
- **Backup script**: `infrastructure/database/backup.sh`
- **Restore script**: `infrastructure/database/restore.sh`
- **Verify script**: `infrastructure/database/verify-backup.sh`
- **PostgreSQL config**: `infrastructure/database/postgresql.conf`
- Automated daily backups with 30-day retention
- Slow query logging (>1s threshold)

### PM2
- **Config**: `infrastructure/pm2/ecosystem.config.js`
- Backend in cluster mode (max CPU instances)
- WebSocket and bridge-relayer as single instances

## Load Testing

k6 test scripts in `load-testing/`:
- `api-load-test.js` - API endpoint load test (100 VUs)
- `payment-stress-test.js` - Payment processing stress test
- `websocket-load-test.js` - WebSocket connection test (500 VUs)
- `db-benchmark.js` - Database read/write benchmarks

Run tests:
```bash
k6 run load-testing/api-load-test.js
k6 run load-testing/payment-stress-test.js
```

## Runbooks

Operational runbooks in `runbooks/`:
- `service-down.md` - Service failure diagnosis and recovery
- `database-recovery.md` - Database issues and restore procedures
- `high-error-rate.md` - Error rate triage and mitigation
- `blockchain-sync.md` - Blockchain sync issue resolution
- `post-mortem-template.md` - Incident post-mortem template

## Quick Start

### Development
```bash
docker compose -f docker-compose.dev.yml up -d
```

### Production
```bash
cp .env.example .env
# Edit .env with production values
docker compose up -d
```

### Monitoring Stack
```bash
# Start monitoring services
docker compose -f monitoring/logging/docker-compose.yml up -d

# Access Grafana at http://localhost:3000
# Default credentials: admin/admin
```

## Environment Variables

See `.env.example` for the full list. Key monitoring variables:

| Variable | Description |
|----------|-------------|
| `SENTRY_DSN` | Sentry error tracking DSN |
| `SENTRY_ENVIRONMENT` | Environment name for Sentry |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) |
| `SLACK_WEBHOOK_URL` | Slack webhook for alert notifications |
| `PAGERDUTY_ROUTING_KEY` | PagerDuty routing key for critical alerts |
| `GF_SECURITY_ADMIN_PASSWORD` | Grafana admin password |
