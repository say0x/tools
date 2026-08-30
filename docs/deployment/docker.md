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

### Opt-in: Nutzer-Daten bei jedem Deploy zurücksetzen

**Nur für Demo-/Test-Instanzen gedacht — bei echten Finanzdaten NICHT setzen.** Mit `RESET_USER_DATA_ON_DEPLOY=true` löscht `docker-entrypoint.sh` bei **jedem** Start (also bei jedem `git pull && docker compose up -d --build`) unwiderruflich Objekte, Profil, Sparpositionen und Szenarien (`scripts/reset-user-data.ts`, dieselbe Löschreihenfolge wie beim App-seitigen Restore) und seedet danach die Referenzdaten neu (`prisma db seed`) — ohne Bestätigungs-Dialog, anders als der App-seitige Restore-Mechanismus unter `/profil`. Standardmäßig **nicht gesetzt** (`docker-compose.yml` reicht die Variable mit Default `false` durch), das bisherige Verhalten (nur Migrationen) bleibt unverändert.

Seit dem lokalen Mehrbenutzer-Datenmodell ([ADR-0009](../architecture/decisions/0009-lokales-mehrbenutzer-datenmodell.md), `/nutzer`): der Reset gilt für **alle** Test-User gemeinsam, nicht nur den gerade aktiven — das Skript hat keinen Request-/Cookie-Kontext, aus dem sich ein einzelner User ableiten ließe. Die Test-User-Zeilen selbst (Namen unter `/nutzer`) bleiben erhalten, wie Referenzdaten — nur ihre Daten werden geleert.

Aktivieren: in einer lokalen `.env`-Datei neben `docker-compose.yml` (von Compose automatisch geladen, nicht Teil des Repos) `RESET_USER_DATA_ON_DEPLOY=true` eintragen — **niemals** fest in `docker-compose.yml` verdrahten.

Manuell, außerhalb des Deploy-Zyklus: `npm run db:reset-user-data` (löscht ohne Neu-Seed) oder `npm run db:reset-user-data && npx prisma db seed` (löscht + seedet neu). Vorher immer `npm run db:backup`.

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

### HTTP-Security-Header

`next.config.ts`s `headers()` setzt auf jede Route eine Content-Security-Policy plus `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` und ein restriktives `Permissions-Policy` (keine Kamera/Mikrofon/Geolocation — von der App ohnehin nicht genutzt).

Die CSP ist bewusst **statisch** (`script-src 'self' 'unsafe-inline'`) statt Nonce-basiert: eine Nonce-CSP erzwingt dynamisches Rendering auf jeder Route (keine Static-Optimierung/ISR mehr, siehe `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`) — für ein VPN-only-Einzelnutzer-Tool ohne öffentlichen Zugriff ([ADR-0006](../architecture/decisions/0006-kein-app-level-login.md)) ein unverhältnismäßiger Performance-Tradeoff gegenüber dem zusätzlichen Schutz. `style-src 'unsafe-inline'` ist nötig für echte, unvermeidbare inline `style={{}}`-Nutzung (dynamische Balkenbreite im Dashboard, Fallback-Styling in `global-error.tsx`). Alles andere bleibt streng: kein Framing (`frame-ancestors 'none'`), keine Plugins (`object-src 'none'`), keine externen Bild-/Font-/Verbindungsziele — die App lädt ohnehin nichts von Drittanbietern (`next/font` hostet Google Fonts zur Build-Zeit selbst).

`Strict-Transport-Security` (HSTS) wird hier bewusst **nicht** gesetzt — TLS-Terminierung passiert am Reverse-Proxy, nicht in der App selbst (die App läuft intern über Klartext-HTTP auf Port 3000), HSTS gehört deshalb in die Reverse-Proxy-Konfiguration außerhalb dieses Repos.

Aus demselben Grund fehlt in der CSP bewusst `upgrade-insecure-requests`: das Directive weist den Browser an, JEDE Unterressourcen-Anfrage (CSS/JS/Fonts) unabhängig vom Ladeweg der Seite selbst von `http` auf `https` hochzustufen. Wird die App — wie oben beschrieben — direkt per Klartext-HTTP erreicht (z. B. `http://<host-ip>:3000` im lokalen Netz, ohne den Reverse-Proxy davor), schlagen diese hochgestuften Anfragen fehl, weil auf Port 3000 kein TLS läuft — die Seite lädt dann komplett ungestyled (alle CSS-/JS-Requests brechen ab). Kurzzeitig in #71 gesetzt und in #81 wieder entfernt, nachdem genau dieser Fall live aufgetreten ist.

## CI

[`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) läuft bei jedem Push nach `main` und bei jedem Pull Request: Lint, Tests, Produktions-Build. Der Build-Schritt führt den TypeScript-Check gleich mit aus — ein separater `tsc`-Schritt davor scheitert auf einem frischen Checkout, da `next-env.d.ts` auf `.next/types/*` verweist, das erst der Build selbst erzeugt (Erkenntnis aus dem ersten echten CI-Lauf, siehe [`docs/releases/CHANGELOG.md`](../releases/CHANGELOG.md)). Kein Postgres-Service im Workflow nötig — `prisma generate` liest nur das Schema, keine Datenroute wird zur Build-Zeit statisch gerendert (alle DB-lesenden Routen sind `export const dynamic = "force-dynamic"`); `DATABASE_URL` im Workflow ist ein syntaktisch gültiger, aber nicht erreichbarer Dummy-Wert.
