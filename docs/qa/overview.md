# QA & Testing

## Philosophie

Priorität nach Risiko, nicht nach Vollständigkeit um ihrer selbst willen: Rechenkern (`src/server/calc/`) zuerst und am gründlichsten, weil ein stiller Rechenfehler dort am teuersten wäre und am schwersten auffällt. UI-Komponenten zuletzt, weil sie bei jeder Änderung ohnehin visuell geprüft werden.

## Automatisierte Tests

- **Rechenkern**: 20 Testdateien (Vitest), inklusive `src/server/calc/__tests__/engine.test.ts` als Referenzobjekt-Test (konkrete Zahlen-Assertions auf jedes Ergebnisfeld von `berechneObjekt()`). Deckt Renditekennzahlen, Tilgungsplan, Steuer-Näherungen, Vermögensverlauf, Verhandlungsargumente, Annahmen-Warnungen, Exit-Szenario ab.
- **Datenverarbeitung**: `src/server/data/mappers.test.ts` (Property-Formular → Prisma-Form-Splitting) und `src/server/data/import-dedup.test.ts` (Dedup-Entscheidung des Import-Skripts) — ergänzt im Audit 2026-08-22, vorher ungetestet trotz geteilter Nutzung zwischen UI-Actions und Bulk-Import.
- **Server Actions**: bewusst nicht flächendeckend getestet — meist dünne Prisma-Orchestrierung über bereits getestete Rechenkern-Funktionen. `property-schema.test.ts` deckt die Zod-Validierung ab.
- **CI**: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) führt Lint, Tests und Produktions-Build bei jedem Push nach `main` und jedem Pull Request aus.

Ausführen: `npm run test` (siehe [`docs/development/setup.md`](../development/setup.md)).

## Manuelle QS (diese Session)

Änderungen wurden durchgehend gegen die laufende App geprüft (Playwright, Chromium): Formular-Interaktionen, Live-Neuberechnung, Fokus-Ring-Verhalten, Konsolen-/Seitenfehler, echte Testdaten aus der lokalen Datenbank statt nur Typprüfung.

## Bekannte Lücke: kein Mehrbrowser-Test

Alle bisherigen UI-Prüfungen liefen ausschließlich gegen Chromium — das ist die einzige Browser-Engine, die in der aktuellen Entwicklungsumgebung installiert ist (kein Firefox/WebKit verfügbar, kein Nachinstallieren vorgesehen). Für ein VPN-only-Einzelnutzer-Tool, dessen Nutzer sein eigenes Browser-Setup kennt, ein bewusst niedrig priorisierter Punkt — aber ehrlich als Lücke vermerkt statt stillschweigend als "geprüft" behauptet. Bei Bedarf: lokal mit installiertem Firefox/WebKit nachholen, dann hier den Stand aktualisieren.

## QS-Historie

Statt eines separaten, manuell gepflegten QS-Protokolls dient die GitHub-PR-Historie als QS-Record: jeder gemergte PR trägt seine Test-/Build-/Lint-Ergebnisse in der Beschreibung, dauerhaft einsehbar. Größere QS-Durchläufe (Security-/Code-Qualität-/UX-Audit, Tool-Ökosystem-Analyse) sind zusätzlich als Artefakte dokumentiert und ihre konkreten Funde in [`docs/releases/CHANGELOG.md`](../releases/CHANGELOG.md) nachvollziehbar.
