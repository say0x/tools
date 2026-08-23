# Lokale Entwicklung

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

## Tests

```bash
npm run test        # Vitest, insb. der Referenzobjekt-Test in src/server/calc/__tests__/engine.test.ts
```

Testphilosophie und Abdeckung: [`docs/qa/overview.md`](../qa/overview.md).

## Objekte importieren (`data/import-objekte.json`)

Recherchierte Objekte (z. B. von Immobilienportalen zusammengetragen) lassen sich über eine JSON-Datei einspielen, statt sie einzeln im Formular anzulegen:

```bash
npm run import:objekte
```

Liest `data/import-objekte.json`, legt für jeden Eintrag ein neues Objekt mit Standardwerten (`src/lib/property-form-defaults.ts`) als Basis an. Idempotent: Einträge werden über `quelleUrl` (falls vorhanden) oder sonst über den Namen dedupliziert (`src/server/data/import-dedup.ts`) — ein erneuter Lauf überspringt bereits importierte Objekte statt Duplikate anzulegen. Jeder Eintrag sollte im `notizen`-Feld dokumentieren, welche Werte real aus der Quelle stammen und welche geschätzt wurden (die Datei ist danach kein Geheimnis — sie landet im Repo und kann jederzeit erweitert werden).

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
docs/                          Ausführliche Referenzdokumentation je Themenblock (siehe docs/README.md)
```
