# Database Recovery Runbook

## Symptoms
- PostgreSQL connection errors in application logs
- `pg_isready` returns non-zero exit code
- Database connection pool exhaustion alerts
- Slow query alerts from Prometheus

## Diagnosis

### 1. Check PostgreSQL status
```bash
docker compose exec postgres pg_isready
docker compose logs --tail=50 postgres
```

### 2. Check connection count
```bash
docker compose exec postgres psql -U adstack -d adstack -c \
  "SELECT count(*) FROM pg_stat_activity;"
```

### 3. Check active queries
```bash
docker compose exec postgres psql -U adstack -d adstack -c \
  "SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
   FROM pg_stat_activity
   WHERE state != 'idle'
   ORDER BY duration DESC
   LIMIT 20;"
```

### 4. Check disk space
```bash
docker compose exec postgres df -h /var/lib/postgresql/data
```

### 5. Check for locks
```bash
docker compose exec postgres psql -U adstack -d adstack -c \
  "SELECT blocked_locks.pid AS blocked_pid,
          blocking_locks.pid AS blocking_pid,
          blocked_activity.query AS blocked_query,
          blocking_activity.query AS blocking_query
   FROM pg_catalog.pg_locks blocked_locks
   JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
   JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
     AND blocking_locks.relation = blocked_locks.relation
     AND blocking_locks.pid != blocked_locks.pid
   JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
   WHERE NOT blocked_locks.granted;"
```

## Resolution

### Connection pool exhaustion
1. Kill idle connections older than 10 minutes:
```bash
docker compose exec postgres psql -U adstack -d adstack -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity
   WHERE state = 'idle' AND query_start < now() - interval '10 minutes';"
```
2. Review connection pool settings in `infrastructure/database/postgresql.conf`
3. Restart affected application services

### Long-running queries
1. Identify and terminate:
```bash
docker compose exec postgres psql -U adstack -d adstack -c \
  "SELECT pg_cancel_backend(<pid>);"
```
2. If query cannot be cancelled:
```bash
docker compose exec postgres psql -U adstack -d adstack -c \
  "SELECT pg_terminate_backend(<pid>);"
```

### Disk space full
1. Clean up WAL files: `docker compose exec postgres pg_archivecleanup /var/lib/postgresql/data/pg_wal <oldest_needed_wal>`
2. Vacuum: `docker compose exec postgres vacuumdb -U adstack -d adstack --analyze`
3. Add disk space or move data directory

### Full database restore
1. Stop application services: `docker compose stop backend websocket-server bridge-relayer ml-service`
2. Run restore script: `./infrastructure/database/restore.sh <backup-file>`
3. Verify: `./infrastructure/database/verify-backup.sh`
4. Restart services: `docker compose up -d`

## Post-Recovery
1. Verify application connectivity
2. Run `ANALYZE` on frequently queried tables
3. Check Grafana database dashboard for normal metrics
4. Review and adjust connection pool settings if needed
