# tools

Interne Tool-Suite von Dennis Kohnke — nicht öffentlich, für den Eigenbedarf im Homelab (`sayox.de`). Startet mit dem **Immobilien-Rechner**: Objekte erfassen, Kennzahlen live berechnen, speichern und vergleichen. Die **Finanzübersicht** aggregiert Wertpapierdepots, Tagesgeld und den Cashflow ausgewählter Immobilien auf demselben `Asset`-Datenmodell zu einem gemeinsamen Verlauf des tatsächlich verfügbaren Geldes (nominal & inflationsbereinigt) — Immobilienwerte selbst fließen dabei bewusst nicht ein, nur der Cashflow, den sie erwirtschaften. **Szenarien** beantworten "was wäre, wenn…?" (Immobilie kaufen/verkaufen, Sparrate ändern, einmalige Anschaffung), ohne jemals die echten Asset-Daten zu verändern — ein Szenario ist immer Basiszustand + Änderungen, nur zur Laufzeit kombiniert. Der **Sparziel-Rechner** ist ein freistehender Zinseszins-Rechner (Kapitalverlauf einer Sparrate über Zeit, Jahr bis zu einem Zielbetrag) ohne eigene Datenhaltung. Der **Steuerrechner** ist ein freistehender Grenzsteuersatz-Rechner, unabhängig vom hinterlegten Profil. Der **Kreditvergleich** rechnet zwei Finanzierungsangebote nebeneinander durch, ganz ohne Objekt. **Kaufen oder Anlegen?** vergleicht ein konkretes Objekt aus der Bibliothek gegen die Alternative, dasselbe Eigenkapital stattdessen in ein Wertpapierdepot zu stecken. Die Startseite (`/`) zeigt ein Dashboard mit den wichtigsten Kennzahlen über alle Tools hinweg (Immobilien im Besitz, Bargeld & Depots, monatlicher Immobilien-Cashflow, Anzahl Szenarien, Notgroschen-Reichweite).

## Tech-Stack

- **Next.js 16** (App Router, TypeScript, Server Actions)
- **PostgreSQL** + **Prisma 7** (mit `@prisma/adapter-pg`, kein Rust-Query-Engine-Binary nötig)
- **Tailwind CSS 4**, eigene schlanke UI-Komponenten (shadcn/ui war zum Zeitpunkt der Erstellung über die Netzwerk-Policy nicht erreichbar)
- **Recharts** für Grafiken, **react-hook-form** + **zod** für Formulare/Validierung
- **Vitest** für die Berechnungs-Engine (`src/server/calc`)

## Architekturprinzip

Die Datenbank speichert ausschließlich Rohdaten. Alle Kennzahlen (Renditen, Tilgungsplan, Kostenschätzungen, Ampel-Status, Break-even-Kaufpreis) werden zur Laufzeit von der reinen, framework-freien Berechnungs-Engine unter `src/server/calc/` hergeleitet — sie hat keine Prisma- oder React-Abhängigkeit und läuft identisch server- wie clientseitig (für Live-Neuberechnung ohne Server-Roundtrip direkt im Formular).

Wiederkehrendes Datenmodell-Muster **"computed-with-override"**: ein Wertefeld + ein `xOverride`-Boolean. Ist der Override aus, berechnet die Engine einen Vorschlag (z. B. Grunderwerbsteuer aus dem Bundesland, Instandhaltungsrücklage aus Baujahr + Bauteilzustand); ist er an, gilt der manuell eingetragene Wert.

## Dokumentation

Diese README gibt das große Bild — Tech-Stack, Setup, Deployment, ein kurzer Überblick pro Tool. Für Details (Schnittstellen/Variablen der Berechnungs-Engine, Modul-Landkarte, alle bekannten Vereinfachungen) gibt es je Themenblock eine eigene Referenzseite unter [`docs/`](docs/), die bei Änderungen mitgepflegt wird statt hier immer weiter anzuwachsen:

