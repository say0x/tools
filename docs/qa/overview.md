# QA & Testing

## Philosophie

Priorität nach Risiko, nicht nach Vollständigkeit um ihrer selbst willen: Rechenkern (`src/server/calc/`) zuerst und am gründlichsten, weil ein stiller Rechenfehler dort am teuersten wäre und am schwersten auffällt. UI-Komponenten zuletzt, weil sie bei jeder Änderung ohnehin visuell geprüft werden.

## Automatisierte Tests

- **Rechenkern**: 20 Testdateien (Vitest), inklusive `src/server/calc/__tests__/engine.test.ts` als Referenzobjekt-Test (konkrete Zahlen-Assertions auf jedes Ergebnisfeld von `berechneObjekt()`). Deckt Renditekennzahlen, Tilgungsplan, Steuer-Näherungen, Vermögensverlauf, Verhandlungsargumente, Annahmen-Warnungen, Exit-Szenario ab.
- **Datenverarbeitung**: `src/server/data/mappers.test.ts` (Property-Formular → Prisma-Form-Splitting) und `src/server/data/import-dedup.test.ts` (Dedup-Entscheidung des Import-Skripts) — ergänzt im Audit 2026-08-22, vorher ungetestet trotz geteilter Nutzung zwischen UI-Actions und Bulk-Import.
- **Server Actions**: bewusst nicht flächendeckend getestet — meist dünne Prisma-Orchestrierung über bereits getestete Rechenkern-Funktionen. `property-schema.test.ts` deckt die Zod-Validierung ab.
- **CI**: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) führt Lint, Tests und Produktions-Build bei jedem Push nach `main` und jedem Pull Request aus.
- **E2E (Playwright)**: [`e2e/`](../../e2e/) — lokale, opt-in Suite gegen eine echte laufende Instanz (kein Teil der GitHub-Actions-CI, die ohne Postgres/laufenden Server läuft). Deckt Erreichbarkeit + Konsolenfehler-Freiheit jeder Hauptroute (`smoke.spec.ts`), automatisierte a11y-Scans je Hauptroute via axe-core (`accessibility.spec.ts`, WCAG 2 A/AA), Tastatur-/ARIA-Verhalten der Hauptnavigation (`nav.spec.ts`) und eine echte Formular-Interaktion (`steuerrechner.spec.ts`). Läuft gegen alle drei Playwright-Engines (Chromium/Firefox/WebKit, `playwright.config.ts`). Voraussetzung: `npm run dev` + lokale Postgres-Instanz laufen auf `http://localhost:3000` (überschreibbar via `E2E_BASE_URL`) sowie einmalig `npx playwright install`. Ausführen: `npm run test:e2e` (alle drei Engines) oder `npm run test:e2e -- --project=chromium` (eine Engine). In Sandboxes ohne `npx playwright install`-Zugriff: `PLAYWRIGHT_CHROMIUM_PATH=<pfad-zu-chromium> npm run test:e2e -- --project=chromium`.

Ausführen: `npm run test` (siehe [`docs/development/setup.md`](../development/setup.md)).

## Manuelle QS (diese Session)

Änderungen wurden durchgehend gegen die laufende App geprüft (Playwright, Chromium): Formular-Interaktionen, Live-Neuberechnung, Fokus-Ring-Verhalten, Konsolen-/Seitenfehler, echte Testdaten aus der lokalen Datenbank statt nur Typprüfung. Die zuvor rein manuellen, nicht committeten Ad-hoc-Skripte dieser Prüfungen sind jetzt teilweise als feste `e2e/`-Suite formalisiert (s. o.) — wiederholbar statt Wegwerf-Skript.

## Accessibility-Audit (2026-08-28)

Vollständiger a11y-Durchlauf über alle Haupttools: automatisierter axe-core-Scan jeder Hauptroute (WCAG 2 A/AA, jetzt Teil der `e2e/`-Suite) plus manuelle Tastatur-/Fokus-Prüfung. Gefundene und behobene Probleme:

