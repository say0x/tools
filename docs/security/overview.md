# Security

## Bedrohungsmodell

Einzelnutzer-Tool im eigenen Homelab, nur über VPN erreichbar (siehe [ADR-0006](../architecture/decisions/0006-kein-app-level-login.md)). Kein App-Level-Login, keine öffentliche Erreichbarkeit gewollt. Sicherheitsmaßnahmen sind an dieser Prämisse zu messen — "keine Authentifizierung" ist hier eine bewusste Entscheidung, kein übersehener Fund, solange die Prämisse (VPN-only, ein Nutzer) gilt.

## Stand (letztes vollständiges Audit: 2026-08-22, Plattform-Bestandsaufnahme: 2026-10-10)

- **Secrets**: keine im Repository oder in der Git-Historie gefunden. `.env` ist gitignored und nicht getrackt.
- **Eingabevalidierung**: alle Server Actions mit Formular-Input validieren über Zod vor dem DB-Zugriff (`schema.safeParse()` + lesbare Fehlermeldung, einheitliches Muster über `src/server/actions/*.ts` hinweg, inklusive `reference-data.ts` seit dem Audit).
- **SQL-Injection**: kein `$queryRaw`/`$executeRaw` im eigenen Code — alle Zugriffe laufen über Prismas parametrisierten Query-Builder.
- **Logging**: keine sensiblen Daten (Einkommen, Vermögenswerte) in `console.*`-Aufrufen gefunden.
- **Netzwerk**: `docker-compose.yml` mappt den Postgres-Port bewusst nicht auf den Host (behoben im Audit — vorher unnötig exponiert mit trivialen Zugangsdaten). Der App-Container erreicht Postgres ausschließlich über das Docker-Netz.
- **Security-Header/CSP**: seit 2026-08-28 gesetzt (`next.config.ts`) — Content-Security-Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, restriktives `Permissions-Policy`. Details und Begründung (statische statt Nonce-basierte CSP): [`docs/deployment/docker.md`](../deployment/docker.md#http-security-header).

## REST-API & Tokens (seit 2026-10, [ADR-0011](../architecture/decisions/0011-rest-api-mit-bearer-tokens.md))

- `/api/v1/*` verlangt `Authorization: Bearer <Token>`; öffentlich sind nur `/api/v1/status` (ohne Nutzerdaten) und `/api/v1/openapi.json`.
- Tokens: 256 Bit Zufall, in der DB nur als SHA-256-Hash; Klartext wird einmal angezeigt. Lese-Tokens werden bei POST/PUT/DELETE mit 403 abgewiesen. Widerruf wirkt sofort.
- Jede API-Datenfunktion bekommt die `userId` aus dem Token — nie aus dem Nutzer-Cookie. Löschen nur per `(id, userId)`; fremde IDs liefern 404.
- Eingaben: Zod-Validierung (dieselben Schemas wie die Server Actions), Body-Limits (64 KB / 256 KB / 8 MB Foto), `Content-Type`-Pflicht, `Cache-Control: no-store`. Fehlerantworten enthalten keine Stacktraces (Details nur im Server-Log).
- **Grenze**: Die API ändert die Prämisse nicht. Wer das UI erreicht, kann auf `/integrationen` Tokens für jeden lokalen Nutzer erstellen. Tokens schützen gegen Geräte ohne Token, nicht gegen Personen mit UI-Zugriff.

## Externe Datenflüsse

- **KI-Fotoanalyse (opt-in, seit 2026-10)**: nur wenn `ANTHROPIC_API_KEY` gesetzt ist, sendet der Server verkleinerte Mahlzeitenfotos und einen optionalen Zusatztext an die Anthropic API ([ADR-0010](../architecture/decisions/0010-ki-fotoanalyse-ueber-claude-api.md)). Der Aufruf passiert ausschließlich serverseitig — der Schlüssel erreicht nie den Browser, die CSP bleibt bei `connect-src 'self'`. Fotos werden von `tools` nicht gespeichert. Validierung vor dem Versand: Bildtyp anhand der Dateisignatur (JPEG/PNG/WebP/GIF) und Größe (≤ 5 MB). Über die API (`POST /api/v1/fitness/mahlzeiten/foto-analyse`) gilt dasselbe, nur mit Schreib-Token. Kostendeckel `KI_FOTO_LIMIT_PRO_TAG`. Der Schlüssel gehört in die lokale `.env` (gitignored), nie ins Repository oder in `docker-compose.yml`.

## Dependency-Advisories (Stand 2026-10-10, [Audit #12](../qa/audit-log.md))

- **Behoben**: `next` 16.3.3 → 16.3.8 (7 Advisories, davon 1 kritisch — RCE in `next/og`, SSRF im Image-Optimizer, Cache-Poisoning, Informationslecks). Die App nutzt `next/og`, `next/image`, ISR und Draft Mode nicht; das Update war trotzdem Pflicht, weil die Endpunkte im Server existieren. Dazu nicht-brechende transitive Fixes per `npm audit fix` (`brace-expansion`, `fast-uri`, `sharp`, `smol-toml`, `source-map-js`).
- **Bewusst akzeptiert** (nur Build-/Dev-Toolchain, nicht in der laufenden Web-App erreichbar):
  - Prisma-CLI: `deepmerge-ts < 8.0.0` ([GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx)) über `@prisma/config`, `mysql2` (die Plattform nutzt ausschließlich PostgreSQL). `npm`s „Fix" ist ein Major-**Downgrade** auf Prisma 6; Prisma 8 ist noch Release Candidate.
  - `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob`/`micromatch`/`braces` (ReDoS/Stack-Exhaustion beim Linten). „Fix" wäre ein Downgrade auf `eslint-config-next` 14.
- Bei jedem `npm audit`-Lauf neu prüfen (`npm audit --omit=dev` zeigt den produktionsrelevanten Teil).

## Vorgehen bei neuen Funden

Neue Security-Findings hier ergänzen (nicht nur im Chat/PR-Verlauf), mit Datum und Status (offen/behoben). Wird eine Prämisse des Bedrohungsmodells verändert (zweiter Nutzer, öffentlicher Zugriff), zuerst [ADR-0006](../architecture/decisions/0006-kein-app-level-login.md) revidieren, dann diese Seite neu bewerten.
