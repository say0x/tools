# QA & Testing

## Philosophie

Priorität nach Risiko, nicht nach Vollständigkeit um ihrer selbst willen: Rechenkern (`src/server/calc/`) zuerst und am gründlichsten, weil ein stiller Rechenfehler dort am teuersten wäre und am schwersten auffällt. UI-Komponenten zuletzt, weil sie bei jeder Änderung ohnehin visuell geprüft werden.

## Automatisierte Tests

- **Rechenkern**: 18 Testdateien (Vitest), inklusive `src/server/calc/__tests__/engine.test.ts` als Referenzobjekt-Test (konkrete Zahlen-Assertions auf jedes Ergebnisfeld von `berechneObjekt()`). Deckt Renditekennzahlen, Tilgungsplan, Steuer-Näherungen, Vermögensverlauf, Verhandlungsargumente, Annahmen-Warnungen, Exit-Szenario ab.
- **Datenverarbeitung**: `src/server/data/mappers.test.ts` (Property-Formular → Prisma-Form-Splitting) und `src/server/data/import-dedup.test.ts` (Dedup-Entscheidung des Import-Skripts) — ergänzt im Audit 2026-08-22, vorher ungetestet trotz geteilter Nutzung zwischen UI-Actions und Bulk-Import.
- **Server Actions**: bewusst nicht flächendeckend getestet — meist dünne Prisma-Orchestrierung über bereits getestete Rechenkern-Funktionen. `property-schema.test.ts` deckt die Zod-Validierung ab.
- **CI**: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) führt Lint, Tests und Produktions-Build bei jedem Push nach `main` und jedem Pull Request aus.
- **E2E (Playwright)**: [`e2e/`](../../e2e/) — lokale, opt-in Suite gegen eine echte laufende Instanz (kein Teil der GitHub-Actions-CI, die ohne Postgres/laufenden Server läuft). Deckt Erreichbarkeit + Konsolenfehler-Freiheit jeder Hauptroute (`smoke.spec.ts`), automatisierte a11y-Scans je Hauptroute via axe-core (`accessibility.spec.ts`, WCAG 2 A/AA), Tastatur-/ARIA-Verhalten der Hauptnavigation (`nav.spec.ts`) und eine echte Formular-Interaktion (`steuerrechner.spec.ts`). Läuft gegen alle drei Playwright-Engines (Chromium/Firefox/WebKit, `playwright.config.ts`). Voraussetzung: `npm run dev` + lokale Postgres-Instanz laufen auf `http://localhost:3000` (überschreibbar via `E2E_BASE_URL`) sowie einmalig `npx playwright install`. Ausführen: `npm run test:e2e` (alle drei Engines) oder `npm run test:e2e -- --project=chromium` (eine Engine). In Sandboxes ohne `npx playwright install`-Zugriff: `PLAYWRIGHT_CHROMIUM_PATH=<pfad-zu-chromium> npm run test:e2e -- --project=chromium`.

Ausführen: `npm run test` (siehe [`docs/development/setup.md`](../development/setup.md)). Coverage-Report: `npm run test:coverage` (`@vitest/coverage-v8`).

## Test-Coverage (2026-08-28)

Erstmals gemessen statt nur an der Testanzahl ("207 Tests") festgemacht. Gesamtwert bewusst niedrig (~24% Statements) — das ist kein Alarmsignal, sondern folgt direkt aus der oben beschriebenen Philosophie: `server/calc/**` (Rechenkern) liegt bei 95–100% Statements, UI-Komponenten/Seiten sind laut Philosophie bewusst nicht unit-getestet (dafür jetzt die `e2e/`-Suite) und ziehen den Durchschnitt stark nach unten, ohne eine echte Lücke zu sein.

