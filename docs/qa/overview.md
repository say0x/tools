# QA & Testing

## Philosophie

Priorität nach Risiko, nicht nach Vollständigkeit um ihrer selbst willen: Rechenkern (`src/server/calc/`) zuerst und am gründlichsten, weil ein stiller Rechenfehler dort am teuersten wäre und am schwersten auffällt. UI-Komponenten zuletzt, weil sie bei jeder Änderung ohnehin visuell geprüft werden.

## Automatisierte Tests

- **Rechenkern**: 20 Testdateien (Vitest), inklusive `src/server/calc/__tests__/engine.test.ts` als Referenzobjekt-Test (konkrete Zahlen-Assertions auf jedes Ergebnisfeld von `berechneObjekt()`). Deckt Renditekennzahlen, Tilgungsplan, Steuer-Näherungen, Vermögensverlauf, Verhandlungsargumente, Annahmen-Warnungen, Exit-Szenario ab.
- **Datenverarbeitung**: `src/server/data/mappers.test.ts` (Property-Formular → Prisma-Form-Splitting) und `src/server/data/import-dedup.test.ts` (Dedup-Entscheidung des Import-Skripts) — ergänzt im Audit 2026-08-22, vorher ungetestet trotz geteilter Nutzung zwischen UI-Actions und Bulk-Import.
- **Server Actions**: bewusst nicht flächendeckend getestet — meist dünne Prisma-Orchestrierung über bereits getestete Rechenkern-Funktionen. `property-schema.test.ts` deckt die Zod-Validierung ab.
- **CI**: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) führt Lint, Tests und Produktions-Build bei jedem Push nach `main` und jedem Pull Request aus.
- **E2E (Playwright)**: [`e2e/`](../../e2e/) — lokale, opt-in Suite gegen eine echte laufende Instanz (kein Teil der GitHub-Actions-CI, die ohne Postgres/laufenden Server läuft). Deckt Erreichbarkeit + Konsolenfehler-Freiheit jeder Hauptroute (`smoke.spec.ts`), automatisierte a11y-Scans je Hauptroute via axe-core (`accessibility.spec.ts`, WCAG 2 A/AA), Tastatur-/ARIA-Verhalten der Hauptnavigation (`nav.spec.ts`) und eine echte Formular-Interaktion (`steuerrechner.spec.ts`). Voraussetzung: `npm run dev` + lokale Postgres-Instanz laufen auf `http://localhost:3000` (überschreibbar via `E2E_BASE_URL`). Ausführen: `npm run test:e2e`. In Sandboxes ohne `npx playwright install`-Zugriff: `PLAYWRIGHT_CHROMIUM_PATH=<pfad-zu-chromium> npm run test:e2e`.

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

## Bekannte Lücke: kein Mehrbrowser-Test

Alle bisherigen UI-Prüfungen liefen ausschließlich gegen Chromium — das ist die einzige Browser-Engine, die in der aktuellen Entwicklungsumgebung installiert ist (kein Firefox/WebKit verfügbar, kein Nachinstallieren vorgesehen). Für ein VPN-only-Einzelnutzer-Tool, dessen Nutzer sein eigenes Browser-Setup kennt, ein bewusst niedrig priorisierter Punkt — aber ehrlich als Lücke vermerkt statt stillschweigend als "geprüft" behauptet. Bei Bedarf: lokal mit installiertem Firefox/WebKit nachholen, dann hier den Stand aktualisieren.

## QS-Historie

Statt eines separaten, manuell gepflegten QS-Protokolls dient die GitHub-PR-Historie als QS-Record: jeder gemergte PR trägt seine Test-/Build-/Lint-Ergebnisse in der Beschreibung, dauerhaft einsehbar. Größere QS-Durchläufe (Security-/Code-Qualität-/UX-Audit, Tool-Ökosystem-Analyse) sind zusätzlich als Artefakte dokumentiert und ihre konkreten Funde in [`docs/releases/CHANGELOG.md`](../releases/CHANGELOG.md) nachvollziehbar.
