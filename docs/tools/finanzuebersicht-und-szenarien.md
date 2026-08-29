# Finanzübersicht & Szenarien — Referenz

Ausführliche Referenz für `/finanzuebersicht` und `/szenarien` sowie das gemeinsam genutzte Besitzstatus-System. Ergänzt die kurze Übersicht in der Haupt-[`README.md`](../../README.md); Details zur eigentlichen Objekt-Berechnung stehen in [`immobilien-rechner.md`](immobilien-rechner.md).

## Grundphilosophie: Cashflow, nicht Vermögenswert

Beide Tools zeigen den Verlauf des **tatsächlich verfügbaren (liquiden) Geldes** — nicht das Gesamtvermögen. Bei Immobilien zählt deshalb nur der **Cashflow nach Steuer**, nicht der Immobilienwert oder Eigenkapitalanteil selbst (das Geld steckt im Objekt, ist nicht verfügbar). Wertpapier-/Tagesgeld-Positionen zählen dagegen voll, weil sie liquide sind. Diese Philosophie ist absichtlich und durchgängig — siehe `src/server/calc/types.ts`, JSDoc auf `PortfolioJahr`.

Immobilienwert/EK-Anteil werden trotzdem an mehreren Stellen als **reine Referenzwerte** angezeigt, gerade weil sie sonst leicht verlorengehen:
- Finanzübersicht: "Marktwert heute (Referenz)" / "EK-Anteil heute (Referenz)" je Objekt (`FinanzuebersichtClient.tsx`).
- Szenario-Vergleich: dritte, gepunktete Chart-Linie "Immobilienwert (Referenz, im Szenario)" plus zwei Zahlen darunter, sobald das Szenario eine Immobilie enthält (siehe unten).
- Dashboard: "Vermögensverteilung"-Balken (Immobilien-EK-Anteil vs. Bargeld & Depots) — dort zählt der EK-Anteil bewusst mit, weil die Frage dort "wo steckt mein Vermögen?" ist, nicht "wie viel Geld habe ich verfügbar?".

## Geteilte Bausteine (`src/server/calc/rendite/portfolioverlauf.ts`)

Framework-freie Funktionen, die Finanzübersicht **und** Szenarien nutzen (keine Duplikate):

| Funktion | Zweck |
|---|---|
| `berechneSparpositionsverlauf` | Jahresreihe einer einzelnen Wertpapier-/Tagesgeld-Position: Startbetrag + Rendite/Zins + optionaler wachsender Sparplan. Auch vom [Sparziel-Rechner](weitere-rechner.md) direkt genutzt. Unterstützt optional einen Sparraten-Sprung ab einem Jahr (`SparratenAenderung`) — für die Szenario-Änderungsart "Sparrate ändern". |
| `berechneImmobilienCashflowverlauf` | Jahresreihe des ab heute verfügbaren Geldes, das eine Immobilie beisteuert (kumulierter Cashflow nach Steuer, NICHT Wert/EK-Anteil). Bei geplanten (zukünftigen) Käufen wird der EK-Einsatz einmalig im Kaufjahr als Abfluss simuliert. |
| `berechneImmobilienEigenkapitalverlauf` | Jahresreihe des EK-Anteils (reine Referenz, siehe oben) — schneidet den vorhandenen, auf das Kaufdatum bezogenen Verlauf der Objekt-Engine auf "heute bis heute+Horizont" zu. |
| `berechnePortfolioverlauf` | Kombiniert mehrere Positions-Jahresreihen zu einer Gesamtvermögens-Jahresreihe (nominal + inflationsbereinigt), inkl. `proPosition`-Aufschlüsselung je Asset-ID. |
| `wendeImmobilienverkaufAn` | Szenario-Baustein "Immobilie verkaufen": friert den Cashflow-Verlauf ab dem Verkaufsjahr ein, addiert einmalig den Verkaufserlös (Referenz-Marktwert). |
| `berechneEinmaligeAnschaffungVerlauf` | Szenario-Baustein "Einmalige Anschaffung": reduziert das verfügbare Geld einmalig im gewählten Jahr, bleibt danach konstant auf dem neuen Niveau. |

`src/server/data/vermoegen.ts` bereitet Property-/Wertpapier-/Tagesgeld-Rows (aus Prisma) in die Positions-Formate auf, die beide Tools brauchen (`berechneImmobilienPositionen`, `berechneSparpositionPositionen`) — geteilt statt dupliziert, weil Finanzübersicht und Szenario-Editor exakt dieselbe Objekt-Engine-Auswertung + Kaufdatum-Logik brauchen.

## Besitzstatus-System (`src/lib/asset.ts`)

Jedes Asset (Immobilie, Wertpapierdepot, Tagesgeld) hat einen **Besitzstatus** auf der gemeinsamen `Asset`-Tabelle (nicht pro Tool einzeln, damit jeder heutige und künftige Asset-Typ automatisch denselben Status bekommt):

| Status | Zählt in Finanzübersicht? | Typischer Zweck |
|---|---|---|
| `BESITZE_ICH` | Ja — einzig automatisch gezählter Status | Echter Besitz |
| `POTENZIELLE_ANSCHAFFUNG` | Nein | Objekt in Prüfung, Default für neu angelegte Immobilien |
| `SPEKULATION` | Nein | Rein hypothetisch |
| `VERKAUFT` | Nein | Historisch, nicht mehr im Bestand |
| `ARCHIVIERT` | Nein | Aus der aktiven Ansicht ausgeblendet |