- **Kontrast**: `text-slate-500` (Hinweistexte, Tabellen-Header, sekundäre Werte) lag mit 3.96–4.24:1 durchgängig unter dem WCAG-AA-Schwellwert 4.5:1 für normalgroßen Text — auf `text-slate-400` angehoben (77 Fundstellen, 29 Dateien). `BesitzstatusBadge`s Blau-Variante (`text-blue-400` auf `bg-blue-500/15`) lag mit 4.38:1 ebenfalls knapp darunter, angehoben auf `text-blue-300`.
- **Fehlende Formular-Labels**: Zahlen-Inputs in den Referenzdaten-Tabellen (Grunderwerbsteuer, Gewerk-Kosten, Kaufpreisfaktor, Mietpreis, Nutzungsdauer) hatten nur einen benachbarten `<span>` als visuelles Label, keine programmatische Zuordnung — `aria-label` ergänzt.
- **Verschachtelte Interaktivität**: der Immobilien-Aufklapp-Eintrag in der Finanzübersicht hatte einen `<Link>` innerhalb eines `<summary>` (axe: `nested-interactive`) — auf einen kontrolliert per `useState` geöffneten `<button>` neben einem Geschwister-`<Link>` umgestellt.
- **Skip-Link**: "Zum Hauptinhalt springen" in `src/app/layout.tsx` ergänzt, damit Tastatur-Nutzer die Navigation überspringen können.
- **Fehler-Announcements**: `Field`-Fehlertext trägt jetzt `role="alert"`, damit Formularfehler von Screenreadern automatisch vorgelesen werden, ohne jede der ~49 Verwendungsstellen einzeln mit `aria-describedby` verdrahten zu müssen.
- **InfoTooltip**: `aria-expanded`/`aria-describedby` und Escape-Taste zum Schließen ergänzt.
- **Zwei `<nav>`-Landmarks** (Desktop/Mobil) erhielten unterschiedliche `aria-label`, um sie eindeutig identifizierbar zu machen.

axe-core deckt nur statisch/DOM-basiert Prüfbares ab (Kontrast, Labels, ARIA-Struktur) — ersetzt keine vollständige Screenreader-Prüfung (NVDA/VoiceOver), die für dieses VPN-only-Einzelnutzer-Tool bewusst nicht durchgeführt wurde.

## Performance-Audit (2026-08-28)

Reale Netzwerk-Transfergrößen je Hauptroute gemessen (Chrome DevTools Protocol, Produktions-Build via `npm run start`, gzip-komprimiert) statt nur den Build-Output zu lesen — Turbopack druckt in Next.js 16 keine Route-Größen-Tabelle mehr wie frühere webpack-Builds.

- **JS-Transfer je Route**: 146–355 KB (gzip). Am schwersten `/finanzuebersicht` (Formular- + Chart-Code auf einer Seite), am leichtesten reine Listen-/Referenzdaten-Seiten ohne Formular oder Chart.
- **Code-Splitting greift wie beabsichtigt**: Recharts (~107 KB) lädt nur auf Routen mit tatsächlichem Chart (`dynamic(..., { ssr: false })`, aus einer früheren Session), react-hook-form+zod (~76 KB) nur auf Routen mit Formular — beides bestätigt eigenständige, bedarfsgerechte Chunks statt eines aufgeblähten gemeinsamen Bundles.
- **Kompression & Caching**: `Content-Encoding: gzip` und `Cache-Control: public, max-age=31536000, immutable` auf allen gehashten `_next/static`-Assets — Standard-Next.js-Verhalten, korrekt aktiv.
- **Ladezeiten**: unter 1,1 s bis „networkidle" auf jeder Route (lokal, ohne CDN).

Kein konkreter Fix nötig — die bereits in einer früheren Session umgesetzte dynamische Chart-Auslagerung reicht aus, um die Bundle-Größen in einem gesunden Bereich zu halten. Für ein internes VPN-only-Einzelnutzer-Tool ohne Mobilfunk-/3G-Nutzer ohnehin kein kritischer Optimierungsdruck.

## Mehrbrowser-Test (2026-08-28)

`playwright.config.ts` definiert die `e2e/`-Suite jetzt für alle drei Engines (Chromium, Firefox, WebKit) statt nur Chromium — `npm run test:e2e` deckt damit reale Rendering-/Verhaltensunterschiede ab, nicht nur einen einzelnen Browser.

**Bekannte Einschränkung dieser Session**: die Entwicklungs-Sandbox, in der dieser Umbau geprüft wurde, blockiert per Netzwerk-Policy den Download der Firefox-/WebKit-Browserbinaries (`npx playwright install firefox webkit` schlägt mit 403 auf `cdn.playwright.dev` fehl) — nur Chromium ist dort vorinstalliert. Die 25 Chromium-Tests liefen deshalb wie gehabt vollständig grün; Firefox/WebKit sind konfiguriert und einsatzbereit, aber in dieser Sandbox nicht selbst ausführbar. Auf einer Maschine mit vollem Internetzugriff (lokal beim Nutzer oder ein CI-Runner) reicht ein einmaliges `npx playwright install`, danach laufen alle drei Engines über `npm run test:e2e`.

## QS-Historie

Statt eines separaten, manuell gepflegten QS-Protokolls dient die GitHub-PR-Historie als QS-Record: jeder gemergte PR trägt seine Test-/Build-/Lint-Ergebnisse in der Beschreibung, dauerhaft einsehbar. Größere QS-Durchläufe (Security-/Code-Qualität-/UX-Audit, Tool-Ökosystem-Analyse) sind zusätzlich als Artefakte dokumentiert und ihre konkreten Funde in [`docs/releases/CHANGELOG.md`](../releases/CHANGELOG.md) nachvollziehbar.
