#!/usr/bin/env bash
# Stellt ein mit backup-db.sh erzeugtes Dump wieder her. Destruktiv: --clean/--if-exists
# löscht vorhandene Objekte vor dem Wiedereinspielen — deshalb die Sicherheitsabfrage unten.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [ $# -ne 1 ]; then
  echo "Usage: $0 <pfad-zum-dump>" >&2
  echo "Verfügbare Backups:" >&2
  ls -1t backups/*.dump 2>/dev/null >&2 || echo "  (keine gefunden in backups/)" >&2
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Datei nicht gefunden: ${BACKUP_FILE}" >&2
  exit 1
fi

echo "WARNUNG: Dies überschreibt die aktuelle Datenbank im laufenden docker-compose-Setup"
echo "mit dem Inhalt von: ${BACKUP_FILE}"
read -r -p "Fortfahren? [y/N] " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "Abgebrochen."
  exit 1
fi

docker compose exec -T postgres pg_restore -U tools -d tools --clean --if-exists < "$BACKUP_FILE"

echo "Wiederhergestellt aus: ${BACKUP_FILE}"