- [`docs/immobilien-rechner.md`](docs/immobilien-rechner.md) — die Berechnungs-Engine (`src/server/calc/`): Modul-Landkarte, Ablauf von `berechneObjekt()`, alle Ein-/Ausgabe-Schnittstellen (`PropertyInput`, `ProfileInput`, `ReferenceDataSnapshot`, `CalculationResult`, …) als Tabellen, bekannte Vereinfachungen speziell zum Immobilien-Rechner.
- [`docs/finanzuebersicht-und-szenarien.md`](docs/finanzuebersicht-und-szenarien.md) — Cashflow-only-Philosophie, Besitzstatus-System, geteilte Bausteine zwischen Finanzübersicht und Szenarien, die vier Szenario-Änderungsarten.
- [`docs/weitere-rechner.md`](docs/weitere-rechner.md) — Sparziel-Rechner, Steuerrechner, Kreditvergleich, Kaufen-oder-Anlegen, Daten-Backup, Dashboard, geteilte Chart-/UI-Bausteine.

In den jeweiligen Quelldateien steht oben ein Kommentar, welche `docs/*.md` dazugehört — bei Änderungen an der Logik dort zuerst nachsehen, ob die Doku noch stimmt.

## Lokale Entwicklung

Voraussetzungen: Node.js 22+, eine laufende PostgreSQL-Instanz.

```bash
npm install
cp .env.example .env   # DATABASE_URL ggf. anpassen
npx prisma migrate dev
npx prisma db seed     # befüllt die Referenzdaten-Tabellen mit Startwerten
npm run dev
```

Ohne Docker lässt sich Postgres z. B. so lokal starten:

```bash
docker compose up -d postgres
```

### Tests

```bash
npm run test        # Vitest, insb. der Referenzobjekt-Test in src/server/calc/__tests__/engine.test.ts
```

### CI

`.github/workflows/ci.yml` läuft bei jedem Push nach `main` und bei jedem Pull Request: Lint, Tests, Produktions-Build (der Build-Schritt führt den TypeScript-Check gleich mit aus — ein separater `tsc`-Schritt davor scheitert auf einem frischen Checkout, da `next-env.d.ts` auf `.next/types/*` verweist, das erst der Build selbst erzeugt). Dieselben Prüfungen, die vor jedem Merge in dieser Session ohnehin manuell durchlaufen wurden, jetzt automatisch statt auf Disziplin angewiesen. Kein Postgres-Service nötig (`prisma generate` liest nur das Schema, keine Datenroute wird zur Build-Zeit statisch gerendert).

### Objekte importieren (`data/import-objekte.json`)

Recherchierte Objekte (z. B. von Immobilienportalen zusammengetragen) lassen
sich über eine JSON-Datei einspielen, statt sie einzeln im Formular
anzulegen:

```bash
npm run import:objekte
```

Liest `data/import-objekte.json`, legt für jeden Eintrag ein neues Objekt mit
Standardwerten (`src/lib/property-form-defaults.ts`) als Basis an. Idempotent:
Einträge werden über `quelleUrl` (falls vorhanden) oder sonst über den Namen
dedupliziert — ein erneuter Lauf überspringt bereits importierte Objekte statt
Duplikate anzulegen. Jeder Eintrag sollte im `notizen`-Feld dokumentieren,
welche Werte real aus der Quelle stammen und welche geschätzt wurden (die
Datei ist danach kein Geheimnis — sie landet im Repo und kann jederzeit
erweitert werden).

## Deployment im Homelab (`tools.sayox.de`)

```bash
docker compose up -d --build
```

Das startet Postgres + die App (`Dockerfile`, Next.js `output: 'standalone'`). Der Container führt beim Start automatisch `prisma migrate deploy` aus (`docker-entrypoint.sh`), bevor der Server hochfährt.

Das `Dockerfile` nutzt BuildKit-Cache-Mounts für `npm ci` (`/root/.npm`) und für Next.js' eigenen Build-Cache (`/app/.next/cache`) — dadurch bleiben npm- und Turbopack-Zwischenstände über mehrere `docker compose up -d --build`-Läufe hinweg erhalten (auch wenn sich `package-lock.json` ändert oder ein `docker system prune` den Layer-Cache gelöscht hat), was wiederholte Rebuilds nach einem `git pull` spürbar beschleunigt. Erfordert BuildKit (Standard bei aktuellem Docker Compose).

**Einmalig nach dem ersten Deploy** die Referenzdaten befüllen:

```bash
docker compose exec app npx prisma db seed
```

