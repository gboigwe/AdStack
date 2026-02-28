#!/bin/bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/adstack}"
DB_NAME="${POSTGRES_DB:-adstack_db}"
DB_USER="${POSTGRES_USER:-adstack}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "[$(date -Iseconds)] Starting backup of ${DB_NAME}..."

pg_dump \
  -h "${DB_HOST}" \
  -p "${DB_PORT}" \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="${BACKUP_FILE}" 2>&1

if [ $? -eq 0 ]; then
  FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "[$(date -Iseconds)] Backup completed: ${BACKUP_FILE} (${FILESIZE})"
else
  echo "[$(date -Iseconds)] ERROR: Backup failed for ${DB_NAME}"
  exit 1
fi

echo "[$(date -Iseconds)] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
REMAINING=$(find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" | wc -l)
echo "[$(date -Iseconds)] Cleanup complete. ${REMAINING} backups remaining."
