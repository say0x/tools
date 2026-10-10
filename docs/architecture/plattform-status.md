# Plattform-Status & Roadmap

Faktenbasierte Bestandsaufnahme der Gesamtplattform mit priorisierter Roadmap — [Audit #12](../qa/audit-log.md), Stand **2026-10-10** (nach #90). Ergänzt die [Architektur-Übersicht](overview.md) (Schichten, Prinzipien) um Bewertung und Planung. Bei jedem größeren Plattform-Schritt aktualisieren; erledigte Roadmap-Punkte abhaken statt löschen, damit nachvollziehbar bleibt, warum etwas gebaut wurde.

## 1. Ist-Zustand (aus dem Repository belegt)

**Stack & Betrieb**: Next.js 16.3.8 (App Router, Server Actions, `output: "standalone"`), React 19, TypeScript, PostgreSQL 17 + Prisma 7.10 (`@prisma/adapter-pg`), Tailwind 4, Recharts, Zod 4, `@anthropic-ai/sdk`. Ein Docker-Compose-Stack im Homelab (VPN-only, Reverse-Proxy), `prisma migrate deploy` beim Container-Start. CI (GitHub Actions): Lint, Unit-Tests, Doku-Link-Check, Build inkl. TypeScript.

**Umfang**: 233 TS/TSX-Quelldateien (ohne generierten Prisma-Client), 22 Seiten, 27 Prisma-Modelle, 28 Migrationen. Rechenkern ~3.400 Zeilen, Server Actions ~2.100, Datenzugriff ~1.350, UI ~10.300.

**Tools** (Detail: [`tools/overview.md`](../tools/overview.md)):

| Bereich | Tools | Datenhaltung |
|---|---|---|
| Immobilien & Finanzen | Immobilien-Rechner (+ Vergleich, Referenzdaten, Bodenrichtwert SH), Finanzübersicht, Szenarien, Kaufen-oder-Anlegen | `Asset`-Modell + Detailtabellen, `Szenario`, globale `Reference*` |
| Freistehende Rechner | Sparziel, Steuerrechner, Kreditvergleich, Sport-Rechner | keine |
| Fitness & Ernährung | Tagesübersicht, Ernährungstagebuch (Lebensmittel-DB, KI-Foto), Training, Gewicht, Ziele | 6 user-gebundene Tabellen + `ReferenceLebensmittel` |
| Plattform | Dashboard, Profil (inkl. JSON-Backup/Restore), Nutzer (Test-User) | `User`, `UserProfile` |

**Architektur** ([`overview.md`](overview.md)): Monolith mit klaren Schichten `app → actions → data → calc`; der Rechenkern `src/server/calc/` ist framework-frei und per ESLint gegen React/Next/Prisma-Importe abgesichert ([ADR-0001](decisions/0001-framework-freier-rechenkern.md)). Server Actions validieren mit Zod und liefern `ActionResult` statt zu werfen ([ADR-0008](decisions/0008-server-actions-geben-ergebnis-zurueck-statt-zu-werfen.md)). DB speichert nur Rohdaten, Kennzahlen entstehen zur Laufzeit.

**Daten**: alle persönlichen Daten per `userId` an `User` gebunden (Cascade), Referenzdaten global ([ADR-0009](decisions/0009-lokales-mehrbenutzer-datenmodell.md)). Geldbeträge `Decimal`, Messwerte `Float`. Sicherung doppelt: `pg_dump`-Skripte (Betrieb) und JSON-Export/Restore in der App (inkl. Fitness, abwärtskompatibel).

**Integrationen**: Claude API für die Mahlzeiten-Fotoanalyse (opt-in, gekapselt in `src/server/ki/`, [ADR-0010](decisions/0010-ki-fotoanalyse-ueber-claude-api.md)); BORIS-SH-Import als ausdrücklich unverifizierter Platzhalter (`scripts/import-bodenrichtwerte.ts`). **Keine** programmatische Schnittstelle nach außen — Home Assistant & Co. können die Plattform heute nicht anbinden.

**Sicherheit** ([`security/overview.md`](../security/overview.md)): kein App-Login; Sicherheitsgrenze ist das VPN ([ADR-0006](decisions/0006-kein-app-level-login.md)), der Test-User-Cookie ist bewusst fälschbar. Statische CSP + Security-Header, Zod an allen Schreibwegen, kein Raw-SQL.

**Qualität**: 41 Unit-Testdateien / 380 Tests (Vitest), 7 E2E-Specs / 41 Tests inkl. axe-WCAG-2-AA-Scan aller Routen (Playwright, **nur lokal**), `knip` für Dead Code, 10 ADRs, Audit-Log, Changelog.

## 2. Bewertung

### Stärken

- Saubere Schichtung mit mechanisch erzwungener Trennung von Fachlogik und Framework — neue Fachdomänen (Fitness) ließen sich ohne Umbau bestehender Teile ergänzen.
- Fachliche Nachvollziehbarkeit: Formeln, Quellen und Vereinfachungen je Tool dokumentiert, Rechenkern mit handgerechneten Referenzwerten getestet.
- Konsequente Eingabevalidierung, verständliche Fehlermeldungen, Backup/Restore mit Vorschau und Bestätigung.
- Dokumentationskultur (ADRs, Audit-Log, Link-Check in der CI) — Wissen ist im Repo, nicht nur im Chatverlauf.

### Funde (nach Priorität)

| # | Bereich | Fund | Bewertung | Status |
|---|---|---|---|---|
| F1 | Security | `next` 16.3.3 mit 7 Advisories, davon 1 kritisch (u. a. RCE in `next/og`, SSRF im Image-Optimizer, Cache-Poisoning). Die App nutzt `next/og`, `next/image`, ISR und Draft Mode nicht — reale Ausnutzbarkeit gering, Fix aber ein reines Patch-Update | **kritisch** | behoben in diesem PR (16.3.8) |
| F2 | Security | Verbleibende `npm audit`-Funde nur in der Build-/Dev-Toolchain: Prisma-CLI (`deepmerge-ts`, `mysql2` — MySQL wird nicht genutzt) und `eslint-config-next` (`braces`/`micromatch`). Einziger angebotener „Fix" ist jeweils ein Major-**Downgrade**; Prisma 8 ist noch RC | niedrig | bewusst akzeptiert, bei jedem Audit neu prüfen |
| F3 | Security | Kein App-Login; jeder im VPN hat vollen Zugriff auf Finanz-, Immobilien- und Gesundheitsdaten. Tragfähig **nur** unter der VPN-Prämisse — jede Exposition darüber hinaus (SaaS, Port-Freigabe) braucht vorher echte Authentifizierung | hoch (prämissenabhängig) | Roadmap R9, Entscheidung beim Nutzer |
| F4 | Qualität | E2E läuft nicht in der CI: der Steuerrechner-Test war seit #84 rot (mehrdeutiger Locator), unbemerkt | mittel | Test repariert; CI-Integration R6 |
| F5 | Barrierefreiheit | 5 Texte mit `text-slate-500` unter WCAG-AA-Kontrast (3,96:1) in Zuständen, die der axe-Scan nie erreicht (Netto-Zeile bei Krediten, offenes Nutzer-Menü, Bodenrichtwert-Card, Restore-Vorschau) | mittel | behoben in diesem PR |
| F6 | Architektur | Ein neues Tool muss an ≥ 5 Stellen von Hand eingetragen werden (`Nav.tsx` mit Index-basiertem Trenner, Dashboard-Werkzeugliste, `e2e/routes.ts`, Tool-Doku, README) — skaliert schlecht und driftet | mittel | behoben in #93 (`src/lib/tool-registry.ts`, Drift-Tests) |
| F7 | Architektur | Zwei Muster für die Nutzerauflösung: implizit `getActiveUserId()` in Loadern (Immobilien/Finanzen) vs. explizite `userId` im Datenzugriff (Fitness). Für Schnittstellen ohne Cookie (API) ist nur das explizite Muster sicher | mittel | schrittweise angleichen (R8), nicht als Big-Bang |
| F8 | Architektur | Dashboard-Kennzahlen werden direkt in der Seitenkomponente berechnet — für eine API nicht wiederverwendbar | niedrig | behoben in #92 (`src/server/data/dashboard-kennzahlen.ts`, genutzt von Startseite und API) |
| F9 | Betrieb | Kein Health-Endpunkt, kein Healthcheck für den App-Container (nur für Postgres) | niedrig | behoben in #92 (`/api/v1/status`, Compose-Healthcheck) |
| F10 | Release | Version stand seit 2026-08-23 auf `0.2.0-20260823`, obwohl Mehrbenutzer-Modell, Fitness und KI dazukamen; der `[0.2.0]`-Abschnitt im Changelog reichte bis #90 trotz Datumsangabe „bis 2026-08-29" | niedrig | behoben in diesem PR (`0.3.0-20261010`) |
| F11 | Doku | Migrationsanzahl in `database/schema.md` seit #88 um eins zu niedrig; `workflow.md` nannte ADRs „bis 0008" | niedrig | behoben in diesem PR |
| F13 | UX/Skalierung | Kopfzeile lief bei 640 px über (seitliches Scrollen, Menüknopf abgeschnitten) und brach bei 768 px um; jedes neue Tool verlängerte Kopfzeile, Dropdown oder Startseite | mittel | behoben in #94 ([ADR-0012](decisions/0012-skalierbare-navigation.md)) |
| F12 | Performance | Dashboard rechnet die 50-Jahres-Engine für jedes Objekt bei jedem Aufruf; gemessen mit 27 Objekten ~60–100 ms | keiner akut | beobachten, erst ab spürbarer Latenz cachen |

### Skalierungsengpässe

1. ~~**Tool-Registrierung**~~ (F6) — seit #93 ein Eintrag in `src/lib/tool-registry.ts`; Navigation, Startseite, Tabs und E2E-Routen leiten sich ab, Tests melden vergessene Seiten.
2. ~~**Fehlende Außenschnittstelle**~~ — seit #92 gelöst: REST-API v1 mit Tokens, OpenAPI und Home-Assistant-Endpunkt ([ADR-0011](decisions/0011-rest-api-mit-bearer-tokens.md)).
3. **Auth** (F3) — blockiert jeden Betrieb jenseits des VPN; die Datenschicht ist durch das Mehrbenutzer-Modell vorbereitet, die Nutzerauflösung (F7) noch nicht überall.

## 3. Roadmap

### Sofort (klar abgegrenzt, hoher Nutzen, geringes Risiko)

- [x] **R1** Next.js-Sicherheitsupdate auf 16.3.8 + nicht-brechende transitive Fixes (F1)
- [x] **R2** Kontrast-Fixes, reparierter Steuerrechner-E2E-Test (F4, F5)
- [x] **R3** Version `0.3.0-20261010`, Changelog-Schnitt, Doku-Korrekturen (F10, F11)
- [x] **R4** (#92) REST-API v1 mit Token-Authentifizierung, OpenAPI-Beschreibung und Home-Assistant-Anbindung (Sensoren, Schreibwege für Waage/Wasser/Schritte, Foto-Upload per Kurzbefehl); Dashboard-Kennzahlen als geteiltes Datenmodul; Health-Endpunkt + Compose-Healthcheck (F8, F9, Engpass 2). Neues ADR-0011.
- [x] **R5** (#93) Zentrale Tool-Registry: Navigation und Dashboard-Werkzeugliste aus einer Quelle, Drift-Test gegen `e2e/routes.ts`, dokumentierter Ablauf „neues Tool hinzufügen" (F6)

- [x] **R12** (#94) Skalierbare Navigation: Kategorien, Kopfzeile mit fester Breite, „Alle Tools“-Panel, Befehlspalette (Strg+K) mit Schnellzugriffen und „Zuletzt verwendet“, gruppierte Startseite; Grenzen als Tests (F13, ADR-0012)

### Mittelfristig (Architektur & Qualität)

- [ ] **R6** E2E (Smoke + axe) in der CI mit Postgres-Service-Container und Seed (F4)
- [ ] **R7** `Field`/`InfoTooltip`: Label-Struktur so umbauen, dass Eingabefelder mit Info-Button einen korrekten Accessible Name bekommen (bekannte Eigenheit seit #88)
- [ ] **R8** Datenzugriff der Immobilien-/Finanz-Loader auf explizite `userId` umstellen, wenn sie ohnehin angefasst werden (F7) — Voraussetzung für R9
- [ ] **R9** Echte Authentifizierung vor jeder Exposition außerhalb des VPN (ADR-Revision von 0006/0009) — **Produktentscheidung beim Nutzer**
- [ ] **R10** BORIS-SH-Import auf `ct-tools` gegen die echte Schnittstelle verifizieren und Platzhalter ersetzen
- [ ] **R11** Strukturierte Logs mit Request-ID für API-Aufrufe (ohne personenbezogene Inhalte)

### Optional / Ideen (nur bei konkretem Bedarf)

- Push-Benachrichtigungen an Home Assistant (Webhook) zusätzlich zum Polling
- Lebensmittel per Barcode (z. B. Open Food Facts) — neuer externer Datenfluss, eigener Adapter
- Import aus Sportuhr/Plattformen (Garmin, Strava) über die REST-API oder eigene Adapter
- Globale Suche über alle Tools; installierbare Web-App (PWA) für schnelles Erfassen am Handy

## 4. Architekturentscheidungen & Konventionen

Bestehend und weiterhin gültig: [ADR-0001](decisions/0001-framework-freier-rechenkern.md) (framework-freier Rechenkern), [ADR-0005](decisions/0005-computed-with-override-pattern.md) (computed-with-override), [ADR-0007](decisions/0007-monolith-statt-microservices.md) (Monolith — ein Plugin-System oder dynamisches Laden ist bei zwölf Tools nicht gerechtfertigt; eine statische Registry genügt), [ADR-0008](decisions/0008-server-actions-geben-ergebnis-zurueck-statt-zu-werfen.md), [ADR-0009](decisions/0009-lokales-mehrbenutzer-datenmodell.md), [ADR-0010](decisions/0010-ki-fotoanalyse-ueber-claude-api.md), [ADR-0011](decisions/0011-rest-api-mit-bearer-tokens.md) (REST-API mit Bearer-Tokens).

Konventionen, die sich aus diesem Audit ergeben:

- **Externe Anbieter** bekommen genau ein Adapter-Modul (heute `src/server/ki/`), das allein das SDK/HTTP anspricht: Timeouts, begrenzte Retries, typisierte Fehlerübersetzung, injizierbarer Client für Tests ohne Netzwerk, Konfiguration nur über Umgebungsvariablen. Kein direkter SDK-Aufruf aus Seiten, Actions oder anderen Tools. Eine generische Integrationsschicht wird erst bei mehreren gleichartigen Anbietern sinnvoll.
- **Schnittstellen nach außen** laufen ausschließlich über `/api/v1` mit `apiRoute()` (Token, Schreibrecht, Validierung, Fehlerformat) und teilen sich die Zod-Schemas mit den Server Actions; jede Route steht in `src/server/api/openapi.ts` (Test erzwingt das). Ablauf: [`docs/api/README.md`](../api/README.md#neuen-endpunkt-hinzufügen).
- **Neuer Datenzugriff** nimmt die `userId` explizit entgegen (Muster aus `src/server/data/fitness.ts`); `getActiveUserId()` gehört an die Ränder (Seiten, Server Actions).
- **Lese-Funktionen nicht in `"use server"`-Dateien mit Nutzer-Parameter** exportieren — jede dort exportierte Funktion ist vom Browser aus aufrufbar.
- **Versionierung** bleibt bei der etablierten Konvention `MAJOR.MINOR.PATCH-YYYYMMDD` für die Gesamtplattform (`package.json`, Changelog-Abschnitt je Version); keine eigenen Tool-Versionen ([ADR-0007](decisions/0007-monolith-statt-microservices.md)). Git-Tags/Releases nur auf ausdrücklichen Wunsch.
