# Datenbank-Schema

Quelle der Wahrheit ist immer [`prisma/schema.prisma`](../../prisma/schema.prisma) — dieses Dokument ist eine Landkarte dafür, keine Kopie. Bei Widerspruch gewinnt das Schema, dieses Dokument ist dann zu korrigieren.

## Aufbau in drei Gruppen

**Cross-Tool-Fundament**
- `Asset` — polymorphe Basis für jede Anlageklasse ([ADR-0003](../architecture/decisions/0003-polymorphes-asset-modell.md)). `AssetType`-Enum: `IMMOBILIE`, `WERTPAPIERDEPOT`, `TAGESGELD`. `Besitzstatus`-Enum (`BESITZE_ICH`, `POTENZIELLE_ANSCHAFFUNG`, `SPEKULATION`, `VERKAUFT`, `ARCHIVIERT`) steuert einheitlich, ob ein Asset automatisch im Vermögen mitzählt.
- `UserProfile` — Singleton (kein Auth/Multi-Tenancy, [ADR-0006](../architecture/decisions/0006-kein-app-level-login.md)), Einkommen und Affordability-Schwellen. `UserLiability` (1:n) für bestehende Kredite/Verbindlichkeiten.

**Immobilien** (`Property` + 1:1-Relationen `PropertyFinancing`, `PropertyExit`, 1:n `PropertyGewerk`) — vollständige Feldreferenz in [`docs/tools/immobilien-rechner.md`](../tools/immobilien-rechner.md).

**Wertpapiere & Tagesgeld** (`Wertpapierposition`, `Tagesgeldkonto`, je 1:1 an `Asset`) sowie **Referenzdaten** (`ReferenceGrunderwerbsteuer`, `ReferenceMietpreis`, `ReferenceGewerkKosten`, `ReferenceInstandhaltungssatz`, `ReferenceNutzungsdauer`, `ReferenceKaufnebenkostenDefaults`, `ReferenceKaufpreisfaktor`, `ReferenceBodenrichtwert`) — editierbare Startwerte, kein Live-Feed. `ReferenceBodenrichtwert` (Bundesland+Lagetyp, aktuell nur Schleswig-Holstein befüllt) ist die einzige Ausnahme mit einem echten amtlichen Ursprung (BORIS-D/BORIS-SH) statt einer frei geschätzten Startannahme — siehe [`docs/tools/immobilien-rechner.md`](../tools/immobilien-rechner.md).

**Szenarien** (`Szenario` + 1:n `SzenarioAenderung`) — siehe [ADR-0004](../architecture/decisions/0004-szenario-system-ohne-mutation.md): verändert nie die obigen Tabellen.

## Konventionen

- `id`: `cuid()`, durchgängig.
- `createdAt`/`updatedAt`: durchgängig, `updatedAt` per `@updatedAt`.
- `onDelete: Cascade` auf jeder Fremdschlüssel-Relation — ein gelöschtes `Asset` räumt seine gesamte Detailstruktur (Property + Financing + Gewerke + Exit, oder Wertpapierposition/Tagesgeldkonto) sowie jede referenzierende `SzenarioAenderung` mit auf. Keine verwaisten Zeilen strukturell möglich.
- Geld-/Prozentfelder: `Decimal` (Geldbeträge `Decimal(14,2)`, Prozent-/Faktor-Felder `Decimal(7,4)`) — seit der Backend-Audit-Serie (2026-08-28), vorher bewusst `Float`. `wohnflaeche`/`gebaeudeWohnflaecheGesamt`/`grundstuecksflaecheQm` (m², keine Geld-/Prozentgröße) bleiben `Float`. Die App-Schicht (Calc-Engine, Zod-Schemas, Formulare) arbeitet weiterhin mit `number` — die Konvertierung passiert explizit an der Datenzugriffsgrenze (`src/server/data/mappers.ts` u. a.), nicht über eine Prisma-Client-Extension: `$extends`-Result-Overrides hängen jeder Zeile node:util's `inspect.custom`-Symbol an, was React Server Components beim Übergeben an Client-Komponenten als "kein plain object" ablehnen.
- Keine DB-seitigen `CHECK`-Constraints für Wertebereiche (z. B. `zustand` 1–6) — Validierung liegt vollständig in den Zod-Schemas der Server Actions. Für eine Single-Writer-App (nur diese Next.js-App schreibt je in die DB) ein bewusst akzeptierter Kompromiss, kein Versehen.

## Bekannte, kleine Lücken (aus dem Audit, nicht kritisch)

- Kein Audit-/History-Log über Änderungen hinweg — für ein Einzelnutzer-Tool nicht als nötig bewertet.

## Migrationen

26 inkrementelle Migrationen unter [`prisma/migrations/`](../../prisma/migrations/), chronologisch von der initialen Immobilien-Struktur bis zur `ReferenceBodenrichtwert`-Tabelle. Migrationsnamen sind bewusst beschreibend (`sondertilgung`, `asset_besitzstatus`, `szenario_system`, `money_fields_decimal`, …) statt generisch nummeriert.
