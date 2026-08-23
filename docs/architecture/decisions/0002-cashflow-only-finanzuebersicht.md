# ADR-0002 — Cashflow-only-Philosophie für Finanzübersicht und Szenarien

**Status**: Accepted

## Context

Die Finanzübersicht soll beantworten: „Wie viel Geld habe ich in Jahr X tatsächlich zur Verfügung?" Der naheliegende erste Ansatz — den gesamten Immobilienwert (abzüglich Restschuld) einfach zum Bargeld-/Depot-Vermögen zu addieren — vermischt zwei fundamental unterschiedliche Dinge: Geld, das man ausgeben kann, und Vermögen, das im Objekt gebunden ist und erst nach einem Verkauf verfügbar wird.

## Decision

`gesamtNominal` und der `PortfolioJahr`-Verlauf in `berechnePortfolioverlauf()` schließen den Immobilien-Eigenkapitalanteil bewusst aus. Nur der tatsächliche Cashflow, den eine Immobilie erwirtschaftet (Miete minus Kosten minus Finanzierungsrate, nach Steuer), fließt in die Summe ein. Der Immobilienwert wird an anderer Stelle (Szenario-Vergleichschart, Dashboard-Vermögensverteilung) ausschließlich als **Referenzlinie** dargestellt — separat beschriftet, nie addiert.

## Reason

Ein Nutzer, der seine Liquiditätsplanung auf ein „Vermögen" stützt, das zur Hälfte aus nicht verfügbarem Immobilienkapital besteht, trifft im Zweifel falsche Entscheidungen (z. B. eine Anschaffung, die er sich mangels echtem Bargeld nicht leisten kann). Die Trennung macht die Finanzübersicht ehrlich für ihren eigentlichen Zweck — Cashflow-Planung — statt eine Wohlfühl-Vermögenszahl zu zeigen.

## Consequences

- Zwei separate Visualisierungen mit unterschiedlicher Aussage koexistieren bewusst: die Dashboard-Vermögensverteilung zählt den Immobilien-EK-Anteil zur Frage „wo steckt mein Vermögen" mit, die Finanzübersicht/Szenarien-Charts klammern ihn für die Frage „wie viel Geld habe ich verfügbar" aus. Das ist keine Inkonsistenz, sondern zwei bewusst unterschiedliche Fragen — in `docs/tools/finanzuebersicht-und-szenarien.md` explizit gegenübergestellt.
- Jede neue Kennzahl, die „Vermögen" zeigt, muss vor der Implementierung explizit einordnen, welcher der beiden Philosophien sie folgt.
