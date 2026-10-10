# Fitness & Ernährung — Referenz

Kalorienbedarf, Ernährungstagebuch, Training, Gewichtsverlauf und Sport-Rechner unter `/fitness`. Wie im Immobilien-Teil speichert die Datenbank nur Rohwerte; jede abgeleitete Zahl (Grundumsatz, Kalorienziel, Makros, Trainingsverbrauch, Tagesbilanz, Trend, Prognose) rechnet der framework-freie Kern unter [`src/server/calc/fitness/`](../../src/server/calc/fitness/) zur Laufzeit ([ADR-0001](../architecture/decisions/0001-framework-freier-rechenkern.md)).

> Richtwerte für gesunde Erwachsene — keine medizinische oder ernährungstherapeutische Beratung. Bei Vorerkrankungen, Schwangerschaft oder sehr starkem Über-/Untergewicht gelten andere Werte.

## Seiten

| Pfad | Inhalt |
|---|---|
| `/fitness` | Tagesübersicht (per `?datum=JJJJ-MM-TT` auch für vergangene Tage): Kalorienziel, Gegessen, Training, Verbleibend; Makro-Fortschritt; Wasser-Schnellbuttons (+250/+500/−250 ml), Schritte/Schlaf/Ruhepuls; Mahlzeiten nach Mahlzeit gruppiert; Trainings des Tages; 7-Tage-Diagramm Zufuhr vs. Budget mit Wochenstatistik |
| `/fitness/ernaehrung` | Ernährungstagebuch: Lebensmittel-Datenbank (Suche + Menge → Nährwerte live), manuelle Eingabe, eigene Lebensmittel (je 100 g) anlegen/löschen; Einträge des Tages |
| `/fitness/training` | Training eintragen mit Live-Schätzung des Mehrverbrauchs, Override für Sportuhr-Werte; Kennzahlen 7/30 Tage; Liste der letzten 30 Tage |
| `/fitness/gewicht` | Gewicht + optional Körperfett je Tag; 7-Tage-Durchschnitt, Veränderung 7/30 Tage, Trend kg/Woche, BMI, Ziel-Prognose; Diagramm mit echter Zeitachse |
| `/fitness/rechner` | Freistehend, ohne Speichern: Lauf-Pace & Wettkampfprognose (Riegel), Herzfrequenzzonen (Tanaka/Karvonen), 1RM (Epley/Brzycki) |
| `/fitness/profil` | Körperdaten & Ziele mit Live-Vorschau des Bedarfs (Grundumsatz → Gesamtumsatz → Ziel → Makros → Wasser → BMI) |

Das Start-Dashboard (`/`) zeigt zusätzlich eine Karte „Fitness heute", sobald Profil und Gewicht vorhanden sind.

## Modul-Landkarte

