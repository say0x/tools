# Architecture Decision Records

Dokumentiert die wichtigsten, bereits getroffenen Architekturentscheidungen im Repository — warum etwas so gebaut ist, nicht nur was gebaut ist. Neue ADRs bei der nächsten Entscheidung dieser Größenordnung ergänzen (fortlaufend nummeriert), bestehende nicht rückwirkend umschreiben — wird eine Entscheidung revidiert, bekommt sie eine neue ADR mit Verweis auf die alte, deren Status auf „Superseded by ADR-XXXX" wechselt.

| ADR | Titel |
|---|---|
| [0001](0001-framework-freier-rechenkern.md) | Framework-freie Berechnungs-Engine |
| [0002](0002-cashflow-only-finanzuebersicht.md) | Cashflow-only-Philosophie für Finanzübersicht und Szenarien |
| [0003](0003-polymorphes-asset-modell.md) | Polymorphes Asset-Modell statt Duplikation pro Anlageklasse |
| [0004](0004-szenario-system-ohne-mutation.md) | Szenario-System als Basiszustand + nicht-mutierende Änderungen |
| [0005](0005-computed-with-override-pattern.md) | "computed-with-override" statt reiner Eingabe- oder Berechnungsfelder |
| [0006](0006-kein-app-level-login.md) | Kein App-Level-Login, Absicherung über VPN-only-Netzwerk |
| [0007](0007-monolith-statt-microservices.md) | Ein Next.js-Monolith statt Microservices/separater API |
| [0008](0008-server-actions-geben-ergebnis-zurueck-statt-zu-werfen.md) | Server Actions geben ein ActionResult zurück statt Fehler zu werfen |
