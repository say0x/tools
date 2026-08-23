# ADR-0004 — Szenario-System als Basiszustand + nicht-mutierende Änderungen

**Status**: Accepted

## Context

„Was wäre, wenn ich diese Immobilie kaufe / jene verkaufe / meine Sparrate erhöhe?" ist eine der zentralen Fragen des Tools. Die naive Umsetzung — eine Kopie aller Assets für jedes Szenario anlegen — würde bei jeder Änderung an den echten Daten (neuer Kaufpreis, geänderte Miete) alle Szenario-Kopien veralten lassen, ohne dass das auffällt.

## Decision

Ein Szenario speichert **nie** eigene Asset-Kopien. Es besteht aus einem `startjahr` und einer Liste von `SzenarioAenderung`-Einträgen (`IMMOBILIE_AUFNEHMEN`, `IMMOBILIE_VERKAUFEN`, `SPARRATE_AENDERN`, `EINMALIGE_ANSCHAFFUNG`), die jeweils auf ein echtes Asset per ID verweisen. Die Berechnung liest zur Laufzeit den aktuellen Stand aller Assets (Basiszustand) und wendet die Änderungen nur in einer Kopie der Rechen-Inputs an (`src/server/calc/rendite/portfolioverlauf.ts`) — nie auf die Datenbank.

## Reason

Ein Szenario zeigt dadurch immer die Konsequenz der Änderungen auf Basis der **aktuellen** echten Daten, nicht auf Basis eines eingefrorenen Snapshots. Löschen oder Ändern eines Szenarios hat garantiert keine Rückwirkung auf Property/Wertpapierposition/Tagesgeldkonto — die stärkste denkbare Garantie gegen versehentlichen Datenverlust bei einem reinen "Was wäre wenn"-Feature.

## Consequences

- Wird das referenzierte Asset einer Szenario-Änderung gelöscht, verliert die Änderung ihren Bezug (`onDelete: Cascade` auf `SzenarioAenderung.assetId`) und wird automatisch mitgelöscht — kein manuelles Aufräumen nötig, aber auch kein "verwaistes" Szenario mit stillschweigend falscher Aussage.
- Ein Szenario kann sich durch spätere Änderungen an den echten Daten (z. B. eine korrigierte Miete) implizit selbst ändern — gewünschtes Verhalten, aber abweichend von einem klassischen "Snapshot"-Verständnis von Szenarien; in `docs/tools/finanzuebersicht-und-szenarien.md` explizit erklärt.