Neu angelegte Immobilien starten bei `POTENZIELLE_ANSCHAFFUNG` (bewusste Bremse gegen versehentliches Mitzählen rein hypothetischer Objekte), neu angelegte Wertpapier-/Tagesgeld-Positionen bei `BESITZE_ICH` (wer hier einen Betrag einträgt, meint i. d. R. echten Besitz).

Das Kaufdatum einer Immobilie ist frei editierbar (Default: heute) und darf auch in der Zukunft liegen (geplanter Kauf) — bestimmt in der Finanzübersicht, ab wann der Cashflow einsetzt. Für den Immobilien-Rechner selbst (Kennzahlen, Tilgungsplan) spielt das Kaufdatum keine Rolle, da dieser ausschließlich in relativen "Jahren seit Kauf" rechnet.

## Finanzübersicht (`/finanzuebersicht`)

Jede Wertpapier-/Tagesgeld-Position wächst unterjährig (monatliche Verzinsung, effektiver Monatszins aus der Jahresrendite hergeleitet) mit ihrer eigenen Rendite/Zins plus einem monatlichen Sparplan, der einmal pro Jahr um einen konfigurierbaren Prozentsatz steigt (die Steigerung selbst greift nur zum Jahreswechsel, nicht unterjährig); die reale Linie rechnet mit einer frei konfigurierbaren Inflationsrate ab (kein separat modelliertes CPI). Gehalt und Gehaltssteigerung sind rein informativ (Kontext-Anzeige + Vorschlagswert für neue Sparplan-Steigerungen) und fließen nicht automatisch in die Sparraten ein — diese werden bewusst als feste €-Beträge je Position hinterlegt.

## Szenarien (`/szenarien`)

Ein Szenario ist **Basiszustand** (alle Assets mit Status `BESITZE_ICH`, unverändert aus der DB) + eine Liste von **Änderungen**, die NUR zur Laufzeit im Browser auf eine Kopie der Inputs angewendet werden — Speichern eines Szenarios verändert niemals `Property`/`Wertpapierposition`/`Tagesgeldkonto`. Vier Änderungsarten (`src/server/actions/szenario-schema.ts`):

| Typ | Effekt |
|---|---|
| `IMMOBILIE_AUFNEHMEN` | Ein Objekt mit Status `POTENZIELLE_ANSCHAFFUNG`/`SPEKULATION` wird ab seinem — auch zukünftigen — Kaufdatum wie besessen behandelt, nutzt dieselbe Cashflow-Logik wie die Finanzübersicht. |
| `IMMOBILIE_VERKAUFEN` | Cashflow einer besessenen Immobilie endet ab einem gewählten Jahr, der heutige Marktwert fließt als einmaliger Verkaufserlös zu — Restschuld-Ablösung und Steuern beim Verkauf sind dabei nicht eingerechnet. |
| `SPARRATE_AENDERN` | Monatliche Sparrate einer Wertpapier-/Tagesgeld-Position springt ab dem Szenario-Startjahr auf einen neuen Betrag, die reguläre jährliche Steigerung läuft ab dann auf Basis der neuen Rate weiter. |
| `EINMALIGE_ANSCHAFFUNG` | Frei benannte einmalige Ausgabe zu einem Jahr, z. B. ein Autokauf — bewusst ohne eigenes Fahrzeug-Tool, da der Betrag danach nicht weiterverfolgt werden muss. |

Betreffen mehrere Änderungen dasselbe Asset, gewinnt die letzte in der Liste — die UI weist mit einem Hinweis darauf hin, statt die Änderungen stillschweigend zu kombinieren. "Immobilienpreise steigen jährlich um X%" (eine globale Wertsteigerungs-Annahme statt einer Asset-bezogenen Änderung) ist aktuell keine eigene Änderungsart, da Wertsteigerung ohne einen geplanten Verkauf ohnehin keinen Effekt auf den Cashflow hat.

Der Vergleichs-Chart (`SzenarioVergleichChart.tsx`) rechnet ausschließlich nominal (keine reale/inflationsbereinigte Linie, um die Szenario-Differenz nicht zusätzlich zu verkomplizieren).

### Immobilienwert-Referenzlinie im Szenario-Vergleich

Enthält das Szenario mindestens eine Immobilie (Basiszustand-Objekt und/oder per `IMMOBILIE_AUFNEHMEN` hinzugefügt), zeigt der Chart zusätzlich eine dritte, gepunktete Linie "Immobilienwert (Referenz, im Szenario)":

- Berechnung: summierter EK-Anteil-Verlauf (`berechneImmobilienEigenkapitalverlauf`) aller im "mit Szenario"-Zustand vorhandenen Immobilien, in `SzenarioClient.tsx`.
- Nach einem `IMMOBILIE_VERKAUFEN` im Szenario zählt der Wert des verkauften Objekts ab dem Verkaufsjahr nicht mehr mit (der Erlös steckt bereits im Cashflow).
- Fließt bewusst NICHT in die "Mit Szenario"/"Differenz"-Werte ein (gleiche Cashflow-only-Philosophie wie überall sonst) — macht aber sichtbar, dass ein auf den ersten Blick schlechterer Cashflow durch im Objekt aufgebautes Vermögen ausgeglichen sein kann. Zusätzlich als Zahlen unter dem Chart ("Immobilienwert heute/nach X Jahren (Referenz)").
- Grund für die eigene Datenquelle: `ImmobilienPosition` (`src/server/data/vermoegen.ts`) führt seit dieser Erweiterung zusätzlich den vollen EK-Anteil-Verlauf (`eigenkapitalanteilProJahrSeitKauf`), nicht mehr nur den heutigen Referenzwert.
