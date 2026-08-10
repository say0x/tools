# tools

Interne Tool-Suite von Dennis Kohnke — nicht öffentlich, für den Eigenbedarf im Homelab (`sayox.de`). Startet mit dem **Immobilien-Rechner**: Objekte erfassen, Kennzahlen live berechnen, speichern und vergleichen. Weitere Tools (Zinsrechner, Depot-Tracker, "Finanzielle Freiheit"-Dashboard) sollen auf demselben `Asset`-Datenmodell aufbauen.

## Tech-Stack

- **Next.js 16** (App Router, TypeScript, Server Actions)
- **PostgreSQL** + **Prisma 7** (mit `@prisma/adapter-pg`, kein Rust-Query-Engine-Binary nötig)
- **Tailwind CSS 4**, eigene schlanke UI-Komponenten (shadcn/ui war zum Zeitpunkt der Erstellung über die Netzwerk-Policy nicht erreichbar)
- **Recharts** für Grafiken, **react-hook-form** + **zod** für Formulare/Validierung
- **Vitest** für die Berechnungs-Engine (`src/server/calc`)

## Architekturprinzip

Die Datenbank speichert ausschließlich Rohdaten. Alle Kennzahlen (Renditen, Tilgungsplan, Kostenschätzungen, Ampel-Status, Break-even-Kaufpreis) werden zur Laufzeit von der reinen, framework-freien Berechnungs-Engine unter `src/server/calc/` hergeleitet — sie hat keine Prisma- oder React-Abhängigkeit und läuft identisch server- wie clientseitig (für Live-Neuberechnung ohne Server-Roundtrip direkt im Formular).

Wiederkehrendes Datenmodell-Muster **"computed-with-override"**: ein Wertefeld + ein `xOverride`-Boolean. Ist der Override aus, berechnet die Engine einen Vorschlag (z. B. Grunderwerbsteuer aus dem Bundesland, Instandhaltungsrücklage aus Baujahr + Bauteilzustand); ist er an, gilt der manuell eingetragene Wert.

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

## Deployment im Homelab (`tools.sayox.de`)

```bash
docker compose up -d --build
```

Das startet Postgres + die App (`Dockerfile`, Next.js `output: 'standalone'`). Der Container führt beim Start automatisch `prisma migrate deploy` aus (`docker-entrypoint.sh`), bevor der Server hochfährt.

**Einmalig nach dem ersten Deploy** die Referenzdaten befüllen:

```bash
docker compose exec app npx prisma db seed
```

(Danach nicht erneut ausführen, sonst werden manuelle Anpassungen auf der Referenzdaten-Seite überschrieben — der Seed läuft bewusst nicht automatisch bei jedem Start.)

Die App ist intern unter Port 3000 erreichbar; im Homelab per Reverse-Proxy auf `tools.sayox.de` mappen. Kein eigenes App-Level-Login eingebaut — die Absicherung erfolgt über das Docker-/Homelab-Netz bzw. den Reverse-Proxy (VPN-only o. ä.), da das Tool bewusst nicht öffentlich sein soll.

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
src/app/profil/                Nutzerprofil (Einkommen, Affordability-Schwellen)
```

## Bekannte Vereinfachungen

- Tilgungsplan nimmt einen konstanten Zins über den gesamten Betrachtungszeitraum an (keine Anschlussfinanzierung nach Ablauf der Zinsbindung).
- Steuerliche Berechnungen (Grenzsteuersatz nach §32a EStG, AfA, Spekulationssteuer) sind Näherungen für die Investitionsentscheidung, keine Steuerberatung — Zonenwerte in `src/server/calc/tax/estg-zonen.ts` vor wichtigen Entscheidungen gegen die aktuelle BMF-Veröffentlichung prüfen.
- Referenzdaten (Grunderwerbsteuer, Mietpreise, Sanierungskosten, Instandhaltungssätze, Notar-/Grundbuch-Standardsätze) sind Startwerte ohne Live-Anbindung, aber auf `/immobilien/referenzdaten` frei editierbar.
- Cashflow-Fortschreibung über die Jahre (Vermögensverlauf-Chart) skaliert den Jahr-1-Cashflow pauschal mit der Mietsteigerung hoch, statt Zinsanteil/AfA/Grenzsteuersatz für jedes Jahr einzeln neu zu berechnen — für einen 50-Jahres-Trend eine grobe Näherung, keine Jahr-für-Jahr-Simulation.
- Das zu versteuernde Einkommen (zvE) wird ohne Override grob aus dem Brutto-Einkommen geschätzt (Pauschbeträge für Werbungskosten/Sonderausgaben, ~20% pauschale Vorsorgeaufwendungen) — für Genauigkeit das echte zvE aus dem Steuerbescheid manuell eintragen.
- Grundsteuer wird als vollständig umlagefähig (cash-neutral) behandelt und nicht automatisch berechnet, da der Betrag vom Hebesatz der jeweiligen Gemeinde abhängt.
