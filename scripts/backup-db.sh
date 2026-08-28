#!/usr/bin/env bash
# Dump der Postgres-Datenbank aus dem laufenden docker-compose-Setup auf den Host.
# custom format (-Fc): komprimiert, für pg_restore mit --clean/--if-exists geeignet.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

BACKUP_DIR="backups"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/tools-${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

docker compose exec -T postgres pg_dump -U tools -Fc tools > "$BACKUP_FILE"

echo "Backup geschrieben: ${BACKUP_FILE} ($(du -h "$BACKUP_FILE" | cut -f1))"
