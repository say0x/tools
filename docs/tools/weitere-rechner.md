# Weitere Rechner — Referenz

Referenz für die freistehenden Zusatz-Tools sowie Dashboard und Daten-Backup. Alle Rechner auf dieser Seite sind reine UI-Kompositionen aus bereits vorhandenen, getesteten Calc-Engine-Funktionen (siehe [`immobilien-rechner.md`](immobilien-rechner.md) und [`finanzuebersicht-und-szenarien.md`](finanzuebersicht-und-szenarien.md)) — keine eigene Berechnungslogik, keine Datenbank-Schema-Änderungen dafür nötig.

## Sparziel-Rechner (`/sparziel`)

- Reiner Client-Rechner ohne Datenbank-Anbindung.
- Nutzt direkt `berechneSparpositionsverlauf` (`src/server/calc/rendite/portfolioverlauf.ts`) — dieselbe Formel wie in Finanzübersicht/Szenarien, nur ohne Persistenz.
- Gibt Kapital nach 10/20 Jahren sowie das erste Jahr aus, in dem ein frei wählbarer Zielbetrag erreicht wird (`findeJahrBisZielbetrag`, `src/server/calc/rendite/sparziel.ts`).
- Horizont ist auf 40 Jahre begrenzt, danach heißt es "nicht in 40 Jahren" statt zu extrapolieren.
- Gleiche Vereinfachung wie die Sparpositionen in der Finanzübersicht: Sparrate wird jährlich am Jahresanfang gutgeschrieben (kein unterjähriger Zinseszins), Rendite bleibt über den gesamten Zeitraum konstant.

## Steuerrechner (`/steuerrechner`)

- Reiner Client-Rechner, nutzt dieselben Tarif-Funktionen wie das Profil (`berechneEinkommensteuer`, `berechneGrenzsteuersatz` aus `src/server/calc/tax/grenzsteuersatz.ts`, `schaetzeZvEAusBrutto` aus `tax/zve-schaetzung.ts`) — unabhängig vom dort hinterlegten Wert, für schnelle Was-wäre-wenn-Einkommensfragen.
- Zeigt zvE, Einkommensteuer, Grenz- und Durchschnittssteuersatz sowie eine Kurve des Grenzsteuersatzes über zvE von 0 bis 300.000€ mit einem Marker beim eigenen zvE.
- Bildet nur die Einkommensteuer nach §32a EStG ab — Solidaritätszuschlag, Kirchensteuer und Sozialabgaben sind nicht modelliert.
- **Recharts-Stolperstein**: die `ReferenceDot`-Markierung im Chart rendert nur mit explizitem `type="number"` auf der `XAxis` — sonst behandelt Recharts die Achse als Kategorie-Skala und die Markierung verschwindet lautlos (kein Konsolenfehler). Beim nächsten Chart mit `ReferenceDot`/`ReferenceLine` auf einer numerischen Achse daran denken.

## Kreditvergleich (`/kreditvergleich`)

- Zwei frei konfigurierbare Kredite nebeneinander, nutzt direkt `berechneTilgungsplan` (`src/server/calc/financing/tilgungsplan.ts`) — dieselbe Funktion wie im Immobilien-Rechner, hier aber ohne dass ein Objekt existieren muss.
- Zeigt monatliche Rate (Jahr 1, aus Zins + Tilgung des ersten Jahres), Zinskosten gesamt über den Betrachtungszeitraum, Restschuld nach 30 Jahren und das Volltilgungsjahr, dazu einen Restschuld-Verlauf-Chart.
- Farbzuweisung im Chart über `farbeFuerIndex` (`src/lib/chart-colors.ts`, siehe unten) statt fester Palette.

## Kaufen oder Anlegen? (`/kaufen-oder-anlegen`)

- Wählt ein Objekt aus der Bibliothek (gefiltert auf alles außer `VERKAUFT`/`ARCHIVIERT` — für längst verkaufte/nicht mehr relevante Objekte ist "kaufen oder anlegen" keine sinnvolle Frage mehr) und vergleicht dessen Vermögensverlauf (Eigenkapitalanteil + aufgelaufener Cashflow nach Steuer, aus `berechneObjekt`) gegen eine Einmalanlage derselben Eigenkapitalsumme zu einer frei wählbaren Rendite (`berechneSparpositionsverlauf`, ohne Sparplan). Horizont ist fix 50 Jahre (`VERMOEGENSVERLAUF_MAX_JAHRE`), nicht wählbar.
- Die Renditeannahme ist mit der Ø-Rendite der eigenen, besessenen Wertpapierdepots vorbelegt (`page.tsx`, gefiltert auf `besitzstatus === "BESITZE_ICH"`), statt einen Schätzwert neu eintippen zu lassen — die Annahme steht für dieselben Depots ja schon in der Finanzübersicht. Ohne besessene Depots bleibt der bisherige Fallback von 6%. In beiden Fällen frei überschreibbar.
- Bewusst als Lump-Sum-Vergleich, **nicht** als klassischer "Miete vs. Eigennutzung"-Rechner: die Objekte in diesem Tool sind grundsätzlich als vermietete Kapitalanlage modelliert (Kaltmiete-Feld, Cashflow-Berechnung setzt einen Mieter voraus), nicht als selbstgenutzte Immobilie — ein Miete-vs-Kauf-Vergleich im klassischen Sinn (Wohnkosten mieten vs. Wohnkosten Eigentum) würde ein eigenes Datenmodell für Wohnkosten brauchen, das es hier nicht gibt.

