# ADR-0005 — "computed-with-override" statt reiner Eingabe- oder reiner Berechnungsfelder

**Status**: Accepted

## Context

Viele Werte im Immobilien-Rechner haben einen sinnvollen Standard, der sich aus anderen Angaben herleiten lässt (Grunderwerbsteuer aus dem Bundesland, AfA-Satz aus dem Baujahr, Instandhaltungsrücklage aus Baujahr + Bauteilzustand). Ein reines Eingabefeld zwingt den Nutzer, diese Werte selbst zu recherchieren. Eine reine Berechnung ohne Override lässt ihn nicht abweichen, wenn er es genauer weiß (z. B. ein bereits bekannter Makler-Satz).

## Decision

Durchgängiges Muster für solche Felder: ein Wertefeld (`xProzent`) plus ein Boolean (`xOverride`). Ist der Override aus, zeigt und nutzt die Engine den hergeleiteten Vorschlag; ist er an, gilt der manuell eingetragene Wert. Die UI-Komponente `OverridableField` kapselt dieses Verhalten wiederverwendbar.

## Reason

Ein einziges, konsistentes Muster statt einer Ad-hoc-Lösung pro Feld — sowohl für den Nutzer (immer dasselbe Umschalt-Verhalten) als auch für den Code (`OverridableField` wird an über einem Dutzend Stellen im Immobilien-Formular wiederverwendet, ohne dass jede Stelle ihre eigene Vorschlag/Override-Logik baut).

## Consequences

- Jedes computed-with-override-Feld muss sowohl den berechneten Vorschlag als auch eine nachvollziehbare Formel-Erklärung liefern (`formel`-Prop von `OverridableField`) — reine "Blackbox"-Vorschläge sind durch das Muster ausgeschlossen.
- Die Datenbank speichert bei aktivem Override zusätzlich zum manuellen Wert weiterhin auch, dass er manuell ist (`xOverride: true`) — beim erneuten Laden bleibt die Nutzerentscheidung erhalten, statt beim nächsten Öffnen wieder den Vorschlag zu zeigen.
