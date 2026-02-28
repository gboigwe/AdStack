#!/bin/bash
set -euo pipefail

BACKUP_FILE="${1:?Usage: restore.sh <backup_file> [database_name]}"
DB_NAME="${2:-adstack_db}"
DB_USER="${POSTGRES_USER:-adstack}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "ERROR: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "[$(date -Iseconds)] Restoring ${DB_NAME} from ${BACKUP_FILE}..."
echo "WARNING: This will drop and recreate the database ${DB_NAME}."
echo "Press Ctrl+C within 5 seconds to cancel..."
sleep 5

psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();
"

dropdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" --if-exists "${DB_NAME}"
createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}"

pg_restore \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --verbose \
  --no-owner \
  --no-privileges \
  "${BACKUP_FILE}" 2>&1

if [ $? -eq 0 ]; then
  echo "[$(date -Iseconds)] Restore completed successfully."
else
  echo "[$(date -Iseconds)] ERROR: Restore failed."
  exit 1
fi
