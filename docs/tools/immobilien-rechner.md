# Immobilien-Rechner — Referenz

Ausführliche Referenz für die Berechnungs-Engine unter `src/server/calc/`. Ergänzt die kurze Übersicht in der Haupt-[`README.md`](../../README.md) — dort steht das große Bild (Tech-Stack, Setup, Deployment), hier die Details: Modul-Landkarte, Schnittstellen (Ein-/Ausgabetypen) und die Annahmen/Vereinfachungen, die speziell diesen Rechner betreffen.

Wird ein Feld hier geändert oder ein neues hinzugefügt, bitte diese Datei mitpflegen — insbesondere die Tabellen unter [Eingabe-Schnittstellen](#eingabe-schnittstellen-srcservercalctypests) und [Ausgabe](#ausgabe-calculationresult), die 1:1 aus `src/server/calc/types.ts` abgeleitet sind.

## Grundprinzip

- **Framework-frei**: `src/server/calc/` importiert weder Prisma noch React. Läuft dadurch identisch server- und clientseitig — z. B. nutzt der [Sparziel-Rechner](weitere-rechner.md) dieselben Funktionen direkt im Browser, ohne Server-Roundtrip. Seit dem Audit lint-erzwungen: ein `no-restricted-imports`-Override in `eslint.config.mjs` blockt React-/Next.js-/Prisma-Importe innerhalb dieses Verzeichnisses mit einer erklärenden Fehlermeldung, statt sich allein auf Konvention zu verlassen.
- **Einziger Einstiegspunkt**: `berechneObjekt()` in [`engine.ts`](../../src/server/calc/engine.ts). UI-Code und Server Actions importieren nur diese Funktion, nie die Submodule direkt — die bleiben so intern austauschbar.
- **computed-with-override**: viele Felder (z. B. Grunderwerbsteuer-Satz, AfA-Satz, Miteigentumsanteil, Instandhaltungsrücklage) haben ein `xProzent`/`x`-Feld plus ein `xOverride`-Bool. Ohne Override berechnet die Engine einen Vorschlag aus Referenzdaten/Formel; mit Override gilt der manuell eingetragene Wert. Durchgängiges Muster, kein Sonderfall.
- **Tests direkt neben dem Code**: jedes `*.ts`-Modul unter `src/server/calc/` hat (fast immer) ein `*.test.ts` daneben. `src/server/calc/__tests__/engine.test.ts` + `fixtures.ts` testen die Gesamt-Orchestrierung.

## Modul-Landkarte

| Verzeichnis | Zuständigkeit | Wichtigste Exporte |
|---|---|---|
| `engine.ts` | Orchestriert alle Submodule zu `berechneObjekt()` | `berechneObjekt` |
| `types.ts` | Alle Domain-Typen (Ein-/Ausgabe), framework-frei | `PropertyInput`, `ProfileInput`, `ReferenceDataSnapshot`, `CalculationResult`, … |
| `constants.ts` | Geteilte Konstanten (Horizonte, Faktoren) | `VERMOEGENSVERLAUF_MAX_JAHRE`, `ZUSTANDSFAKTOR`, `GEBAEUDEANTEIL_PROZENT`, `SPEKULATIONSFRIST_JAHRE`, … |
| `costs/kaufnebenkosten.ts` | Grunderwerbsteuer, Notar, Grundbuch, Makler | `berechneKaufnebenkosten`, `MAKLERPROVISION_DEFAULT_PROZENT` |
| `costs/gewerke.ts` | Sanierungskosten je Gewerk, Miteigentumsanteil, Risiko-Score | `berechneGewerkeAuswertung`, `ermittleMiteigentumsanteilProzent` |
| `costs/instandhaltungsruecklage.ts` | Empfohlene Instandhaltungsrücklage (Peters'sche Formel) | `berechneEmpfohleneInstandhaltungsruecklage` |
| `financing/darlehen.ts` | Gesamtinvestition, Darlehenssumme, EK-Einsatz | `berechneGesamtinvestition`, `berechneFinanzierung` |
| `financing/tilgungsplan.ts` | Annuitätendarlehen, 50-Jahres-Raster, Anschlussfinanzierung, Sondertilgung | `berechneTilgungsplan` |
| `rendite/renditekennzahlen.ts` | Mietrendite, Kaufpreisfaktor, Cashflow vor/nach Steuer, EK-Rendite | `berechneRenditeKennzahlen` |
| `rendite/vermoegensverlauf.ts` | Jahresreihe für den Vermögensverlauf-Chart | `berechneVermoegensverlauf` |
| `rendite/breakeven.ts` | Bisektions-Suche: bei welchem Kaufpreis wird eine Metrik ≥ Zielwert? | `berechneBreakevenKaufpreis` |
| `rendite/kapitaleffizienz.ts` | EK-Rendite-Ampel, unabhängig von Cashflow/Finanzierbarkeit | `berechneKapitaleffizienz` |
| `rendite/portfolioverlauf.ts` | Geteilt mit Finanzübersicht/Szenarien — siehe [dortige Doku](finanzuebersicht-und-szenarien.md) | `berechneSparpositionsverlauf`, `berechneImmobilienCashflowverlauf`, `berechneImmobilienEigenkapitalverlauf`, `berechnePortfolioverlauf`, `wendeImmobilienverkaufAn`, `berechneEinmaligeAnschaffungVerlauf` |
| `rendite/sparziel.ts` | Für den [Sparziel-Rechner](weitere-rechner.md) | `findeJahrBisZielbetrag` |
| `tax/afa.ts` | AfA-Satz (§7 Abs. 4 EStG), computed-with-override | `ermittleAfaSatzProzent`, `berechneAfaJaehrlich` |
| `tax/grenzsteuersatz.ts` | Einkommensteuertarif nach §32a EStG, Grenzsteuersatz | `berechneEinkommensteuer`, `berechneGrenzsteuersatz` |
| `tax/estg-zonen.ts` | Jahrgangsweise Tarif-Zonenwerte (Datentabelle) | `ESTG_ZONEN`, `resolveEstgZone` |
| `tax/zve-schaetzung.ts` | Grobe zvE-Schätzung aus Brutto-Einkommen | `schaetzeZvEAusBrutto` |
| `tax/spekulationssteuer.ts` | §23 EStG-Näherung für einen Verkaufsgewinn | `berechneSpekulationssteuer` |
| `exit/exit-szenario.ts` | Bewertet den geplanten Verkauf am Ende der Haltedauer (Verkaufspreis/Restschuld aus dem Vermögensverlauf-Zieljahr, Spekulationssteuer darauf) | `berechneExitSzenario` |
| `analyse/verhandlungsargumente.ts` | Leitet Verhandlungsargumente aus den übrigen Ergebnissen ab | `ermittleVerhandlungsargumente` |
| `analyse/annahmen-warnungen.ts` | Warnt vor Annahmen, die technisch gültig, aber unrealistisch günstig sind (Leerstand, Wert-/Mietsteigerung) | `ermittleAnnahmenWarnungen` |
| `affordability/check.ts` | Finanzierbarkeits-Ampel (Schuldendienstquote, Liquiditätsreserve) | `berechneAffordability` |

## Ablauf von `berechneObjekt()`

Reihenfolge in [`engine.ts`](../../src/server/calc/engine.ts) (jeder Schritt nutzt teils Ergebnisse vorheriger Schritte):

1. **zvE ermitteln** — Override oder `schaetzeZvEAusBrutto(bruttoJaehrlich)`.
2. **Kaufnebenkosten** — `berechneKaufnebenkosten`.
3. **Gewerke-Auswertung** — `berechneGewerkeAuswertung`, leitet daraus die Sofortinvestition ab (bei Sanierungsmodus `GRANULAR`; bei `PAUSCHAL` gilt der manuell eingetragene Pauschalbetrag).
4. **Instandhaltungsrücklage** — empfohlen vs. tatsächlich (Override).
5. **Finanzierung** — `berechneFinanzierung` (Darlehenssumme, EK-Einsatz).
6. **Tilgungsplan** — `berechneTilgungsplan`, 50 Jahre (`VERMOEGENSVERLAUF_MAX_JAHRE`).
7. **Rendite-Kennzahlen** — `berechneRenditeKennzahlen`.
8. **Meilensteine** — Zinsbindungsende, Volltilgungsjahr (aus dem Tilgungsplan), Anschlusszinssatz.
9. **Vermögensverlauf** — `berechneVermoegensverlauf`, Jahresreihe für den Chart.
10. **Breakeven-Kaufpreis** — `berechneBreakevenKaufpreis` (Bisektion über hypothetische Kaufpreise, bis Cashflow nach Steuer ≥ 0).
11. **Affordability-Ampel** — `berechneAffordability`.
12. **Kapitaleffizienz-Signal** — `berechneKapitaleffizienz`.
13. **"Rechnet sich?"-Meldung** — `dealBreaker`: `rechnetSich = cashflowNachSteuer >= 0 && affordability.ampel !== "ROT"`, plus eine erklärende Meldung (nutzt ggf. den Breakeven-Kaufpreis).
14. **Verhandlungsargumente** — `ermittleVerhandlungsargumente`.
15. **Annahmen-Warnungen** — `ermittleAnnahmenWarnungen`, prüft Leerstandsquote/Wert-/Mietsteigerung auf unrealistisch günstige Werte (unabhängig vom Exit-Szenario).
16. **Exit-Szenario** — `berechneExitSzenario`, nur wenn `exit.geplant`: entnimmt Verkaufspreis und Restschuld dem `vermoegensverlauf`-Eintrag zum Jahr `exit.haltedauerJahre` und berechnet darauf die Spekulationssteuer.

## Eingabe-Schnittstellen (`src/server/calc/types.ts`)

### `PropertyInput`

| Feld | Typ | Beschreibung |
|---|---|---|
| `kaufpreis` | `number` | Kaufpreis in € |
| `wohnflaeche` | `number` | Eigene Wohnfläche in m² |
| `bundesland` | `Bundesland` | Für Grunderwerbsteuer- und Mietpreis-Referenzwerte |
| `lagetyp` | `Lagetyp` | `LAENDLICH` \| `KLEINSTADT` \| `GROSSSTADT` |
| `objekttyp` | `Objekttyp` | `ETW` \| `MEHRFAMILIENHAUS` \| `HAUS` |
| `baujahr` | `number` | Für AfA-Satz-Herleitung, Instandhaltungsrücklage, Gewerke-Alterskontext |
| `anzahlEinheiten` | `number` | Rein informativ |
| `grunderwerbsteuerProzent` / `-Override` | `number` / `boolean` | computed-with-override, Default aus `referenceData.grunderwerbsteuerByBundesland` |
| `notarProzent` / `-Override` | `number` / `boolean` | computed-with-override, Default aus `referenceData.notarProzentDefault` |
| `grundbuchProzent` / `-Override` | `number` / `boolean` | computed-with-override, Default aus `referenceData.grundbuchProzentDefault` |
| `maklerprovisionProzent` / `-Override` | `number` / `boolean` | computed-with-override, Default `MAKLERPROVISION_DEFAULT_PROZENT` |
| `sanierungsmodus` | `Sanierungsmodus` | `PAUSCHAL` (manueller Betrag) \| `GRANULAR` (aus `gewerke[]` summiert) |
| `sofortinvestitionPauschal` | `number` | Nur bei Modus `PAUSCHAL` verwendet |
| `gebaeudeWohnflaecheGesamt` | `number \| null` | Gesamtwohnfläche des Gebäudes/der WEG — Basis der Miteigentumsanteil-Herleitung |
| `miteigentumsanteilProzent` / `-Override` | `number` / `boolean` | computed-with-override; ohne `gebaeudeWohnflaecheGesamt` gilt immer 100% |
| `kaltmieteMonatlich` | `number` | € pro Monat |
| `mietsteigerungProzentJaehrlich` | `number` | Für den Vermögensverlauf |
| `wertsteigerungProzentJaehrlich` | `number` | Immobilienwert-Annahme, Default 2%/Jahr |
| `kostensteigerungProzentJaehrlich` | `number` | Laufende Kosten + Inflations-Näherung für die "real"-Linie |
| `hausgeldUmlagefaehigMonatlich` / `hausgeldNichtUmlagefaehigMonatlich` | `number` | € pro Monat |
| `grundsteuerJaehrlich` | `number` | Manuell (kein Hebesatz-Lookup) |
| `instandhaltungsruecklageMonatlich` / `-Override` | `number` / `boolean` | computed-with-override, Default aus Peters'scher Formel |
| `verwaltungskostenMonatlich` | `number` | € pro Monat |
| `leerstandsquoteProzent` | `number` | Reduziert die effektive Jahresmiete |
| `versicherungJaehrlich` | `number` | € pro Jahr |
| `versicherungUmlagefaehig` | `boolean` | Beeinflusst laufende Kosten vs. Nebenkostenabrechnung |
| `afaSatzProzent` / `-Override` | `number` / `boolean` | computed-with-override, Default aus Baujahr (§7 Abs. 4 EStG) |
| `afaSonderabschreibung` | `boolean` | Aktuell nur als Flag geführt (siehe `tax/afa.ts` für den genauen Effekt) |
| `financing` | `PropertyFinancingInput` | siehe unten |
| `gewerke` | `PropertyGewerkInput[]` | siehe unten |
| `exit` | `PropertyExitInput` | siehe unten |

### `PropertyFinancingInput`

| Feld | Typ | Beschreibung |
|---|---|---|
| `eigenkapital` | `number` | Nur bei `finanzierungsart: "MANUELL"` als Ausgangswert relevant |
| `zinssatzProzent` | `number` | Nominalzins während der Zinsbindung |
| `anfaenglicheTilgungProzent` | `number` | Anfänglicher Tilgungssatz |
| `zinsbindungJahre` | `number` | Nach Ablauf: Anschlussfinanzierung |
| `finanzierungsart` | `Finanzierungsart` | `FINANZIERUNG_100` (Bank finanziert Kaufpreis) \| `FINANZIERUNG_110` (+ Nebenkosten) \| `MANUELL` (feste EK-Quote) |
| `eigenkapitalquoteManuellProzent` | `number \| null` | Nur bei `MANUELL` |
| `anschlusszinsAufschlagProzent` | `number` | Aufschlag in Prozentpunkten nach Zinsbindungsende |
| `sondertilgungProzent` | `number` | % der ursprünglichen Darlehenssumme, jährlich |
| `sondertilgungMaxProzent` | `number` | Vertragliche Obergrenze, deckelt `sondertilgungProzent` |

### `PropertyGewerkInput` (je Eintrag in `gewerke[]`)

| Feld | Typ | Beschreibung |
|---|---|---|
| `gewerk` | `Gewerk` | `DACH` \| `FENSTER` \| `HEIZUNG` \| `ELEKTRIK` \| `SANITAER_BAEDER` \| `MAUERWERK_FASSADE` \| `BODENBELAEGE` \| `SONSTIGES` |
| `zustand` | `number` | 1 (sehr gut) – 6 (sehr schlecht) |
| `eigentumsTyp` | `EigentumsTyp` | `SONDEREIGENTUM` \| `GEMEINSCHAFTSEIGENTUM` |
| `geschaetzteKostenOverride` | `number \| null` | Manuelle Kosten statt Formel-Schätzung |
| `baujahr` | `number \| null` | Einbaujahr — Alter-Kontext für Formel + Verhandlungsargumente |
| `verglasung` | `Verglasungsart \| null` | Nur bei `gewerk === "FENSTER"` ausgewertet |
| `sofortSanieren` | `boolean` | `false` → Betrag fließt nicht in die Sofortinvestition, nur informativ |

### `PropertyExitInput`

| Feld | Typ | Beschreibung |
|---|---|---|
| `geplant` | `boolean` | Ob ein Verkauf geplant ist |
| `haltedauerJahre` | `number` | Jahr des geplanten Verkaufs seit Kauf — Index ins `vermoegensverlauf`-Array für `exit/exit-szenario.ts`, außerdem Basis der Spekulationsfrist-Prüfung (`tax/spekulationssteuer.ts`) |

### `ProfileInput`

| Feld | Typ | Beschreibung |
|---|---|---|
| `nettoEinkommenMonatlich` | `number` | Für Affordability-Check |
| `bruttoEinkommenMonatlich` | `number` | Basis der zvE-Schätzung |
| `zuVersteuerndesEinkommenJaehrlich` | `number` | Nur bei `zvEOverride` genutzt |
| `zvEOverride` | `boolean` | computed-with-override für das zvE |
| `fixkostenMonatlich` | `number` | Rein informativ (Profil-Seite, Dashboard-Notgroschen-Kennzahl) |
| `vorhandenesEigenkapital` | `number` | Basis der Liquiditätsreserve-Prüfung |
| `maxSchuldendienstquoteProzent` | `number` | Default 35% |
| `mindestLiquiditaetsreserveEuro` | `number` | Default 10.000€ |
| `mietanrechnungProzent` | `number` | Anteil der Nettomiete, den die Bank als Einkommen anrechnet — Default 80% |
| `mindestEigenkapitalrenditeProzent` | `number` | Schwelle für die Kapitaleffizienz-Ampel — Default 4% |
| `eigenkapitalPruefungAbEuro` | `number` | Ab welchem EK-Einsatz die Kapitaleffizienz-Prüfung überhaupt greift — Default 5.000€ |
| `liabilities` | `UserLiabilityInput[]` | Bestehende Kredite (`bezeichnung`, `monatlicheRate`, `restschuld`) — die Rate fließt in die Schuldendienstquote ein |

### `ReferenceDataSnapshot`

Aggregiert die editierbaren Referenztabellen (`/immobilien/referenzdaten`) in das Lookup-Format, das die Engine braucht — siehe `src/server/data/reference-data.ts` für die Transformation aus den rohen Prisma-Tabellen.

| Feld | Typ | Beschreibung |
|---|---|---|
| `grunderwerbsteuerByBundesland` | `Record<Bundesland, number>` | Satz in % je Bundesland |
| `mietpreisByBundeslandLagetyp` | `Record<string, number>` | Key: `` `${bundesland}:${lagetyp}` `` |
| `gewerkKosten` | `Record<Gewerk, {min, max}>` | Kostenspanne je Gewerk |
| `instandhaltungssaetze` | `{von, bis, satz}[]` | Altersklassen-gestaffelt, für die Peters'sche Formel |
| `notarProzentDefault` / `grundbuchProzentDefault` | `number` | Bundesweite Standardsätze |
| `kaufpreisfaktorReferenzByObjekttypLagetyp` | `Record<string, number>` | Key: `` `${objekttyp}:${lagetyp}` `` |
| `nutzungsdauerJahreByGewerk` | `Record<Gewerk, number>` | Für das altersbasierte Verhandlungsargument |

## Ausgabe: `CalculationResult`

| Feld | Typ | Herkunft |
|---|---|---|
| `kaufnebenkosten` | `KaufnebenkostenResult` | `costs/kaufnebenkosten.ts` |
| `gewerke` | `GewerkeAuswertung` | `costs/gewerke.ts` |
| `instandhaltung` | `InstandhaltungResultForCalc` | `costs/instandhaltungsruecklage.ts` + Override-Logik in `engine.ts` |
| `finanzierung` | `FinanzierungResult` | `financing/darlehen.ts` |
| `tilgungsplan` | `TilgungsplanJahr[]` | `financing/tilgungsplan.ts`, 50 Einträge |
| `rendite` | `RenditeKennzahlen` | `rendite/renditekennzahlen.ts` |
| `vermoegensverlauf` | `VermoegensverlaufJahr[]` | `rendite/vermoegensverlauf.ts`, 50 Einträge |
| `meilensteine` | `Meilensteine` | `engine.ts` (aus Tilgungsplan abgeleitet) |
| `breakeven` | `BreakevenResult` | `rendite/breakeven.ts` |
| `affordability` | `AffordabilityResult` | `affordability/check.ts` |
| `kapitaleffizienz` | `KapitaleffizienzResult` | `rendite/kapitaleffizienz.ts` |
| `dealBreaker` | `{rechnetSich, meldung}` | `engine.ts` |
| `verhandlungsargumente` | `Verhandlungsargument[]` | `analyse/verhandlungsargumente.ts` |
| `annahmenWarnungen` | `AnnahmenWarnung[]` | `analyse/annahmen-warnungen.ts` — immer berechnet, unabhängig vom Exit-Szenario |
| `exitSzenario` | `ExitSzenarioResult \| null` | `exit/exit-szenario.ts` — `null` ohne `exit.geplant` oder bei `haltedauerJahre <= 0` |

Detaillierte Feldbeschreibungen der Unterobjekte (z. B. `RenditeKennzahlen`, `VermoegensverlaufJahr`) direkt als JSDoc-Kommentare in [`types.ts`](../../src/server/calc/types.ts) — bei Änderungen dort zuerst nachsehen/ergänzen, diese Datei verlinkt nur darauf statt sie zu duplizieren.

## Objekt-Formular (UI)

`src/components/forms/PropertyForm.tsx` (832 Zeilen, gemeinsam für Anlegen und Bearbeiten) — zweispaltiges Layout, rechte Spalte sticky:

- **Linke Spalte**: eine Card je Themenblock, in dieser Reihenfolge — Objekt (Stammdaten, Status-Badge), Quelle & Notizen, Ansprechpartner/Makler, Kaufnebenkosten (inkl. "Automatisch berechnen"-Button, der alle vier Override-Flags zurücksetzt), Sanierung/Sofortinvestition (bei Modus `GRANULAR` die Gewerke-Liste, siehe unten), Finanzierung, Miete & Wertentwicklung, Laufende Kosten, Steuer, Exit-Szenario.
- **Rechte Spalte** (nur wenn `wohnflaeche > 0`, sonst Platzhalter-Hinweis): Kennzahlen, "Rechnet sich das?" (Ampel + Begründung), Kapitaleffizienz, Annahmen-Warnungen (nur bei mindestens einem Fund), Verhandlungs-Argumente (nur bei mindestens einem Fund), Charts (`ObjektChartsPanel`, per `next/dynamic` nachgeladen — siehe [Geteilte UI-Bausteine](weitere-rechner.md#geteilte-ui-bausteine)).
- Live-Neuberechnung bei jeder Eingabe über `useWatch` + `berechneObjekt()` direkt im Client (kein Server-Roundtrip, ADR-0001) — mit `try/catch`: eine ungültige Zwischeneingabe zeigt einfach keine Kennzahlen statt einer kaputten Seite.
- Ausgelagerte Teile (Split 2026-08-23, vorher alles in einer 1072-Zeilen-Datei): `components/forms/Stat.tsx` (kleine Label/Wert-Anzeige, nur für dieses Formular — nicht zu verwechseln mit den strukturell ähnlichen, aber bewusst eigenständigen `Stat`-Komponenten in Steuerrechner/Sparziel/Finanzübersicht/ObjekteListClient/SzenarioClient, die je andere Props/Markup haben) und `components/forms/GewerkeSubform.tsx` (die dynamische Gewerke-Liste bei Sanierungsmodus `GRANULAR`, inkl. der Kosten-Formel-Erklärung pro Zeile).
- Fehlerdarstellung: `flattenFormErrors` (`src/lib/form-errors.ts`, geteilt mit `ProfileForm.tsx`).

## Objekt-Bibliothek & Vergleich (UI)

- **`/immobilien/objekte`**: Namenssuche kombinierbar mit Besitzstatus-/Ampel-Filtern (UND-Verknüpfung, "Alle" setzt den jeweiligen Filter zurück), "Alle sichtbaren auswählen" wirkt nur auf die aktuell gefilterten Objekte. Die Mehrfachauswahl-Checkboxen speisen sowohl das Vergleichs-Formular (natives GET-Formular) als auch einen "Ausgewählte löschen"-Button (`loescheObjekte`-Server-Action, ein `deleteMany` statt N Einzel-Requests).
- **`/immobilien/objekte/vergleich`**: sticky erste Spalte ("Kennzahl") für die Lesbarkeit bei vielen verglichenen Objekten. Die Vergleichs-Diagramme (Balken- wie Liniendiagramm) weisen jedem Objekt über `src/lib/chart-colors.ts` (`farbeFuerIndex`) eine garantiert eindeutige Farbe zu — kuratierte Palette für die ersten 12, danach Goldener-Winkel-Verteilung, statt eine kurze Palette zyklisch zu wiederholen (hätte ab dem 7. Objekt Farben doppelt vergeben). React-Keys nutzen die Objekt-ID statt des Namens, da Namen nicht garantiert eindeutig sind.
- **Duplizieren** (`dupliziereObjekt`, `src/server/actions/property.ts`) hängt beim Anlegen der Kopie `" (Kopie)"` an den Namen — dupliziert man eine bereits kopierte Objekt-Kopie, wird ein vorhandenes `" (Kopie)"`-Suffix zuerst entfernt und einmal neu angehängt, statt sich endlos zu stapeln (`Objekt (Kopie) (Kopie) (Kopie)...`).
- **`scripts/import-objekte.ts`** und die Server Actions (`erstelleObjekt`/`aktualisiereObjekt`) teilen sich `splitPropertyData` (`src/server/data/mappers.ts`) für die Umwandlung von validierten Formularwerten in die Prisma-Create/Update-Form (u. a. `kaufdatum`-String → `Date`, `besitzstatus` von der Property- auf die Asset-Ebene).
- **`loading.tsx`** (Next.js App-Router-Konvention, `src/components/ui/Skeleton.tsx`) auf den meisten Datenrouten unter `/immobilien/`, damit Navigation nicht als leere Pause wirkt.

## Bekannte Vereinfachungen (Immobilien-Rechner)

- **Tilgungsplan**: simuliert nach Ablauf der Zinsbindung EINMALIG eine Anschlussfinanzierung (neuer Zins = bisheriger Zins + frei definierbarer Aufschlag in Prozentpunkten, Default 1 Prozentpunkt; Annuität wird mit gleichem Tilgungssatz auf die dann aktuelle Restschuld neu berechnet) — keine wiederkehrende Anschlussfinanzierung bei mehrfachem Zinsbindungsablauf innerhalb des Betrachtungszeitraums. Zusätzlich lässt sich eine jährliche Sondertilgung hinterlegen (% der ursprünglichen Darlehenssumme, gedeckelt auf eine ebenfalls frei definierbare vertragliche Max-Grenze, Default 5%) — sie beschleunigt Restschuld-Tilgung und Volltilgungszeitpunkt, wirkt sich aber bewusst nicht auf die laufende Cashflow-/Schuldendienst-Berechnung aus (wie eine zusätzliche Kapitaleinlage behandelt, nicht wie eine laufende Kostenposition).
- **Steuer**: Grenzsteuersatz nach §32a EStG, AfA, Spekulationssteuer sind Näherungen für die Investitionsentscheidung, keine Steuerberatung — Zonenwerte in `src/server/calc/tax/estg-zonen.ts` vor wichtigen Entscheidungen gegen die aktuelle BMF-Veröffentlichung prüfen. Das zvE wird ohne Override grob aus dem Brutto-Einkommen geschätzt (Pauschbeträge für Werbungskosten/Sonderausgaben, ~20% pauschale Vorsorgeaufwendungen) — für Genauigkeit das echte zvE aus dem Steuerbescheid manuell eintragen.
- **Exit-Szenario**: Buchwert für die Spekulationssteuer = Gesamtinvestition (Kaufpreis + Kaufnebenkosten + Sofortinvestition) minus kumulierte AfA bis zum Verkaufsjahr (AfA-Satz wird wie im Vermögensverlauf über die Haltedauer konstant angenommen) — keine separate Grundstücksanteil-Betrachtung. Verkaufspreis und Restschuld stammen aus dem `vermoegensverlauf`-Eintrag zum Jahr `haltedauerJahre`; bei einer Haltedauer über `VERMOEGENSVERLAUF_MAX_JAHRE` hinaus wird der letzte verfügbare Eintrag verwendet.
- **Annahmen-Warnungen**: rein hinweisend (keine Kaufpreis-/Ampel-Auswirkung) — Leerstandsquote < 1%, Wert- oder Mietsteigerung > 3%/Jahr gelten als unrealistisch günstig. Feste Schwellen, keine Herleitung aus Referenzdaten.
- **Referenzdaten**: Grunderwerbsteuer, Mietpreise, Sanierungskosten, Instandhaltungssätze, Notar-/Grundbuch-Standardsätze sind Startwerte ohne Live-Anbindung, aber auf `/immobilien/referenzdaten` frei editierbar.
- **Vermögensverlauf**: schreibt Miete und laufende Kosten mit getrennten, jährlichen Raten fort (Mietsteigerung bzw. Kostensteigerung) und übernimmt Zins/Tilgung Jahr für Jahr aus dem echten Tilgungsplan — Grenzsteuersatz und AfA bleiben dabei über die gesamte Laufzeit konstant (keine Simulation von Einkommensänderungen oder Sonderabschreibungs-Auslauf). Wertsteigerung der Immobilie (Default 2%/Jahr, angelehnt ans EZB-Inflationsziel) ist eine reine Annahme, keine Prognose. Die zusätzliche "real"-Linie im Chart rechnet mit derselben Kostensteigerungsrate als Inflations-Näherung inflationsbereinigt — kein separat modelliertes CPI.
- **Grundsteuer**: wird als vollständig umlagefähig (cash-neutral) behandelt und nicht automatisch berechnet, da der Betrag vom Hebesatz der jeweiligen Gemeinde abhängt.
- **Verhandlungsargumente** (Objekt-Detailseite): rein aus den eigenen Modelldaten abgeleitete Fakten (Gewerke-Zustand, Gewerke-Alter vs. übliche Nutzungsdauer, Instandhaltungs-Unterdeckung, Break-even-Kaufpreis, Kaufpreisfaktor-Vergleich) — keine Rechtsberatung. Ein Gewerk löst entweder das zustandsbasierte oder das altersbasierte Argument aus, nie beide gleichzeitig (kein Doppelzählen). Nutzen die selbst editierbaren Referenzwerte auf `/immobilien/referenzdaten` (Startwerte, keine echten Marktdaten).
- **Gewerke**: je Posten lassen sich optional Baujahr/Einbaujahr und (nur bei Fenstern) die Verglasungsart hinterlegen — beides fließt in die Sanierungskosten-Schätzung ein (Verglasungsfaktor) bzw. in das altersbasierte Verhandlungsargument. Das Zustand-Feld (1–6) hat gewerkspezifische Kurzbeschreibungen hinter einem "i"-Tooltip (z. B. bedeutet Zustand 3 bei einem Dach etwas anderes als bei einer Heizung) — reine Einschätzungshilfe, ersetzt keine fachliche Begutachtung. Der Schalter "Sofort sanieren" je Gewerk (Default an) entscheidet, ob der geschätzte Betrag in die Sofortinvestition einfließt oder nur informativ als "für später eingeplant" ausgewiesen wird — der Risiko-Score für die Instandhaltungsrücklage berücksichtigt weiterhin beide Gruppen unverändert.
- **AfA**: wird ohne Override automatisch aus dem Baujahr hergeleitet (§7 Abs. 4 EStG: 2%, bzw. 2,5% bei Baujahr vor 1925) und lässt sich wie die Kaufnebenkosten-Sätze manuell überschreiben.
- **Affordability**: die Schuldendienstquote rechnet dem Netto-Einkommen einen im Profil konfigurierbaren Anteil der erwarteten Nettomiete des Objekts hinzu (Default 80%, analog zur bankenüblichen Anrechnung der Kapitaldienstfähigkeit) — ein reiner Modell-Richtwert, keine Zusage einer Bank.
- **Kapitaleffizienz**: eigenständiges Signal, unabhängig von Cashflow und Schuldendienstquote — Gelb/Rot, wenn die EK-Rendite (Cashflow nach Steuer / EK-Einsatz) unter einer konfigurierbaren Mindestschwelle liegt (Default 4%), greift bewusst erst ab einem konfigurierbaren Mindest-EK-Einsatz (Default 5.000€), da die %-Rendite bei sehr kleinem EK-Einsatz stark schwankt.
- **Miteigentumsanteil**: ohne Angabe der Gesamtwohnfläche des Gebäudes wird über die eigene Wohnfläche geschätzt (Näherung: Miteigentumsanteil ≈ Wohnflächenanteil). Mit Gesamtwohnfläche lässt sich der tatsächliche Anteil (z. B. aus Grundbuch/Teilungserklärung) manuell überschreiben — im Default-Fall (ohne Override) mathematisch identisch zum reinen Wohnflächenanteil.
- **Quelle & Notizen**: jedes Objekt hat ein Freitext-/Link-Feld — rein informativ, fließt nicht in die Kalkulation ein. Gedacht u. a. dafür, bei recherchierten/importierten Objekten zu dokumentieren, welche Werte real aus dem Exposé stammen und welche geschätzt wurden (siehe `npm run import:objekte` in der Haupt-README).