(Danach nicht erneut ausführen, sonst werden manuelle Anpassungen auf der Referenzdaten-Seite überschrieben — der Seed läuft bewusst nicht automatisch bei jedem Start.)

Die App ist intern unter Port 3000 erreichbar; im Homelab per Reverse-Proxy auf `tools.sayox.de` mappen. Kein eigenes App-Level-Login eingebaut — die Absicherung erfolgt über das Docker-/Homelab-Netz bzw. den Reverse-Proxy (VPN-only o. ä.), da das Tool bewusst nicht öffentlich sein soll. Passend dazu setzt `src/app/layout.tsx` `robots: { index: false, follow: false }` (kein Sitemap/OG-Setup, da nicht für Suchmaschinen/Social-Previews gedacht) und jede Route hat einen eigenen `<title>` (`"%s · tools"`-Template, siehe `metadata`-Exports je `page.tsx`) sowie ein eigenes Favicon (`src/app/icon.png` / `apple-icon.png`, Next-16-App-Icon-Konvention).

## Projektstruktur (Auszug)

```
prisma/schema.prisma          Datenmodell (Asset, UserProfile, Property, Reference*)
prisma/seed.ts                 Startwerte für Referenztabellen
src/server/calc/                Framework-freie Berechnungs-Engine + Tests
src/server/actions/            Server Actions (Profil, Objekt-CRUD, Referenzdaten)
src/server/data/               Prisma-Reads + Mapper zu den Calc-Engine-Typen
src/components/forms/          PropertyForm (Objekt-Formular inkl. Live-Kennzahlen)
src/components/charts/         Recharts-Komponenten
src/app/immobilien/            Objekt-Bibliothek, -Formular, -Vergleich, Referenzdaten
src/app/finanzuebersicht/      Aggregierter Vermögensverlauf über Immobilien, Wertpapiere & Tagesgeld
src/app/szenarien/             "Was wäre wenn"-Szenarien (Basiszustand + Änderungen, verändert nie die echten Daten)
src/app/profil/                Nutzerprofil (Einkommen, Affordability-Schwellen)
src/app/sparziel/              Freistehender Zinseszins-/Sparziel-Rechner, ohne eigene Datenhaltung
src/app/steuerrechner/         Freistehender Grenzsteuersatz-Rechner, ohne eigene Datenhaltung
src/app/kreditvergleich/       Zwei Finanzierungsangebote vergleichen, ohne eigene Datenhaltung
src/app/kaufen-oder-anlegen/   Objekt aus der Bibliothek vs. Alternativanlage desselben Eigenkapitals
src/server/actions/export.ts   Server Action für den JSON-Datenexport (Profil-Seite)
src/app/page.tsx               Dashboard (Kennzahlen über alle Tools hinweg)
src/server/data/vermoegen.ts   Geteilte Asset-Aufbereitung (Immobilien-Cashflow, Sparpositionen) für Finanzübersicht + Szenarien
docs/                          Ausführliche Referenzdokumentation je Themenblock (siehe "Dokumentation" oben)
```

## Bekannte Vereinfachungen

Vollständige, nach Themenblock sortierte Listen stehen in den docs/*.md-Dateien (siehe [Dokumentation](#dokumentation) oben):

- Immobilien-Rechner (Tilgungsplan/Anschlussfinanzierung, Steuer-Näherungen, Referenzdaten, Vermögensverlauf, Verhandlungsargumente, Gewerke, AfA, Affordability, Kapitaleffizienz, Miteigentumsanteil, Objekt-Bibliothek/Vergleich, Duplizieren, Import-Skript) → [`docs/immobilien-rechner.md`](docs/immobilien-rechner.md#bekannte-vereinfachungen-immobilien-rechner)
- Finanzübersicht, Besitzstatus-System, Szenarien (inkl. Immobilienwert-Referenzlinie) → [`docs/finanzuebersicht-und-szenarien.md`](docs/finanzuebersicht-und-szenarien.md)
- Sparziel-Rechner, Steuerrechner, Kreditvergleich, Kaufen-oder-Anlegen, Daten-Backup, Dashboard, geteilte Chart-/UI-Bausteine (`loading.tsx`, `next/dynamic`, Farbzuweisung) → [`docs/weitere-rechner.md`](docs/weitere-rechner.md)
