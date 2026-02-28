#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/adstack}"
DB_NAME="${POSTGRES_DB:-adstack_db}"
DB_USER="${POSTGRES_USER:-adstack}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

LATEST_BACKUP=$(find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f | sort -r | head -1)

if [ -z "${LATEST_BACKUP}" ]; then
  echo "ERROR: No backup files found in ${BACKUP_DIR}"
  exit 1
fi

echo "[$(date -Iseconds)] Verifying backup: ${LATEST_BACKUP}"

TEST_DB="${DB_NAME}_verify_$(date +%s)"

createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${TEST_DB}"

pg_restore \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${TEST_DB}" \
  --no-owner \
  --no-privileges \
  "${LATEST_BACKUP}" 2>&1

RESTORE_STATUS=$?

TABLE_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${TEST_DB}" -t -c "
  SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
" | tr -d ' ')

echo "[$(date -Iseconds)] Tables restored: ${TABLE_COUNT}"

dropdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${TEST_DB}"

if [ ${RESTORE_STATUS} -eq 0 ] && [ "${TABLE_COUNT}" -gt 0 ]; then
  echo "[$(date -Iseconds)] Backup verification PASSED"
  exit 0
else
  echo "[$(date -Iseconds)] Backup verification FAILED"
  exit 1
fi
