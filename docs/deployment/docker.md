# Deployment

## Homelab (`tools.sayox.de`)

```bash
docker compose up -d --build
```

Startet Postgres + die App (`Dockerfile`, Next.js `output: 'standalone'`). Der Container führt beim Start automatisch `prisma migrate deploy` aus (`docker-entrypoint.sh`), bevor der Server hochfährt.

Das `Dockerfile` nutzt BuildKit-Cache-Mounts für `npm ci` (`/root/.npm`) und für Next.js' eigenen Build-Cache (`/app/.next/cache`) — dadurch bleiben npm- und Turbopack-Zwischenstände über mehrere `docker compose up -d --build`-Läufe hinweg erhalten (auch wenn sich `package-lock.json` ändert oder ein `docker system prune` den Layer-Cache gelöscht hat), was wiederholte Rebuilds nach einem `git pull` spürbar beschleunigt. Erfordert BuildKit (Standard bei aktuellem Docker Compose).

**Einmalig nach dem ersten Deploy** die Referenzdaten befüllen:

```bash
docker compose exec app npx prisma db seed
```

(Danach nicht erneut ausführen, sonst werden manuelle Anpassungen auf der Referenzdaten-Seite überschrieben — der Seed läuft bewusst nicht automatisch bei jedem Start.)

## Backup & Restore

```bash
npm run db:backup                       # schreibt backups/tools-<timestamp>.dump
npm run db:restore -- backups/tools-<timestamp>.dump
```

`scripts/backup-db.sh` läuft `pg_dump` im `postgres`-Container (custom format `-Fc`, komprimiert) und schreibt das Dump auf den Host nach `backups/` — nicht in den Docker-Volume, damit ein Backup einen Volume-Verlust übersteht. `backups/` ist `.gitignore`t (enthält echte Finanzdaten) und liegt außerhalb des von `docker-compose.yml` verwalteten `postgres_data`-Volumes.

`scripts/restore-db.sh <dump>` spielt ein Dump zurück (`pg_restore --clean --if-exists`, überschreibt also den aktuellen Stand) — fragt vorher interaktiv nach Bestätigung, da destruktiv. Vor einem echten Restore-Ernstfall lohnt sich ein Testlauf gegen eine lokale Postgres-Instanz statt direkt gegen die Produktivdatenbank.

Für automatisierte Backups (z. B. täglich per Cron) reicht ein Aufruf von `npm run db:backup` im Homelab-Cron; eine Rotation/Aufbewahrungsfrist für `backups/` ist nicht Teil des Skripts — das übernimmt die ohnehin vorhandene Homelab-Backup-Strategie (z. B. restic/borg über das gesamte `backups/`-Verzeichnis), keine app-eigene Logik dafür nötig.

## Netzwerk & Absicherung

Die App ist intern unter Port 3000 erreichbar; im Homelab per Reverse-Proxy auf `tools.sayox.de` mappen. Kein eigenes App-Level-Login — die Absicherung erfolgt über das Docker-/Homelab-Netz bzw. den Reverse-Proxy (VPN-only), siehe [ADR-0006](../architecture/decisions/0006-kein-app-level-login.md).

`docker-compose.yml` mappt den Postgres-Port bewusst **nicht** auf den Host — der App-Container erreicht Postgres über das Docker-Netz (Service-Name `postgres`). Für ad-hoc `psql`-Zugriff: `docker compose exec postgres psql -U tools`.

Passend zum VPN-only-Modell: `src/app/layout.tsx` setzt `robots: { index: false, follow: false }` (kein Sitemap/OG-Setup, da nicht für Suchmaschinen/Social-Previews gedacht). Jede Route hat einen eigenen `<title>` (`"%s · tools"`-Template) und ein eigenes Favicon (`src/app/icon.png` / `apple-icon.png`, Next-16-App-Icon-Konvention).

## CI

[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) läuft bei jedem Push nach `main` und bei jedem Pull Request: Lint, Tests, Produktions-Build. Der Build-Schritt führt den TypeScript-Check gleich mit aus — ein separater `tsc`-Schritt davor scheitert auf einem frischen Checkout, da `next-env.d.ts` auf `.next/types/*` verweist, das erst der Build selbst erzeugt (Erkenntnis aus dem ersten echten CI-Lauf, siehe [`docs/releases/CHANGELOG.md`](../releases/CHANGELOG.md)). Kein Postgres-Service im Workflow nötig — `prisma generate` liest nur das Schema, keine Datenroute wird zur Build-Zeit statisch gerendert (alle DB-lesenden Routen sind `export const dynamic = "force-dynamic"`); `DATABASE_URL` im Workflow ist ein syntaktisch gültiger, aber nicht erreichbarer Dummy-Wert.
