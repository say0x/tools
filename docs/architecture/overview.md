# Architektur-Übersicht

Große Linien der Systemarchitektur. Details zu einem einzelnen Tool stehen unter [`docs/tools/`](../tools/), Begründungen einzelner Entscheidungen unter [`docs/architecture/decisions/`](decisions/).

## System auf einen Blick

Ein Next.js-16-Monolith (App Router, TypeScript, Server Actions), eine PostgreSQL-Datenbank, ein Docker-Image, ein Deploy-Ziel (`tools.sayox.de`, VPN-only). Kein separates API-Backend, kein Microservice-Schnitt — siehe [ADR-0007](decisions/0007-monolith-statt-microservices.md).

```
┌─────────────────────────────────────────────────────────┐
│  src/app/**                 UI: Server Components +      │
│                              Client Components (*Client)  │
├─────────────────────────────────────────────────────────┤
│  src/server/actions/**      Server Actions — einzige       │
│                              Schreib-Schnittstelle          │
│                              (Zod-Validierung → Prisma)     │
├─────────────────────────────────────────────────────────┤
│  src/server/data/**         Lese-Zugriffe + Mapper         │
│                              (Prisma-Row → Calc-Engine-Typ) │
├─────────────────────────────────────────────────────────┤
│  src/server/calc/**         Framework-freier Rechenkern —  │
│                              läuft identisch Server/Client  │
│                              (ADR-0001)                     │
├─────────────────────────────────────────────────────────┤
│  prisma/schema.prisma       Rohdaten-Modell, keine          │
│                              abgeleiteten Kennzahlen         │
└─────────────────────────────────────────────────────────┘
```

**Kernprinzip**: die Datenbank speichert ausschließlich Eingaben. Jede abgeleitete Zahl (Rendite, Tilgungsplan, Vermögensverlauf, Ampel-Status) entsteht zur Laufzeit aus `berechneObjekt()` bzw. den verwandten `berechne*`-Funktionen — nie als gespeicherte, potenziell veraltete Spalte.

## Datenmodell-Kern

`Asset` ist die gemeinsame Basis für jede Anlageklasse (Immobilie, Wertpapierdepot, Tagesgeld) — ein `besitzstatus`-Enum steuert einheitlich, ob ein Asset automatisch ins Vermögen (Finanzübersicht) einfließt. Details und die Begründung: [ADR-0003](decisions/0003-polymorphes-asset-modell.md), vollständiges Schema unter [`docs/database/schema.md`](../database/schema.md).

## Zwei Berechnungs-Philosophien, bewusst getrennt

- **Immobilien-Rechner** (`docs/tools/immobilien-rechner.md`): objektbezogene Einzelkennzahlen (Rendite, Cashflow, Ampel-Status) für eine Kaufentscheidung.
- **Finanzübersicht/Szenarien** (`docs/tools/finanzuebersicht-und-szenarien.md`): Cashflow-only-Vermögensverlauf über alle besessenen Assets hinweg — Immobilienwerte fließen bewusst nicht ein, siehe [ADR-0002](decisions/0002-cashflow-only-finanzuebersicht.md).

Beide teilen sich denselben Rechenkern (`berechneObjekt`, `berechneSparpositionsverlauf`), beantworten aber unterschiedliche Fragen — siehe [`docs/tools/overview.md`](../tools/overview.md) für den vollständigen Tool-Vergleich.

## Wiederkehrende Muster

- **computed-with-override** ([ADR-0005](decisions/0005-computed-with-override-pattern.md)): ein Wertefeld + `xOverride`-Boolean, durchgängig für herleitbare, aber überschreibbare Eingaben.
- **Nicht-mutierende Szenarien** ([ADR-0004](decisions/0004-szenario-system-ohne-mutation.md)): "Was wäre wenn"-Rechnungen verändern nie echte Asset-Daten.
- **Kein App-Level-Login** ([ADR-0006](decisions/0006-kein-app-level-login.md)): Absicherung über das VPN-Netzwerk statt über Anwendungscode.

## Tech-Stack

Next.js 16 · React 19 · TypeScript · PostgreSQL + Prisma 7 (`@prisma/adapter-pg`) · Tailwind CSS 4 · Recharts · react-hook-form + Zod · Vitest (Rechenkern) · GitHub Actions (Lint/Test/Build bei jedem Push/PR).