| Datei | Zuständigkeit | Wichtigste Exporte |
|---|---|---|
| `calc/fitness/types.ts` | Domain-Typen, Enums als String-Unions | `FitnessProfilInput`, `Naehrwerte`, `TrainingEintragInput`, `SPORTARTEN`, … |
| `calc/fitness/datum.ts` | Kalendertage als ISO-String, Zeitzone | `heuteIso`, `addiereTage`, `tageImBereich`, `istIsoDatum` |
| `calc/fitness/energiebedarf.ts` | Grundumsatz, PAL, Ziel, Makros, Wasser, BMI | `berechneEnergiebedarf`, `berechneGrundumsatz`, `berechneMakroziele`, `berechneBmi`, `PAL_FAKTOR` |
| `calc/fitness/training.ts` | Trainingsverbrauch (computed-with-override) | `schaetzeTrainingsverbrauch`, `effektiverTrainingsverbrauch`, `MET_WERTE` |
| `calc/fitness/tagesbilanz.ts` | Summen, Budget, Makro-Fortschritt | `berechneTagesbilanz`, `naehrwerteFuerMenge`, `summiereNaehrwerte` |
| `calc/fitness/gewichtstrend.ts` | Glättung, Regression, Prognose | `berechneGewichtsverlauf`, `glaetteGewichte`, `berechneTrendKgProTag`, `gewichtAmDatum` |
| `calc/fitness/wochenstatistik.ts` | Zeitraum-Aggregation | `berechneZeitraumstatistik`, `letzteTage` |
| `calc/fitness/sportrechner.ts` | Pace, Riegel, HF-Zonen, 1RM | `riegelPrognoseSekunden`, `berechneHerzfrequenzzonen`, `schaetzeEinerMaximum`, … |
| `server/data/fitness.ts` | Lesen/Schreiben, **userId immer explizit** | `ladeFitnessTag`, `ladeFitnessZeitraum`, `ladeGewichtsverlauf`, `erstelleMahlzeitenFuerUser`, … |
| `server/data/fitness-backup.ts` | Export/Restore-Format des Fitness-Teils | `exportiereFitnessDaten`, `fitnessBackupSchema`, `stelleFitnessDatenWieder` |
| `server/data/lebensmittel-startwerte.ts` | 70 Startwerte der Lebensmittel-Datenbank | `LEBENSMITTEL_STARTWERTE` |
| `server/actions/fitness-schema.ts` | Zod-Validierung aller Schreibwege | `fitnessProfilSchema`, `mahlzeitSchema`, `trainingSchema`, `tagesAktivitaetSchema`, … |
| `server/actions/fitness.ts` | Server Actions (`ActionResult`, [ADR-0008](../architecture/decisions/0008-server-actions-geben-ergebnis-zurueck-statt-zu-werfen.md)) | `speichereFitnessProfil`, `erstelleMahlzeiten`, `erstelleTraining`, `addiereWasser`, … |

Die Datenzugriffs-Funktionen nehmen die `userId` als Parameter, statt selbst `getActiveUserId()` aufzurufen — so nutzen Server Actions (Cookie-Nutzer) und künftige Schnittstellen (z. B. eine Token-API) exakt dieselben Lese-/Schreibwege und dieselbe Validierung. Gelöscht wird immer per `(id, userId)`; ein fremder oder erfundener Eintrag liefert „nicht gefunden" statt gelöscht zu werden.

## Formeln & Quellen

### Energiebedarf (`energiebedarf.ts`)

1. **Grundumsatz** nach Mifflin-St Jeor (1990): `10 · kg + 6,25 · cm − 5 · Alter + 5` (Männer) bzw. `− 161` (Frauen). Alter = Bezugsjahr − Geburtsjahr.
2. **Gesamtumsatz ohne Sport** = Grundumsatz × PAL. Die PAL-Werte beschreiben nur Beruf und Alltagswege (angelehnt an die DGE-Referenzwerte): Sitzend 1,4 · Leicht 1,5 · Mäßig 1,65 · Aktiv 1,85 · Sehr aktiv 2,1. Die klassischen Harris-Benedict-Faktoren (1,2–1,9) enthalten Sport bereits — hier würde er sonst doppelt gezählt, weil Training separat erfasst und aufs Budget aufgeschlagen wird.
3. **Ziel-Anpassung** = Tempo (kg/Woche) × 7.700 kcal ÷ 7 Tage — negativ beim Abnehmen, positiv beim Zunehmen, 0 beim Halten. Beispiel: 0,5 kg/Woche → 550 kcal/Tag.
4. **Untergrenze**: ein berechnetes Ziel fällt nie unter `max(Grundumsatz, 1.500 kcal ♂ / 1.200 kcal ♀)` — wird angehoben, zeigt die UI den Hinweis „Defizit begrenzt". Ein **manuelles Kalorienziel** (computed-with-override, [ADR-0005](../architecture/decisions/0005-computed-with-override-pattern.md)) gewinnt immer; liegt es unter der Untergrenze, wird es nur markiert.
5. **Makros**: Protein = g/kg × aktuelles Körpergewicht (Default 1,8); Fett = Fettanteil (Default 30 %) der Kalorien ÷ 9; Kohlenhydrate = Rest ÷ 4, nie negativ (Hinweis, falls Protein + Fett das Ziel schon ausschöpfen).
6. **Wasser**: 35 ml je kg, auf 50 ml gerundet, mindestens 1,5 l — oder ein eigenes Wasserziel.
7. **BMI** = kg ÷ m², WHO-Kategorien (< 18,5 / < 25 / < 30 / ≥ 30). Unterscheidet nicht zwischen Muskel- und Fettmasse — die UI sagt das dazu.