Eine echte, bisher übersehene Lücke fand sich in `server/data/`: `mappers.ts` und `vermoegen.ts` transformieren Prisma-Decimal-Zeilen in die von Calc-Engine/Formularen erwartete `number`-Form (`.toNumber()`-Konvertierung) bzw. berechnen die Positions-/Index-Logik für Finanzübersicht und Szenarien (`immobilienPositionAusErgebnis`) — beides echte, fehleranfällige Logik (ein vergessenes `.toNumber()` bleibt TypeScript-"kompatibel", bricht aber erst zur Laufzeit; die Jahres-Index-Suche im Vermögensverlauf hat mehrere Grenzfälle: Kauf in der Zukunft, Kauf im laufenden Jahr, Kauf länger her als der berechnete Verlauf reicht), aber komplett ungetestet (0% bzw. nur `splitPropertyData` abgedeckt). Ergänzt: `mappers.test.ts` (jetzt 100% Statements) und neu `vermoegen.test.ts`.

**Bewusst nicht nachgezogen**: `server/data/reference-data.ts` (`ladeReferenceDataSnapshot`/`ladeStandardwerte`) — strukturell ähnlich (Decimal-Konvertierung + Fallback-Defaults), aber direkte `prisma.*.findMany()`-Aufrufe ohne bestehende Mocking-Infrastruktur in der Suite; und `server/actions/*.ts` — bereits als "bewusst nicht flächendeckend getestet" dokumentiert (dünne Prisma-Orchestrierung über bereits getestete Rechenkern-Funktionen).

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

## Type-Safety-Audit (2026-08-28)

Vollständige Durchsuchung des Quellcodes (`src/**/*.{ts,tsx}`, `src/generated/` ausgeschlossen — Prisma-Generator-Output, nicht Projekt-Code) nach den drei üblichen TypeScript-"Fluchttüren": `any`/`as any`, `as Type`-Assertions und non-null-Assertions (`!`).

- **`any`/`as any`**: null Treffer im eigenen Anwendungscode. Alle ursprünglich gefundenen ~45 Treffer lagen ausschließlich in `src/generated/prisma/` (Promise-artige `then`/`catch`-Typisierungen und interne Typ-Maschinerie des Prisma-Generators) — kein von den Projektautoren geschriebener oder änderbarer Code.
- **Non-null-Assertions (`!`)**: ein einziger Treffer im gesamten Projekt, in `src/server/calc/exit/exit-szenario.test.ts:58` (`result!.erloesVorSteuerEuro`) — nach einem vorangehenden `expect(result).not.toBeNull()` im selben Testfall, also faktisch abgesichert. Im produktiven Anwendungscode kein einziger Treffer.
- **`as Type`-Assertions**: 11 Treffer im Anwendungscode, alle geprüft — jeder ist entweder eine unvermeidbare DOM-API-Notwendigkeit (`e.target as Node` in `Nav.tsx` für Click-Outside; `e.target.value as Besitzstatus`/`as Bundesland | null` etc. bei `<select>`-onChange-Handlern in `FinanzuebersichtClient.tsx`/`StandardwerteCard.tsx`), ein von react-hook-form erzwungenes Pattern (`issue.path.join(".") as FieldPath<SzenarioFormValues>` in `SzenarioClient.tsx` für dynamische Zod→RHF-Fehlerpfade; `{ ...getValues(), ...watched } as PropertyFormValues` in `PropertyForm.tsx`, laufzeit-abgesichert durch umgebendes try/catch), eine algebraisch wahre Aussage gegen eine bekannte TypeScript-Lücke (`Object.fromEntries(...) as ReferenceDataSnapshot[...]` dreimal in `reference-data.ts` — `Object.fromEntries` verliert grundsätzlich spezifische Key-Typen, obwohl die Quelle (`BUNDESLAENDER`/`GEWERKE`) exakt die Zielkeys durchläuft) oder laufzeit-abgesichert vor der Verwendung (`form-errors.ts`s rekursiver Fehlerbaum-Walker prüft `typeof`/`in` vor jedem Cast).

