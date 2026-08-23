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

## Version

`0.2.0-20260823` (SemVer + CalVer-Datumssuffix, siehe [`docs/releases/CHANGELOG.md`](docs/releases/CHANGELOG.md)). Ein Deploy, ein Build — keine unabhängigen Tool-Versionen, siehe [ADR-0007](docs/architecture/decisions/0007-monolith-statt-microservices.md).

## Dokumentation

Diese README gibt den schnellen Einstieg — Tech-Stack, lokale Entwicklung, Deployment in Kurzform. Ausführliche Referenz (Architektur, Datenbank, Security, QA, alle Tool-Details, Changelog) steht strukturiert unter [`docs/`](docs/README.md):

| | |
|---|---|
| [`docs/architecture/`](docs/architecture/overview.md) | Systemarchitektur + [Architecture Decision Records](docs/architecture/decisions/) |
| [`docs/tools/`](docs/tools/overview.md) | Tool-Inventar, Überschneidungs-Check, sowie die Detail-Referenz je Tool |
| [`docs/database/`](docs/database/schema.md) | Datenmodell-Landkarte |
| [`docs/deployment/`](docs/deployment/docker.md) | Docker, Netzwerk, CI |
| [`docs/development/`](docs/development/setup.md) | Setup, Tests, Import-Skript |
| [`docs/security/`](docs/security/overview.md) | Bedrohungsmodell, Audit-Stand |
| [`docs/qa/`](docs/qa/overview.md) | Testphilosophie, Abdeckung |
| [`docs/releases/CHANGELOG.md`](docs/releases/CHANGELOG.md) | Änderungshistorie |

In den jeweiligen Quelldateien steht oben ein Kommentar, welche `docs/`-Seite dazugehört — bei Änderungen an der Logik dort zuerst nachsehen, ob die Doku noch stimmt.

## Schnellstart

Voraussetzungen: Node.js 22+, eine laufende PostgreSQL-Instanz. Ausführliche Anleitung inkl. Tests und Import-Skript: [`docs/development/setup.md`](docs/development/setup.md).

```bash
npm install
cp .env.example .env   # DATABASE_URL ggf. anpassen
npx prisma migrate dev
npx prisma db seed     # befüllt die Referenzdaten-Tabellen mit Startwerten
npm run dev
```

## Deployment im Homelab (`tools.sayox.de`)

```bash
docker compose up -d --build
```

Details, Netzwerk-Absicherung und CI: [`docs/deployment/docker.md`](docs/deployment/docker.md).

## Projektstruktur (Auszug)

Vollständig mit Erläuterung je Verzeichnis: [`docs/development/setup.md`](docs/development/setup.md#projektstruktur-auszug).

```
prisma/schema.prisma          Datenmodell (Asset, UserProfile, Property, Reference*)
src/server/calc/                Framework-freie Berechnungs-Engine + Tests
src/server/actions/            Server Actions (Profil, Objekt-CRUD, Referenzdaten)
src/app/                       10 Tools — Übersicht: docs/tools/overview.md
docs/                          Ausführliche Referenzdokumentation (siehe "Dokumentation" oben)
```

## Bekannte Vereinfachungen

Vollständige, nach Themenblock sortierte Listen stehen in den `docs/tools/*.md`-Dateien:

- Immobilien-Rechner (Tilgungsplan/Anschlussfinanzierung, Steuer-Näherungen, Referenzdaten, Vermögensverlauf, Verhandlungsargumente, Gewerke, AfA, Affordability, Kapitaleffizienz, Miteigentumsanteil, Objekt-Bibliothek/Vergleich, Duplizieren, Import-Skript, Exit-Szenario) → [`docs/tools/immobilien-rechner.md`](docs/tools/immobilien-rechner.md#bekannte-vereinfachungen-immobilien-rechner)
- Finanzübersicht, Besitzstatus-System, Szenarien (inkl. Immobilienwert-Referenzlinie) → [`docs/tools/finanzuebersicht-und-szenarien.md`](docs/tools/finanzuebersicht-und-szenarien.md)
- Sparziel-Rechner, Steuerrechner, Kreditvergleich, Kaufen-oder-Anlegen, Daten-Backup, Dashboard, geteilte Chart-/UI-Bausteine (`loading.tsx`, `next/dynamic`, Farbzuweisung, Navigation) → [`docs/tools/weitere-rechner.md`](docs/tools/weitere-rechner.md)