### Trainingsverbrauch (`training.ts`)

Gespeichert und aufs Budget angerechnet wird der **Netto-Mehrverbrauch gegenüber Ruhe**: `(MET − 1) × kg × Stunden`. Die eine MET Ruheumsatz während der Trainingszeit steckt bereits im Gesamtumsatz.

| Methode | Wann | Formel |
|---|---|---|
| `LAUFDISTANZ` | Laufen mit Distanz | `1 kcal × kg × km` (brutto, tempounabhängige Faustregel) minus Ruheanteil `kg × h` |
| `RADTEMPO` | Radfahren mit Distanz | MET aus Ø-Tempo: < 16 km/h 4,0 · < 19 6,8 · < 22 8,0 · < 25,5 10,0 · < 30,5 12,0 · darüber 15,8 |
| `MET` | sonst | MET-Tabelle je Sportart × Intensität (Compendium of Physical Activities, gerundet), z. B. Laufen 7,0/9,8/11,5 · Krafttraining 3,5/5,0/6,0 · Yoga 2,5/3,3/4,0 |
| `MANUELL` | Override gesetzt | eigener Wert (z. B. Sportuhr) |

Ohne Override wird der Verbrauch **bei jedem Lesen neu** mit dem Gewicht des jeweiligen Tages geschätzt (nicht gespeichert) — eine nachgetragene Gewichtsmessung korrigiert alte Trainings automatisch. Solange noch nie gewogen wurde, rechnet der Kern mit einem Platzhalter von 70 kg und die UI weist darauf hin.

### Tagesbilanz (`tagesbilanz.ts`)