Kein Fix nötig — keiner der gefundenen Treffer maskiert einen echten Typ-Mismatch oder ein Laufzeitrisiko. Der kalkulationslastige Charakter des Projekts (explizite `Decimal.toNumber()`-Konvertierungen statt impliziter Zahl-Koerzion, siehe Task #51) und die durchgängige Nutzung von Zod-Validierung an den Systemgrenzen erklären, warum unsichere Typ-Umgehungen hier nicht nötig waren.

## Dead-Code-Sweep (2026-08-28)

Vollständige Durchsuchung mit `knip` (Unused-Files/-Exports/-Dependencies-Analyse, per `npx` ohne feste Projekt-Abhängigkeit ausgeführt) — jeder gemeldete Fund einzeln geprüft, bevor etwas entfernt wurde.

**Echte Funde, behoben:**
- `engine.ts` importierte `berechneGesamtinvestition` aus `darlehen.ts` ausschließlich, um es unter der Engine-Fassade erneut zu exportieren (`export { berechneGesamtinvestition }`) — nirgends im Projekt über diesen Weg importiert (Tests nutzen `./darlehen` direkt). Re-Export entfernt.
- `finanzuebersicht.ts`s Typ-Re-Export-Zeile enthielt `SparpositionArt`, das aber ausschließlich direkt aus `finanzuebersicht-schema.ts` importiert wird (`server/data/vermoegen.ts`), nie über die Action-Fassade — aus der Re-Export-Zeile entfernt (die beiden tatsächlich genutzten Typen bleiben).
- `ExportedDaten` (`export.ts`) — abgeleiteter Rückgabetyp von `exportiereAlleDaten()`, aber nirgends importiert (`ExportButton.tsx` nutzt das Ergebnis nur inline). Entfernt.
- `SzenarioAenderungTyp` (`szenario-schema.ts` + Re-Export in `szenario.ts`) — weder exportiert noch innerhalb der eigenen Datei genutzt (das abgeleitete `SzenarioAenderungFormValues` baut nicht darauf auf). Entfernt.
- `pg` und `@types/pg` als direkte Dependencies — `@prisma/adapter-pg` bringt `pg` bereits selbst als eigene direkte Abhängigkeit mit; der Projektcode importiert `pg` nirgends direkt (nur die Adapter-Konfiguration via `PrismaPg({ connectionString })`). Aus `package.json` entfernt.

**Geprüft und bewusst nicht verändert (false positives von `knip`):**
- `@prisma/client` als "unused dependency" gemeldet, ist aber ein echtes Laufzeit-Requirement — der generierte Prisma-Client importiert `@prisma/client/runtime/client` direkt. `knip` verfolgt generierten Code nicht.
- Vier Konstanten (`AFA_SATZ_STANDARD_PROZENT`, `AFA_SATZ_ALTBAU_PROZENT`, `AFA_ALTBAU_GRENZJAHR`, `ESTG_ZONEN`) und 13 Typen aus `server/calc/` als "unused" gemeldet — alle werden innerhalb ihrer eigenen Datei bzw. strukturell in einem tatsächlich verwendeten übergeordneten Typ genutzt (z. B. `Sanierungsmodus`/`Verglasungsart`/`PropertyExitInput`/`UserLiabilityInput` als Felder von `PropertyInput`/`ProfileInput`, die einzelnen `AnnahmenWarnung*`/`Verhandlungsargument*`-Interfaces als Varianten der Union-Typen `AnnahmenWarnung`/`Verhandlungsargument`). `knip` erkennt strukturelle Typnutzung nicht als "Verwendung" des benannten Exports — kein echter Dead Code, nur ein breiteres API-Surface als nötig. Unverändert gelassen, um den Fund nicht mit kosmetischen `export`-Entfernungen an tatsächlich genutztem Code aufzublähen.

Verifiziert nach jeder Änderung: `npx tsc --noEmit`, `npm run lint`, `npx vitest run` (207/207), `npm run build` — alle grün.

## Docs-Aktualitäts-Sweep (2026-08-28)

Vollständiger Abgleich der `docs/`-Baumstruktur gegen den tatsächlichen aktuellen Code-Stand (nicht gegen den Stand zum jeweiligen Schreibzeitpunkt) — Migrationsanzahl, Testdateien-Anzahl, Zeilenzahlen, Markdown-Link-Ziele.

**Gefunden und behoben:**
- `docs/releases/CHANGELOG.md`: größter Fund. Der Versionsbump auf `0.2.0-20260823` geschah bereits mit PR #22, aber ohne eigenen Changelog-Eintrag — die folgenden 49 gemergten PRs (drei vollständige Audit-Serien) blieben komplett uneinsortiert, obwohl `docs/`s eigenes Prinzip ("jeder gemergte PR ... dauerhaft einsehbar", siehe QS-Historie unten) genau das vorsieht. Neuer `## [0.2.0]`-Abschnitt ergänzt (#22–#71, chronologisch, nur PR-Titel — kein rückwirkend erfundener Detailgrad, analog zum bestehenden Prinzip unter "Vor diesem Changelog"). PR-Nummer-zu-Inhalt-Zuordnung einzeln gegen `git log` verifiziert (nicht aus dem Gedächtnis übernommen).
- `docs/database/schema.md`: "22 inkrementelle Migrationen" → tatsächlich 23 (`prisma/migrations/` gezählt).
- `docs/architecture/decisions/0001-framework-freier-rechenkern.md` und `docs/qa/overview.md`: widersprüchliche Testdateien-Zahlen für den Rechenkern (16 bzw. 20) — tatsächlich 18 (`find src/server/calc -name "*.test.ts"` gezählt), beide korrigiert.
- `docs/tools/immobilien-rechner.md`: `PropertyForm.tsx` mit "832 Zeilen" referenziert, tatsächlich inzwischen 745 Zeilen (weitere Extraktionen seit der letzten Doku-Aktualisierung) — korrigiert. Die historischen Zeilenzahlen im CHANGELOG-Eintrag zu PR #18 ("1072 auf 832 Zeilen") und die "Split 2026-08-23"-Notiz in dieser Datei blieben unverändert, da sie den Stand zum damaligen Zeitpunkt korrekt beschreiben, keine Live-Aussage über den heutigen Stand sind.
- `eslint.config.mjs`: vier Referenzen auf `docs/immobilien-rechner.md` (Kommentar + drei Lint-Fehlermeldungen) — Datei liegt seit der Doku-Restrukturierung (#12) unter `docs/tools/immobilien-rechner.md`. Betraf reale, dem Nutzer angezeigte ESLint-Fehlermeldungen, nicht nur einen Kommentar.

**Geprüft, keine weiteren Funde:** alle 112 Markdown-Links im Repo (`docs/`, `eslint.config.mjs`, `README.md`) programmatisch gegen das Dateisystem aufgelöst — sonst nichts gebrochen. `docs/architecture/overview.md`, `docs/security/overview.md`, `docs/development/setup.md`, `docs/deployment/docker.md`, `docs/tools/overview.md`, `docs/tools/weitere-rechner.md` gegen den aktuellen Tech-Stack/Datei-/Skript-Bestand abgeglichen — keine weiteren Abweichungen.

Verifiziert nach jeder Änderung: `npx tsc --noEmit`, `npm run lint`, `npx vitest run` (207/207) — alle grün (reine Doku-/Konfig-Änderung, kein Anwendungscode betroffen).

## QS-Historie

Statt eines separaten, manuell gepflegten QS-Protokolls dient die GitHub-PR-Historie als QS-Record: jeder gemergte PR trägt seine Test-/Build-/Lint-Ergebnisse in der Beschreibung, dauerhaft einsehbar. Größere QS-Durchläufe (Security-/Code-Qualität-/UX-Audit, Tool-Ökosystem-Analyse) sind zusätzlich als Artefakte dokumentiert und ihre konkreten Funde in [`docs/releases/CHANGELOG.md`](../releases/CHANGELOG.md) nachvollziehbar.
