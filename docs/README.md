# Dokumentation

Ausführliche Referenz neben der kurzen Übersicht in der [Haupt-README](../README.md). Bei Widerspruch zwischen Code und Dokumentation gewinnt der Code — Widerspruch dann wie einen Bug behandeln und die Doku korrigieren, nicht stehen lassen.

| Bereich | Inhalt |
|---|---|
| [`architecture/overview.md`](architecture/overview.md) | Systemarchitektur, Schichten, Tech-Stack |
| [`architecture/decisions/`](architecture/decisions/) | Architecture Decision Records — warum, nicht nur was |
| [`tools/overview.md`](tools/overview.md) | Tool-Inventar, Überschneidungs-Check, Datenwiederverwendung |
| [`tools/immobilien-rechner.md`](tools/immobilien-rechner.md) | Rechenkern-Modul-Landkarte, alle Ein-/Ausgabe-Schnittstellen |
| [`tools/finanzuebersicht-und-szenarien.md`](tools/finanzuebersicht-und-szenarien.md) | Cashflow-only-Philosophie, Besitzstatus-System, Szenario-Änderungsarten |
| [`tools/weitere-rechner.md`](tools/weitere-rechner.md) | Sparziel, Steuerrechner, Kreditvergleich, Kaufen-oder-Anlegen, Dashboard, geteilte UI-Bausteine |
| [`database/schema.md`](database/schema.md) | Datenmodell-Landkarte, Konventionen |
| [`deployment/docker.md`](deployment/docker.md) | Docker-Deployment, Netzwerk, CI |
| [`development/setup.md`](development/setup.md) | Lokale Entwicklung, Tests, Import-Skript |
| [`security/overview.md`](security/overview.md) | Bedrohungsmodell, Audit-Stand |
| [`qa/overview.md`](qa/overview.md) | Testphilosophie, Abdeckung, bekannte Lücken |
| [`releases/CHANGELOG.md`](releases/CHANGELOG.md) | Nennenswerte Änderungen je Version |

In den jeweiligen Quelldateien steht oben ein Kommentar, welche `docs/`-Seite dazugehört — bei Änderungen an der Logik dort zuerst nachsehen, ob die Doku noch stimmt.
