# ADR-0001 — Framework-freie Berechnungs-Engine

**Status**: Accepted

## Context

Praktisch jedes Feature in `tools` hängt an derselben Kette von Finanzberechnungen (Rendite, Tilgungsplan, Steuer, Vermögensverlauf). Diese Kette wird an zwei sehr unterschiedlichen Stellen gebraucht: server-seitig beim Speichern eines Objekts (Server Action → Prisma) und client-seitig für Live-Vorschau im Formular, ohne bei jeder Zifferneingabe einen Server-Roundtrip auszulösen.

## Decision

`src/server/calc/` enthält ausschließlich reine, framework-freie TypeScript-Funktionen — kein Import von `react`, `next` oder `@prisma/*`. Einziger Einstiegspunkt ist `berechneObjekt()` in `engine.ts`; alle Submodule bleiben intern.

## Reason

Reiner Code läuft identisch im Server-Kontext (Server Action) und im Browser (Client Component), ohne Adapter oder Duplikation. Er ist außerdem trivial isoliert testbar (kein Mocking von React oder der Datenbank nötig) — der Rechenkern hat dadurch die mit Abstand höchste Testabdeckung im Repo (18 Testdateien).

## Consequences

- Der Sparziel-Rechner, Steuerrechner und Kreditvergleich rufen dieselben Funktionen direkt im Browser auf wie das Server-seitige Speichern — ohne API-Call.
- `engine.ts` kann keine `formatEuro`-Hilfsfunktion aus `src/lib/` importieren (die ist UI-Schicht) und definiert stattdessen eine eigene, minimale Variante für eine einzelne Fehlermeldung — eine bewusst akzeptierte, kleine Duplikation zugunsten der sauberen Schichtgrenze.
- Seit dem Repository-Audit (2026-08-22) mechanisch erzwungen: ein `no-restricted-imports`-ESLint-Override auf `src/server/calc/**` blockt React-/Next.js-/Prisma-Importe mit einer erklärenden Fehlermeldung, statt sich allein auf Konvention zu verlassen.
