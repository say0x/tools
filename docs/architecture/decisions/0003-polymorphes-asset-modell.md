# ADR-0003 — Polymorphes Asset-Modell statt Duplikation pro Anlageklasse

**Status**: Accepted

## Context

`tools` begann mit einer einzigen Anlageklasse (Immobilien), wuchs aber absehbar auf mehrere hinzu (Wertpapierdepots, Tagesgeld — inzwischen umgesetzt; perspektivisch Fahrzeuge, Kredite). Jede Anlageklasse braucht: einen Besitzstatus (gehört sie mir wirklich, oder ist sie nur eine Kalkulation?), einen Namen, und eine Historie. Ohne gemeinsames Modell hätte jede neue Tabelle diese Felder erneut definieren müssen.

## Decision

Ein schlankes `Asset`-Basismodell (`id`, `type`, `name`, `besitzstatus`, Zeitstempel) wird von jeder konkreten Anlageklasse per 1:1-Relation erweitert (`Property`, `Wertpapierposition`, `Tagesgeldkonto` — je mit `assetId` als Fremdschlüssel). Typspezifische Felder bleiben in der jeweiligen Detail-Tabelle.

## Reason

Werkzeuge wie die Finanzübersicht oder das Szenario-System müssen nicht wissen, ob ein Asset eine Immobilie oder ein Wertpapierdepot ist, um seinen Besitzstatus zu prüfen oder es in einer Liste anzuzeigen — sie fragen die `Asset`-Tabelle. Eine künftige Anlageklasse (z. B. Fahrzeuge) bräuchte nur eine neue Detail-Tabelle + `AssetType`-Enum-Wert, keinen Zusatzcode in den bestehenden Tools.

## Consequences

- `SzenarioAenderung.assetId` referenziert `Asset` generisch, nicht `Property` oder `Wertpapierposition` einzeln — eine Szenario-Änderung wie "Sparrate ändern" funktioniert dadurch für jede Anlageklasse mit Sparplan-Feld, ohne Sonderfall je Typ.
- Löschen eines Assets löscht per Cascade automatisch dessen typspezifische Detailzeile und jede Szenario-Änderung, die darauf verweist — ein verwaistes Asset ohne Detailzeile kann strukturell nicht entstehen.