`Budget = Kalorienziel + Trainingsverbrauch` (letzterer nur, wenn „Trainingsverbrauch anrechnen" im Profil aktiv ist), `Verbleibend = Budget − Zugeführt`. **Schritte erhöhen das Budget bewusst nicht** — die Alltagsbewegung steckt im Aktivitätslevel. Nährwerte aus der Lebensmittel-Datenbank: `Wert je 100 g × Menge ÷ 100`.

### Gewichtsverlauf (`gewichtstrend.ts`)

- **7-Tage-Durchschnitt** je Messung über alle Messungen der letzten 7 Kalendertage (fehlende Tage werden nicht aufgefüllt).
- **Trend** = Steigung der Regressionsgeraden über die letzten 28 Tage, braucht ≥ 3 Messungen, die ≥ 7 Tage auseinanderliegen.
- **Prognose** gegen das Zielgewicht: `ERREICHT` (< 0,3 kg Abstand), `ZU_WENIG_DATEN`, `STAGNATION` (< ~35 g/Woche oder > 3 Jahre), `FALSCHE_RICHTUNG`, sonst `IN_RICHTUNG` mit Datum = heute + Abstand ÷ Trend.
- Die **Wochenbilanz** rechnet zusätzlich `Σ (Zufuhr − Budget) ÷ 7.700` als „rechnerische Veränderung" — reine Energiebilanz, kein Messwert.

### Sport-Rechner (`sportrechner.ts`)

- **Riegel** (1977): `T₂ = T₁ · (D₂/D₁)^1,06` — gilt bei passendem Ausdauertraining, für den Marathon ohne entsprechende Umfänge meist zu optimistisch.
- **Maximalpuls** nach Tanaka et al. (2001): `208 − 0,7 · Alter`; Zonen mit Ruhepuls nach Karvonen (`Ruhe + % · (Max − Ruhe)`), sonst Prozent von HFmax (50/60/70/80/90/100 %).
- **1RM**: Epley `w · (1 + r/30)`, Brzycki `w · 36/(37 − r)` (nur bis 36 Wdh.), angezeigt wird der Mittelwert plus eine Gewichtstabelle für 1–15 Wiederholungen (Epley invertiert).

## Datenmodell

Alle Tabellen hängen per `userId` am `User` (`onDelete: Cascade`, [ADR-0009](../architecture/decisions/0009-lokales-mehrbenutzer-datenmodell.md)). Kalendertage sind `@db.Date`; „heute" bestimmt die App in **Europe/Berlin** (`heuteIso()`), nicht in der UTC-Zeit des Containers — sonst wäre zwischen 0 und 2 Uhr noch gestern.

| Tabelle | Besonderheit |
|---|---|
| `FitnessProfil` | 1:1 je User; `kalorienzielKcal` + `kalorienzielOverride` (computed-with-override) |
| `GewichtEintrag` | `@@unique([userId, datum])` — ein Wert pro Tag, erneutes Speichern überschreibt (z. B. Smart-Waage, die mehrfach täglich sendet) |
| `MahlzeitEintrag` | Mahlzeit, Nährwerte, `quelle` (`MANUELL`/`LEBENSMITTEL_DB`/`FOTO_KI`/`API`), optional `kiKonfidenz` |
| `TrainingEintrag` | `kcalVerbrauch` wird nur bei Override gespeichert |
| `TagesAktivitaet` | `@@unique([userId, datum])`; Teil-Updates: nicht gesendete Felder bleiben, `null` löscht |
| `EigenesLebensmittel` | Nährwerte je 100 g + Standardportion |
| `ReferenceLebensmittel` | global, per Seed befüllt (70 Einträge), Upsert-Schlüssel `bezeichnung` |

Die Startwerte der Lebensmittel-Datenbank liegen in `src/server/data/lebensmittel-startwerte.ts`; ein Test prüft jede Zeile auf `kcal ≈ 4·P + 4·KH + 9·F` (±15 %, Alkohol ausgenommen), um vertauschte Spalten oder Tippfehler zu fangen.

## Backup, Restore, Reset

- **Export** (Profil → Daten-Backup) enthält einen Abschnitt `fitness` mit Profil, Gewichten, Mahlzeiten, Trainings, Tageswerten und eigenen Lebensmitteln — ohne IDs (zwischen den Fitness-Tabellen gibt es keine Fremdschlüssel).
- **Restore** validiert den Abschnitt mit denselben Zod-Schemas wie die Formulare und ersetzt dann alle Fitness-Daten des aktiven Users. **Ältere Backups ohne `fitness`-Abschnitt lassen die vorhandenen Fitness-Daten unangetastet**; die Vorschau zeigt das explizit an.
- **`npm run db:reset-user-data`** / `RESET_USER_DATA_ON_DEPLOY` löschen die Fitness-Daten aller User mit; die Lebensmittel-Datenbank ist Referenzdaten und bleibt.

## Bekannte Vereinfachungen

- Grundumsatz-Formeln haben eine individuelle Streuung von etwa ±10 %; das Kalorienziel ist ein Startwert, der nach 2–4 Wochen anhand des echten Gewichtstrends nachjustiert werden sollte (die Wochenbilanz vs. Trend auf `/fitness/gewicht` zeigt, ob es passt).
- Protein wird auf das aktuelle Körpergewicht bezogen — bei deutlichem Übergewicht eher großzügig; dann ggf. den g/kg-Wert senken.
- MET-Werte sind Durchschnittswerte; Sportuhren schätzen über die Herzfrequenz meist genauer (Override nutzen). Sportuhren zeigen fast immer den **Brutto**-Verbrauch — für das Budget etwas abziehen.
- Die Lebensmittel-Datenbank ist eine gerundete Startauswahl (±10–20 % Sortenschwankung), keine vollständige Nährwerttabelle; exakte Produkte als eigenes Lebensmittel anlegen.
- Keine Mikronährstoffe, Ballaststoffe oder Allergene.
- Der 7-Tage-Durchschnitt füllt Lücken nicht auf; bei sehr unregelmäßigem Wiegen ist der Trend entsprechend unsicher (Mindestanforderung siehe oben).
