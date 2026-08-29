#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

# Opt-in, standardmäßig aus: löscht bei jedem Deploy ALLE Nutzer-Daten
# (Objekte, Profil, Sparpositionen, Szenarien) unwiderruflich und seedet
# die Referenzdaten neu. Nur setzen, wenn das ausdrücklich gewollt ist
# (z.B. Demo-/Test-Instanz) — bei echten Finanzdaten ohne Cloud-Backup vorher
# IMMER `npm run db:backup` laufen lassen. Siehe docs/deployment/docker.md.
if [ "$RESET_USER_DATA_ON_DEPLOY" = "true" ]; then
  echo "RESET_USER_DATA_ON_DEPLOY=true — lösche Nutzer-Daten und seede Referenzdaten neu..."
  npx tsx scripts/reset-user-data.ts
  npx prisma db seed
fi

exec "$@"
