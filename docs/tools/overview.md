# Tool-Übersicht

Landkarte über alle 10 Tools: Zweck, geteilte Engine, Überschneidungen. Details zu einem einzelnen Tool: [`immobilien-rechner.md`](immobilien-rechner.md), [`finanzuebersicht-und-szenarien.md`](finanzuebersicht-und-szenarien.md), [`weitere-rechner.md`](weitere-rechner.md).

## Inventar

| Tool | Pfad | Zweck | Kern-Engine | Persistenz |
|---|---|---|---|---|
| Dashboard | `/` | Kennzahlen-Übersicht über alle Tools hinweg | liest alle unten stehenden Engines | nur lesend |
| Immobilien-Rechner | `/immobilien/objekte/*` | Flaggschiff: Objekt anlegen, Kennzahlen live, Vergleich | `berechneObjekt()` | Property + Relationen |
| Referenzdaten | `/immobilien/referenzdaten` | Editierbare Startwerte (Grunderwerbsteuer, Mietpreise, …) | — | Reference*-Tabellen |
| Finanzübersicht | `/finanzuebersicht` | Cashflow-only-Vermögensverlauf über alle besessenen Assets | `berechnePortfolioverlauf()` | liest Asset-Tabellen |
| Szenarien | `/szenarien/*` | „Was wäre wenn" — Basiszustand + Änderungen, nie destruktiv | dieselbe Portfolioverlauf-Engine | Szenario + Änderungen |
| Sparziel-Rechner | `/sparziel` | Freistehender Zinseszins-Rechner | `berechneSparpositionsverlauf()` | keine |
| Steuerrechner | `/steuerrechner` | Freistehender Grenzsteuersatz-Rechner | `berechneGrenzsteuersatz()` | keine |
| Kreditvergleich | `/kreditvergleich` | Zwei Finanzierungsangebote nebeneinander | `berechneTilgungsplan()` | keine |
| Kaufen oder Anlegen? | `/kaufen-oder-anlegen` | Ein Objekt vs. Alternativanlage desselben EK | `berechneSparpositionsverlauf()` | liest Property |
| Profil | `/profil` | Einkommen/Schwellen + Daten-Backup (JSON-Export) | — | UserProfile |

Alle Status `ACTIVE` — keine BETA/EXPERIMENTAL/DEPRECATED-Kandidaten. 5 der 10 Tools rufen eine bereits an anderer Stelle getestete Engine-Funktion auf statt eigener Berechnungslogik — Zentralisierung ist hier gelebte Praxis, keine offene Aufgabe.

## Überschneidungs-Check

Kategorien: **A** Duplikat (zusammenlegen prüfen) · **B** starke Überschneidung (gemeinsame Engine prüfen) · **C** ergänzend (gemeinsame Daten/Engine, unterschiedlicher Zweck) · **D** sinnvoll getrennt.

| Paar | Kategorie | Begründung |
|---|---|---|
| Sparziel-Rechner ↔ Finanzübersicht/Szenarien-Sparpositionen | C | Identische Engine, Sparziel ohne DB-Bezug für schnelle Was-wäre-wenn-Fragen. |
| Kreditvergleich ↔ Immobilien-Rechner-Finanzierung | C | Identische Engine, Kreditvergleich bewusst ohne Objektbezug (z. B. Anschlussfinanzierungs-Vergleich ohne Objekt zu bearbeiten). |
| Steuerrechner ↔ Profil-Grenzsteuersatz | C | Identische Engine, bewusst unabhängig vom hinterlegten Profil für hypothetische Einkommensfragen. |
| Kaufen-oder-Anlegen? ↔ Szenario-System | B | Beide vergleichen Vermögensverläufe über Zeit, aber die vier Szenario-Änderungsarten können keinen echten Opportunitätskosten-Vergleich ("Kauf X *statt* Alternativanlage Y") ausdrücken. Denkbare Weiterentwicklung: ein fünfter Änderungstyp, der beides verbindet — kein akuter Bedarf, nur auf Wunsch. |
| Alle übrigen Paare | D | Eigenständiger, nicht überlappender fachlicher Zweck. |

Keine Kategorie-A-Duplikate im gesamten Repo gefunden.

## Datenwiederverwendung

Immobilienwert, Kaufnebenkosten, Profil-Einkommen, Referenzdaten und Depot-/Tagesgeld-Positionen werden je genau einmal gespeichert (über die gemeinsame `Asset`-Tabelle, siehe [ADR-0003](../architecture/decisions/0003-polymorphes-asset-modell.md)) und fließen automatisch in Finanzübersicht, Szenarien, Dashboard und Objektvergleich ein — keine erneute manuelle Eingabe nötig.

Ein Fund aus der Ökosystem-Analyse (2026-08-22, behoben): Kaufen-oder-Anlegen? fragte die Alternativanlage-Rendite mit einem hartcodierten Wert ab, obwohl die echte Rendite-Annahme für besessene Wertpapierdepots bereits in der Finanzübersicht steht. Seither vorbelegt mit der Ø-Rendite der besessenen Depots, weiterhin frei überschreibbar.

## Versionierung

`tools` ist ein Next.js-Monolith mit einem Build, einem Docker-Image, einem Deploy-Ziel ([ADR-0007](../architecture/decisions/0007-monolith-statt-microservices.md)) — es gibt keine unabhängig auslieferbaren Tool-Versionen. Statt erfundener Pro-Tool-Versionsnummern (die eine Unabhängigkeit vortäuschen würden, die technisch nicht existiert):

- **Plattform-Version**: `package.json` (`0.2.0-20260823` — SemVer mit CalVer-Datumssuffix `YYYYMMDD`, siehe [`docs/releases/CHANGELOG.md`](../releases/CHANGELOG.md)).
- **Pro Tool, ehrlich statt erfunden**: `git log -- src/app/<pfad>` zeigt den tatsächlichen Änderungsverlauf eines einzelnen Tools innerhalb der gemeinsamen Historie.
