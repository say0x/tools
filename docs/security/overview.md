# Security

## Bedrohungsmodell

Einzelnutzer-Tool im eigenen Homelab, nur über VPN erreichbar (siehe [ADR-0006](../architecture/decisions/0006-kein-app-level-login.md)). Kein App-Level-Login, keine öffentliche Erreichbarkeit gewollt. Sicherheitsmaßnahmen sind an dieser Prämisse zu messen — "keine Authentifizierung" ist hier eine bewusste Entscheidung, kein übersehener Fund, solange die Prämisse (VPN-only, ein Nutzer) gilt.

## Stand (letztes vollständiges Audit: 2026-08-22)

- **Secrets**: keine im Repository oder in der Git-Historie gefunden. `.env` ist gitignored und nicht getrackt.
- **Eingabevalidierung**: alle Server Actions mit Formular-Input validieren über Zod vor dem DB-Zugriff (`schema.safeParse()` + lesbare Fehlermeldung, einheitliches Muster über `src/server/actions/*.ts` hinweg, inklusive `reference-data.ts` seit dem Audit).
- **SQL-Injection**: kein `$queryRaw`/`$executeRaw` im eigenen Code — alle Zugriffe laufen über Prismas parametrisierten Query-Builder.
- **Logging**: keine sensiblen Daten (Einkommen, Vermögenswerte) in `console.*`-Aufrufen gefunden.
- **Netzwerk**: `docker-compose.yml` mappt den Postgres-Port bewusst nicht auf den Host (behoben im Audit — vorher unnötig exponiert mit trivialen Zugangsdaten). Der App-Container erreicht Postgres ausschließlich über das Docker-Netz.
- **Security-Header/CSP**: seit 2026-08-28 gesetzt (`next.config.ts`) — Content-Security-Policy, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, restriktives `Permissions-Policy`. Details und Begründung (statische statt Nonce-basierte CSP): [`docs/deployment/docker.md`](../deployment/docker.md#http-security-header).

## Bekannte, beobachtete Dependency-Advisory

`npm audit` meldet 3 High-Severity-Funde, alle aus derselben Kette: `deepmerge-ts < 8.0.0` (Stack-Exhaustion, [GHSA-ggr8-5vv4-36mx](https://github.com/advisories/GHSA-ggr8-5vv4-36mx)) über `@prisma/config`, eine Abhängigkeit der `prisma`-CLI. Nur zur Build-/Deploy-Zeit erreichbar (Prisma-CLI-Tooling), nicht über die laufende Web-App — reale Ausnutzbarkeit gering. `npm`s vorgeschlagener Fix ist ein Major-Downgrade der `prisma`-CLI — **nicht empfohlen** (schlechter Tausch). Auf ein Patch-Release von `@prisma/config` warten, bei jedem `npm audit`-Lauf neu prüfen statt fest verlinken.

## Vorgehen bei neuen Funden

Neue Security-Findings hier ergänzen (nicht nur im Chat/PR-Verlauf), mit Datum und Status (offen/behoben). Wird eine Prämisse des Bedrohungsmodells verändert (zweiter Nutzer, öffentlicher Zugriff), zuerst [ADR-0006](../architecture/decisions/0006-kein-app-level-login.md) revidieren, dann diese Seite neu bewerten.
