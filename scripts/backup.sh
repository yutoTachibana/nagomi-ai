#!/bin/bash
# PostgreSQL backup script for こもれび
# Usage: ./scripts/backup.sh
# Cron example: 0 3 * * * /path/to/scripts/backup.sh

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="komorebi_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

# Docker Compose でバックアップ
docker compose exec -T db pg_dump -U komorebi komorebi | gzip > "${BACKUP_DIR}/${FILENAME}"

# 30日以上前のバックアップを削除
find "$BACKUP_DIR" -name "komorebi_*.sql.gz" -mtime +30 -delete

echo "Backup created: ${BACKUP_DIR}/${FILENAME}"
echo "Size: $(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)"
