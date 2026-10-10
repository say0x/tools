# Tool-Übersicht

Landkarte über alle Tools: Zweck, geteilte Engine, Überschneidungen. Welche Tools es gibt (Navigation, Startseiten-Karten, E2E-Routen), steht an genau einer Stelle: [`src/lib/tool-registry.ts`](../../src/lib/tool-registry.ts) — ein Test stellt sicher, dass jedes dort registrierte Tool auch in dieser Tabelle steht. Details zu einem einzelnen Tool: [`immobilien-rechner.md`](immobilien-rechner.md), [`finanzuebersicht-und-szenarien.md`](finanzuebersicht-und-szenarien.md), [`fitness.md`](fitness.md), [`weitere-rechner.md`](weitere-rechner.md).

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
| Fitness & Ernährung | `/fitness/*` | Kalorienbedarf, Ernährungstagebuch (Lebensmittel-DB), Training, Gewichtstrend, Sport-Rechner — siehe [`fitness.md`](fitness.md) | `berechneEnergiebedarf()`, `berechneTagesbilanz()`, `berechneGewichtsverlauf()` | FitnessProfil, Gewicht/Mahlzeit/Training/TagesAktivitaet, Lebensmittel |
| Profil | `/profil` | Einkommen/Schwellen + Daten-Backup (JSON-Export) | — | UserProfile |
| Integrationen & API | `/integrationen`, `/api/v1/*` | API-Tokens verwalten, Home-Assistant-/curl-Konfiguration kopieren; REST-API für Geräte und Skripte — siehe [`../api/README.md`](../api/README.md) | dieselben Datenfunktionen wie die Tools (`ladeFitnessTag()`, `ladeDashboardKennzahlen()`, …) | ApiToken (nur Hash) |
| Nutzer | `/nutzer` | Lokale Test-User anlegen und wechseln (kein Login, [ADR-0009](../architecture/decisions/0009-lokales-mehrbenutzer-datenmodell.md)) | — | User |

Alle Status `ACTIVE` — keine BETA/EXPERIMENTAL/DEPRECATED-Kandidaten. Szenarien, die drei freistehenden Rechner und Kaufen-oder-Anlegen? rufen eine bereits an anderer Stelle getestete Engine-Funktion auf statt eigener Berechnungslogik — Zentralisierung ist hier gelebte Praxis, keine offene Aufgabe.

## Überschneidungs-Check

Kategorien: **A** Duplikat (zusammenlegen prüfen) · **B** starke Überschneidung (gemeinsame Engine prüfen) · **C** ergänzend (gemeinsame Daten/Engine, unterschiedlicher Zweck) · **D** sinnvoll getrennt.

| Paar | Kategorie | Begründung |
|---|---|---|
| Sparziel-Rechner ↔ Finanzübersicht/Szenarien-Sparpositionen | C | Identische Engine, Sparziel ohne DB-Bezug für schnelle Was-wäre-wenn-Fragen. |
| Kreditvergleich ↔ Immobilien-Rechner-Finanzierung | C | Identische Engine, Kreditvergleich bewusst ohne Objektbezug (z. B. Anschlussfinanzierungs-Vergleich ohne Objekt zu bearbeiten). |
| Steuerrechner ↔ Profil-Grenzsteuersatz | C | Identische Engine, bewusst unabhängig vom hinterlegten Profil für hypothetische Einkommensfragen. |
| Kaufen-oder-Anlegen? ↔ Szenario-System | C | Beide vergleichen Vermögensverläufe über Zeit; der Änderungstyp `IMMOBILIE_STATT_ALTERNATIVANLAGE` bringt den Opportunitätskosten-Vergleich ("Kauf X *statt* Alternativanlage Y") ins Szenario-System, bewusst als eigener Typ statt Kaufen-oder-Anlegen? zu ersetzen — Kaufen-oder-Anlegen? bleibt der schnelle DB-lose Rechner ohne Szenario-Overhead. |
| Integrationen & API ↔ alle Tools | C | Keine eigene Fachlogik: die API ruft exakt die Datenfunktionen und Zod-Schemas der Tools auf; neue Werte entstehen nie nur in der API. |
| Fitness ↔ Finanz-/Immobilien-Tools | D | Eigene Domäne ohne gemeinsame Daten; teilt nur Infrastruktur (User-Modell, Backup, Navigation, Dashboard-Karte). |
| Alle übrigen Paare | D | Eigenständiger, nicht überlappender fachlicher Zweck. |

Keine Kategorie-A-Duplikate im gesamten Repo gefunden.

## Datenwiederverwendung

Immobilienwert, Kaufnebenkosten, Profil-Einkommen, Referenzdaten und Depot-/Tagesgeld-Positionen werden je genau einmal gespeichert (über die gemeinsame `Asset`-Tabelle, siehe [ADR-0003](../architecture/decisions/0003-polymorphes-asset-modell.md)) und fließen automatisch in Finanzübersicht, Szenarien, Dashboard und Objektvergleich ein — keine erneute manuelle Eingabe nötig.

Ein Fund aus der Ökosystem-Analyse (2026-08-22, behoben): Kaufen-oder-Anlegen? fragte die Alternativanlage-Rendite mit einem hartcodierten Wert ab, obwohl die echte Rendite-Annahme für besessene Wertpapierdepots bereits in der Finanzübersicht steht. Seither vorbelegt mit der Ø-Rendite der besessenen Depots, weiterhin frei überschreibbar.

## Versionierung

`tools` ist ein Next.js-Monolith mit einem Build, einem Docker-Image, einem Deploy-Ziel ([ADR-0007](../architecture/decisions/0007-monolith-statt-microservices.md)) — es gibt keine unabhängig auslieferbaren Tool-Versionen. Statt erfundener Pro-Tool-Versionsnummern (die eine Unabhängigkeit vortäuschen würden, die technisch nicht existiert):

- **Plattform-Version**: `version` in `package.json` (SemVer mit CalVer-Datumssuffix `YYYYMMDD`, aktueller Stand in der README und im [`CHANGELOG`](../releases/CHANGELOG.md)).
- **Pro Tool, ehrlich statt erfunden**: `git log -- src/app/<pfad>` zeigt den tatsächlichen Änderungsverlauf eines einzelnen Tools innerhalb der gemeinsamen Historie.