## Profil (`/profil`)

- `ProfileForm.tsx`, vier Cards: **Einkommen & Budget** (Brutto-/Netto-Einkommen, zvE als computed-with-override mit Live-Schätzung aus dem Brutto, Fixkosten → verfügbares Budget wird live berechnet und angezeigt), **Affordability-Schwellen** (`maxSchuldendienstquoteProzent`, `mindestLiquiditaetsreserveEuro`, `mietanrechnungProzent` — steuern den Affordability-Check im Immobilien-Rechner), **Kapitaleffizienz-Schwellen** (`mindestEigenkapitalrenditeProzent`, `eigenkapitalPruefungAbEuro` — steuern die Kapitaleffizienz-Ampel), **Bestehende Kredite** (`UserLiability[]`, dynamische Liste über `useFieldArray` — deren `monatlicheRate` fließt in die Schuldendienstquote ein; `restschuld` wird erfasst/gespeichert/exportiert und fließt in die Dashboard-Netto-Vermögens-Zeile ein, sonst in keiner weiteren Kennzahl verrechnet).
- Singleton (`UserProfile`, kein Auth/Multi-Tenancy, siehe [ADR-0006](../architecture/decisions/0006-kein-app-level-login.md)) — die hier hinterlegten Werte fließen über `ProfileInput` in praktisch jede Kennzahl des Immobilien-Rechners ein (Grenzsteuersatz, Affordability-Ampel, Kapitaleffizienz-Ampel, Dashboard-Notgroschen-Kennzahl).
- Fehlerdarstellung nutzt wie `PropertyForm.tsx` `flattenFormErrors` (`src/lib/form-errors.ts`, siehe [Geteilte UI-Bausteine](#geteilte-ui-bausteine) unten) für verschachtelte Formularfehler.

## Daten-Backup (`/profil`, unterer Bereich)

- `exportiereAlleDaten` (`src/server/actions/export.ts`) lädt einen JSON-Snapshot aller selbst eingegebenen Daten herunter (Objekte, Sparpositionen, Profil, Szenarien, Referenzdaten).
- Reine Sicherungskopie ohne Wiedereinspiel-Mechanismus — für Immobilien gibt es dafür den separaten Import-Weg über `data/import-objekte.json` + `npm run import:objekte` (siehe Haupt-README).
- Sinnvoll, weil es kein App-Login und keine Cloud-Synchronisation gibt (Docker-Volume ist die einzige Persistenz).

## Dashboard (`/`, Startseite)

Aggregiert Kennzahlen über alle Tools aus denselben Server-Loadern/Engine-Funktionen wie die Einzeltools — keine eigene Berechnungslogik.

- **Kennzahlen-Kacheln**: Anzahl Immobilien im Besitz, Summe aus Wertpapier-/Tagesgeld-Positionen mit Status `BESITZE_ICH`, deren monatlicher Immobilien-Cashflow (netto, alle besessenen Objekte), Anzahl gespeicherter Szenarien.
- **Rot-Ampel-Hinweis**: erscheint, falls mindestens ein besessenes Objekt auf Ampel Rot steht.
- **Vermögensverteilung** (`VermoegensverteilungChart.tsx`): horizontaler Balken, Immobilien-Eigenkapitalanteil vs. Bargeld & Depots (via `immobilienPositionAusErgebnis`, das seit der Doppelberechnungs-Behebung in `page.tsx` das bereits vorhandene `berechneObjekt`-Ergebnis wiederverwendet, statt wie `berechneImmobilienPositionen` — von der Finanzübersicht weiterhin direkt genutzt — selbst neu zu rechnen). Der Immobilien-Eigenkapitalanteil zählt hier bewusst NUR zur Verteilungsansicht mit (Frage: "wo steckt mein Vermögen?") — anders als in der Finanzübersicht, die ihn wegen ihrer Cashflow-only-Philosophie explizit ausklammert (siehe [`finanzuebersicht-und-szenarien.md`](finanzuebersicht-und-szenarien.md)). "Vermögen gesamt (Referenz)" ist eine Brutto-/Referenzgröße (Immobilien-EK-Anteil + Bargeld & Depots). Sind unter Profil → „Bestehende Kredite" Kredite mit Restschuld hinterlegt, erscheint darunter zusätzlich eine zweite Zeile "Netto (abzgl. Restschulden)" — die Referenzgröße abzüglich der Summe aller `UserLiability.restschuld`. Ohne erfasste Kredite bleibt die Netto-Zeile ausgeblendet, um keine redundante, identische Zahl zu zeigen.
- **Ampel-Verteilung**: reiner CSS-Balken (keine Chart-Bibliothek nötig) über alle besessenen Objekte.
- **Vier weitere Kennzahlen**:
  - Notgroschen-Reichweite: Tagesgeld ÷ Fixkosten/Monat aus dem Profil, in Monaten — bewusst nur Tagesgeld (nicht Wertpapierdepots, die erst verkauft werden müssten und im Kurs schwanken). Warnfarbe unter 3 Monaten.
  - Ø Bruttorendite über alle besessenen Objekte.
  - Größte Sparposition.
  - Grobe Näherung des Gesamtvermögens (Immobilien-EK-Referenz + Bargeld & Depots).

## Geteilte UI-Bausteine

- `src/lib/chart-colors.ts` (`farbeFuerIndex`): kuratierte Palette für die ersten 12 Objekte, danach Goldener-Winkel-Verteilung (137,508°) statt eine kurze Palette zyklisch zu wiederholen — verhindert, dass sich ab dem 7. verglichenen Objekt Farben doppeln (Objektvergleich, Kreditvergleich). Im Objektvergleich nutzen die React-Keys der Charts die Objekt-ID statt des Namens, da Namen nicht garantiert eindeutig sind (z. B. nach Duplizieren). Der Kreditvergleich hat kein Duplizieren/Hinzufügen und damit auch kein `id`-Feld — dort ist die feste Array-Position (immer genau 2 Einträge) als Key/`dataKey` unproblematisch.
- `src/lib/chart-ticks.ts` (`tickInterval`): begrenzt die X-Achsen-Beschriftung von Mehrjahres-Charts (bis zu 50 Jahre) auf ca. 10 sichtbare Ticks statt jedes einzelne Jahr zu beschriften.
- `src/components/ui/Skeleton.tsx`: Platzhalter-Baustein für `loading.tsx`-Dateien (Next.js App-Router-Konvention) — die meisten Datenrouten haben eins, in der ungefähren Form der echten Seite.
- `src/lib/form-errors.ts` (`flattenFormErrors`): sammelt verschachtelte react-hook-form-Fehlermeldungen (auch Array-Felder wie `gewerke[]`/`liabilities[]`) rekursiv in eine flache Liste für die "Bitte folgende Angaben korrigieren"-Card. Genutzt von `PropertyForm.tsx` und `ProfileForm.tsx` — beide hatten vorher je eine eigene, identische Kopie dieser Funktion (gefunden und zusammengeführt beim `PropertyForm.tsx`-Split).
- Diagramm-lastige Stellen (Objektvergleich, Objekt-Formular, Finanzübersicht, Szenario-Detail, Dashboard) laden ihre Recharts-Komponenten per `next/dynamic` erst bei Bedarf nach, statt sie fest ins jeweilige Seiten-Bundle zu backen. In Server Components ist `ssr:false` dabei nicht erlaubt (Next.js-Einschränkung) — dort reicht der dynamische Import allein für den separaten Chunk.
- `src/components/layout/Nav.tsx`: zweigeteilte Navigation, damit die Kopfzeile bei inzwischen 10 Tools nicht überläuft. `primaryLinks` (Start, Immobilien, Finanzübersicht, Szenarien) stehen immer sichtbar in der Kopfzeile; `secondaryLinks` (Sparziel, Steuer, Kreditvergleich, Kaufen/Anlegen, dann getrennt durch eine Trennlinie: Profil, Referenzdaten) stecken im "Weitere Tools"-Dropdown. Ein neuer Rechner gehört fast immer in `secondaryLinks` — `primaryLinks` bewusst kurz halten, sonst wiederholt sich das ursprüngliche Überlauf-Problem. Der Dropdown ist eine eigene, leichtgewichtige Implementierung ohne externe Abhängigkeit (Klick-außerhalb + Escape schließen ihn, `aria-haspopup`/`aria-expanded` am Trigger, `role="menu"`/`role="menuitem"` im Panel) — kein Headless-UI-artiges Paket im Projekt vorhanden, daher nicht wiederverwendet, sondern lokal gebaut. Fokus-Ringe kommen vom Browser-Default (kein `outline-none` auf Trigger oder Menüpunkten), analog zu den übrigen reinen `<Link>`-Elementen der Nav. Die mobile Ansicht (Hamburger-Menü) zeigt stattdessen alle Links flach untereinander, `primaryLinks` und `secondaryLinks` nur durch eine dünne Trennlinie geschieden — kein verschachteltes Dropdown im ohnehin schon vertikalen Mobile-Menü.
