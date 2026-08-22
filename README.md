# tools

Interne Tool-Suite von Dennis Kohnke — nicht öffentlich, für den Eigenbedarf im Homelab (`sayox.de`). Startet mit dem **Immobilien-Rechner**: Objekte erfassen, Kennzahlen live berechnen, speichern und vergleichen. Die **Finanzübersicht** aggregiert Wertpapierdepots, Tagesgeld und den Cashflow ausgewählter Immobilien auf demselben `Asset`-Datenmodell zu einem gemeinsamen Verlauf des tatsächlich verfügbaren Geldes (nominal & inflationsbereinigt) — Immobilienwerte selbst fließen dabei bewusst nicht ein, nur der Cashflow, den sie erwirtschaften. **Szenarien** beantworten "was wäre, wenn…?" (Immobilie kaufen/verkaufen, Sparrate ändern, einmalige Anschaffung), ohne jemals die echten Asset-Daten zu verändern — ein Szenario ist immer Basiszustand + Änderungen, nur zur Laufzeit kombiniert. Der **Sparziel-Rechner** ist ein freistehender Zinseszins-Rechner (Kapitalverlauf einer Sparrate über Zeit, Jahr bis zu einem Zielbetrag) ohne eigene Datenhaltung. Die Startseite (`/`) zeigt ein Dashboard mit den wichtigsten Kennzahlen über alle Tools hinweg (Immobilien im Besitz, Bargeld & Depots, monatlicher Immobilien-Cashflow, Anzahl Szenarien).

## Tech-Stack

- **Next.js 16** (App Router, TypeScript, Server Actions)
- **PostgreSQL** + **Prisma 7** (mit `@prisma/adapter-pg`, kein Rust-Query-Engine-Binary nötig)
- **Tailwind CSS 4**, eigene schlanke UI-Komponenten (shadcn/ui war zum Zeitpunkt der Erstellung über die Netzwerk-Policy nicht erreichbar)
- **Recharts** für Grafiken, **react-hook-form** + **zod** für Formulare/Validierung
- **Vitest** für die Berechnungs-Engine (`src/server/calc`)

## Architekturprinzip

Die Datenbank speichert ausschließlich Rohdaten. Alle Kennzahlen (Renditen, Tilgungsplan, Kostenschätzungen, Ampel-Status, Break-even-Kaufpreis) werden zur Laufzeit von der reinen, framework-freien Berechnungs-Engine unter `src/server/calc/` hergeleitet — sie hat keine Prisma- oder React-Abhängigkeit und läuft identisch server- wie clientseitig (für Live-Neuberechnung ohne Server-Roundtrip direkt im Formular).

Wiederkehrendes Datenmodell-Muster **"computed-with-override"**: ein Wertefeld + ein `xOverride`-Boolean. Ist der Override aus, berechnet die Engine einen Vorschlag (z. B. Grunderwerbsteuer aus dem Bundesland, Instandhaltungsrücklage aus Baujahr + Bauteilzustand); ist er an, gilt der manuell eingetragene Wert.

## Lokale Entwicklung

Voraussetzungen: Node.js 22+, eine laufende PostgreSQL-Instanz.

```bash
npm install
cp .env.example .env   # DATABASE_URL ggf. anpassen
npx prisma migrate dev
npx prisma db seed     # befüllt die Referenzdaten-Tabellen mit Startwerten
npm run dev
```

Ohne Docker lässt sich Postgres z. B. so lokal starten:

```bash
docker compose up -d postgres
```

### Tests

```bash
npm run test        # Vitest, insb. der Referenzobjekt-Test in src/server/calc/__tests__/engine.test.ts
```

### Objekte importieren (`data/import-objekte.json`)

Recherchierte Objekte (z. B. von Immobilienportalen zusammengetragen) lassen
sich über eine JSON-Datei einspielen, statt sie einzeln im Formular
anzulegen:

```bash
npm run import:objekte
```

Liest `data/import-objekte.json`, legt für jeden Eintrag ein neues Objekt mit
Standardwerten (`src/lib/property-form-defaults.ts`) als Basis an. Idempotent:
Einträge werden über `quelleUrl` (falls vorhanden) oder sonst über den Namen
dedupliziert — ein erneuter Lauf überspringt bereits importierte Objekte statt
Duplikate anzulegen. Jeder Eintrag sollte im `notizen`-Feld dokumentieren,
welche Werte real aus der Quelle stammen und welche geschätzt wurden (die
Datei ist danach kein Geheimnis — sie landet im Repo und kann jederzeit
erweitert werden).

## Deployment im Homelab (`tools.sayox.de`)

```bash
docker compose up -d --build
```

Das startet Postgres + die App (`Dockerfile`, Next.js `output: 'standalone'`). Der Container führt beim Start automatisch `prisma migrate deploy` aus (`docker-entrypoint.sh`), bevor der Server hochfährt.

Das `Dockerfile` nutzt BuildKit-Cache-Mounts für `npm ci` (`/root/.npm`) und für Next.js' eigenen Build-Cache (`/app/.next/cache`) — dadurch bleiben npm- und Turbopack-Zwischenstände über mehrere `docker compose up -d --build`-Läufe hinweg erhalten (auch wenn sich `package-lock.json` ändert oder ein `docker system prune` den Layer-Cache gelöscht hat), was wiederholte Rebuilds nach einem `git pull` spürbar beschleunigt. Erfordert BuildKit (Standard bei aktuellem Docker Compose).

**Einmalig nach dem ersten Deploy** die Referenzdaten befüllen:

```bash
docker compose exec app npx prisma db seed
```

(Danach nicht erneut ausführen, sonst werden manuelle Anpassungen auf der Referenzdaten-Seite überschrieben — der Seed läuft bewusst nicht automatisch bei jedem Start.)

Die App ist intern unter Port 3000 erreichbar; im Homelab per Reverse-Proxy auf `tools.sayox.de` mappen. Kein eigenes App-Level-Login eingebaut — die Absicherung erfolgt über das Docker-/Homelab-Netz bzw. den Reverse-Proxy (VPN-only o. ä.), da das Tool bewusst nicht öffentlich sein soll. Passend dazu setzt `src/app/layout.tsx` `robots: { index: false, follow: false }` (kein Sitemap/OG-Setup, da nicht für Suchmaschinen/Social-Previews gedacht) und jede Route hat einen eigenen `<title>` (`"%s · tools"`-Template, siehe `metadata`-Exports je `page.tsx`) sowie ein eigenes Favicon (`src/app/icon.png` / `apple-icon.png`, Next-16-App-Icon-Konvention).

## Projektstruktur (Auszug)

```
prisma/schema.prisma          Datenmodell (Asset, UserProfile, Property, Reference*)
prisma/seed.ts                 Startwerte für Referenztabellen
src/server/calc/                Framework-freie Berechnungs-Engine + Tests
src/server/actions/            Server Actions (Profil, Objekt-CRUD, Referenzdaten)
src/server/data/               Prisma-Reads + Mapper zu den Calc-Engine-Typen
src/components/forms/          PropertyForm (Objekt-Formular inkl. Live-Kennzahlen)
src/components/charts/         Recharts-Komponenten
src/app/immobilien/            Objekt-Bibliothek, -Formular, -Vergleich, Referenzdaten
src/app/finanzuebersicht/      Aggregierter Vermögensverlauf über Immobilien, Wertpapiere & Tagesgeld
src/app/szenarien/             "Was wäre wenn"-Szenarien (Basiszustand + Änderungen, verändert nie die echten Daten)
src/app/profil/                Nutzerprofil (Einkommen, Affordability-Schwellen)
src/app/sparziel/              Freistehender Zinseszins-/Sparziel-Rechner, ohne eigene Datenhaltung
src/app/page.tsx               Dashboard (Kennzahlen über alle Tools hinweg)
src/server/data/vermoegen.ts   Geteilte Asset-Aufbereitung (Immobilien-Cashflow, Sparpositionen) für Finanzübersicht + Szenarien
```

## Bekannte Vereinfachungen

- **Objekt-Bibliothek** (`/immobilien/objekte`): Namenssuche kombinierbar mit Besitzstatus-/Ampel-Filtern (UND-Verknüpfung, "Alle" setzt den jeweiligen Filter zurück), "Alle sichtbaren auswählen" wirkt nur auf die aktuell gefilterten Objekte. Die Mehrfachauswahl-Checkboxen speisen sowohl das Vergleichs-Formular (natives GET-Formular) als auch einen "Ausgewählte löschen"-Button (`loescheObjekte`-Server-Action, ein `deleteMany` statt N Einzel-Requests). Der Objektvergleich (`/immobilien/objekte/vergleich`) hat eine sticky erste Spalte ("Kennzahl") für die Lesbarkeit bei vielen verglichenen Objekten, und die Vergleichs-Diagramme (Balken- wie Liniendiagramm) weisen jedem Objekt über `src/lib/chart-colors.ts` eine garantiert eindeutige Farbe zu (kuratierte Palette für die ersten 12, danach Goldener-Winkel-Verteilung) statt eine kurze Palette zyklisch zu wiederholen, die ab dem 7. Objekt sonst Farben doppelt vergeben hätte.
- Tilgungsplan simuliert nach Ablauf der Zinsbindung EINMALIG eine Anschlussfinanzierung (neuer Zins = bisheriger Zins + frei definierbarer Aufschlag in Prozentpunkten, Default 1 Prozentpunkt; Annuität wird mit gleichem Tilgungssatz auf die dann aktuelle Restschuld neu berechnet) — keine wiederkehrende Anschlussfinanzierung bei mehrfachem Zinsbindungsablauf innerhalb des Betrachtungszeitraums. Zusätzlich lässt sich eine jährliche Sondertilgung hinterlegen (% der ursprünglichen Darlehenssumme, gedeckelt auf eine ebenfalls frei definierbare vertragliche Max-Grenze, Default 5%) — sie beschleunigt Restschuld-Tilgung und Volltilgungszeitpunkt, wirkt sich aber bewusst nicht auf die laufende Cashflow-/Schuldendienst-Berechnung aus (wie eine zusätzliche Kapitaleinlage behandelt, nicht wie eine laufende Kostenposition).
- Steuerliche Berechnungen (Grenzsteuersatz nach §32a EStG, AfA, Spekulationssteuer) sind Näherungen für die Investitionsentscheidung, keine Steuerberatung — Zonenwerte in `src/server/calc/tax/estg-zonen.ts` vor wichtigen Entscheidungen gegen die aktuelle BMF-Veröffentlichung prüfen.
- Referenzdaten (Grunderwerbsteuer, Mietpreise, Sanierungskosten, Instandhaltungssätze, Notar-/Grundbuch-Standardsätze) sind Startwerte ohne Live-Anbindung, aber auf `/immobilien/referenzdaten` frei editierbar.
- Cashflow-Fortschreibung über die Jahre (Vermögensverlauf-Chart) schreibt Miete und laufende Kosten mit getrennten, jährlichen Raten fort (Mietsteigerung bzw. Kostensteigerung) und übernimmt Zins/Tilgung Jahr für Jahr aus dem echten Tilgungsplan — Grenzsteuersatz und AfA bleiben dabei über die gesamte Laufzeit konstant (keine Simulation von Einkommensänderungen oder Sonderabschreibungs-Auslauf).
- Wertsteigerung der Immobilie (Default 2%/Jahr, angelehnt ans EZB-Inflationsziel) ist eine reine Annahme, keine Prognose, und wirkt unabhängig davon, ob ein Exit geplant ist. Die zusätzliche "real"-Linie im Vermögensverlauf-Chart rechnet mit derselben Kostensteigerungsrate als Inflations-Näherung inflationsbereinigt — kein separat modelliertes CPI.
- Das zu versteuernde Einkommen (zvE) wird ohne Override grob aus dem Brutto-Einkommen geschätzt (Pauschbeträge für Werbungskosten/Sonderausgaben, ~20% pauschale Vorsorgeaufwendungen) — für Genauigkeit das echte zvE aus dem Steuerbescheid manuell eintragen.
- Grundsteuer wird als vollständig umlagefähig (cash-neutral) behandelt und nicht automatisch berechnet, da der Betrag vom Hebesatz der jeweiligen Gemeinde abhängt.
- Die "Verhandlungs-Argumente" (Objekt-Detailseite) sind rein aus den eigenen Modelldaten abgeleitete Fakten (Gewerke-Zustand, Gewerke-Alter vs. übliche Nutzungsdauer, Instandhaltungs-Unterdeckung, Break-even-Kaufpreis, Kaufpreisfaktor-Vergleich) — keine Rechtsberatung. Ein Gewerk löst entweder das zustandsbasierte oder das altersbasierte Argument aus, nie beide gleichzeitig (kein Doppelzählen). Zustand-Kosten, Kaufpreisfaktor-Vergleich und übliche Nutzungsdauer je Gewerk nutzen die selbst editierbaren Referenzwerte auf `/immobilien/referenzdaten` (Startwerte, keine echten Marktdaten).
- Je Gewerke-Posten lassen sich optional Baujahr/Einbaujahr und (nur bei Fenstern) die Verglasungsart hinterlegen — beides fließt in die Sanierungskosten-Schätzung ein (Verglasungsfaktor) bzw. in das altersbasierte Verhandlungsargument.
- Der AfA-Satz wird ohne Override automatisch aus dem Baujahr hergeleitet (§7 Abs. 4 EStG: 2%, bzw. 2,5% bei Baujahr vor 1925) und lässt sich wie die Kaufnebenkosten-Sätze manuell überschreiben (computed-with-override).
- Die Schuldendienstquote im Affordability-Check rechnet dem Netto-Einkommen einen im Profil konfigurierbaren Anteil der erwarteten Nettomiete des jeweiligen Objekts hinzu (Default 80%, analog zur bankenüblichen Anrechnung der Kapitaldienstfähigkeit) — ein reiner Modell-Richtwert, keine Zusage einer Bank.
- Ein positiver Cashflow allein sagt nichts darüber aus, ob eingesetztes Eigenkapital gut arbeitet (z. B. bei viel EK statt eines größeren Kredits). Dafür gibt es das eigenständige Kapitaleffizienz-Signal: Gelb/Rot, wenn die EK-Rendite (Cashflow nach Steuer / EK-Einsatz) unter einer im Profil konfigurierbaren Mindestschwelle liegt (Default 4%) — greift bewusst erst ab einem konfigurierbaren Mindest-EK-Einsatz (Default 5.000€), da die %-Rendite bei sehr kleinem EK-Einsatz (nahe 100%-Finanzierung) stark schwankt. Bewusst getrennt von der "Rechnet sich das?"-Ampel (Cashflow + Schuldendienstquote), nicht damit verschmolzen.
- Das Zustand-Feld (1–6) je Gewerke-Posten hat gewerkspezifische Kurzbeschreibungen hinter einem "i"-Tooltip (z. B. bedeutet Zustand 3 bei einem Dach etwas anderes als bei einer Heizung) — reine Einschätzungshilfe, ersetzt keine fachliche Begutachtung.
- Nicht jedes Gewerk mit schlechtem Zustand muss sofort saniert werden: Der Schalter "Sofort sanieren" je Gewerk (Default an) entscheidet, ob der geschätzte Betrag in die Sofortinvestition (sofortiger EK-Bedarf) einfließt oder nur informativ als "für später eingeplant" ausgewiesen wird. Der Risiko-Score für die Instandhaltungsrücklage berücksichtigt weiterhin beide Gruppen unverändert.
- Gemeinschaftseigentum-Kosten (z. B. Dach, Fassade) werden ohne Angabe der Gesamtwohnfläche des Gebäudes wie bisher über die eigene Wohnfläche geschätzt (Näherung: Miteigentumsanteil ≈ Wohnflächenanteil). Trägst du zusätzlich die Gesamtwohnfläche des Gebäudes/der WEG ein, kannst du den tatsächlichen Miteigentumsanteil (z. B. aus Grundbuch/Teilungserklärung) manuell überschreiben, falls er vom reinen Wohnflächenanteil abweicht — im Default-Fall (ohne Override) ist das Ergebnis mathematisch identisch zum bisherigen Verhalten.
- Jedes Objekt hat ein "Quelle & Notizen"-Feld (Exposé-Link + Freitext) — rein informativ, fließt nicht in die Kalkulation ein. Gedacht u. a. dafür, bei recherchierten/importierten Objekten transparent zu dokumentieren, welche Werte real aus dem Exposé stammen und welche geschätzt wurden (siehe Import-Skript oben).
- **Finanzübersicht** (`/finanzuebersicht`): zeigt den Verlauf des tatsächlich verfügbaren (liquiden) Geldes — Wertpapier-/Tagesgeld-Positionen plus, bei Immobilien, deren Cashflow nach Steuer ab heute. Der Immobilienwert bzw. Eigenkapitalanteil selbst zählt bewusst NICHT mit (das Geld steckt im Objekt, ist nicht verfügbar) und wird nur als Referenzwert je Objekt angezeigt. Jede Wertpapier-/Tagesgeld-Position wächst jährlich (kein unterjähriger Zinseszins) mit ihrer eigenen Rendite/Zins plus einem optionalen, jährlich wachsenden Sparplan; die reale Linie rechnet mit einer frei konfigurierbaren Inflationsrate ab (kein separat modelliertes CPI). Gehalt und Gehaltssteigerung sind rein informativ (Kontext-Anzeige + Vorschlagswert für neue Sparplan-Steigerungen) und fließen nicht automatisch in die Sparraten ein — diese werden bewusst als feste €-Beträge je Position hinterlegt.
- Jedes Asset (Immobilie, Wertpapierdepot, Tagesgeld) hat einen **Besitzstatus** (`Besitze ich` / `Potenzielle Anschaffung` / `Spekulation` / `Verkauft` / `Archiviert`, siehe `src/lib/asset.ts`) — auf der gemeinsamen `Asset`-Tabelle statt pro Tool einzeln, damit jeder heutige und künftige Asset-Typ automatisch denselben Status bekommt. Nur `Besitze ich` zählt automatisch in der Finanzübersicht mit; die übrigen Status sind für Kalkulationen/Planung gedacht, ohne das aktuelle Vermögen zu verfälschen. Neu angelegte Immobilien starten bei `Potenzielle Anschaffung` (bewusste Bremse gegen versehentliches Mitzählen rein hypothetischer Objekte), neu angelegte Wertpapier-/Tagesgeld-Positionen bei `Besitze ich` (wer hier einen Betrag einträgt, meint i. d. R. echten Besitz). Das Kaufdatum einer Immobilie ist frei editierbar (Default: heute) und darf auch in der Zukunft liegen (geplanter Kauf) — bestimmt in der Finanzübersicht, ab wann der Cashflow einsetzt; bei einem geplanten Kauf wird der Eigenkapital-Einsatz einmalig als Geldabfluss im Kaufjahr simuliert. Für den Immobilien-Rechner selbst (Kennzahlen, Tilgungsplan) spielt das Kaufdatum keine Rolle, da dieser ausschließlich in relativen "Jahren seit Kauf" rechnet.
- **Szenarien** (`/szenarien`): ein Szenario ist Basiszustand (alle Assets mit Status `Besitze ich`, unverändert aus der DB) + eine Liste von Änderungen, die NUR zur Laufzeit im Browser auf eine Kopie der Inputs angewendet werden — Speichern eines Szenarios verändert niemals Property/Wertpapierposition/Tagesgeldkonto. Vier Änderungsarten: **Immobilie kaufen** (ein Objekt mit Status "Potenzielle Anschaffung"/"Spekulation" wird ab seinem — auch zukünftigen — Kaufdatum wie besessen behandelt, nutzt dieselbe Cashflow-Logik wie die Finanzübersicht), **Immobilie verkaufen** (Cashflow einer besessenen Immobilie endet ab einem gewählten Jahr, der heutige Marktwert fließt als einmaliger Verkaufserlös zu — Restschuld-Ablösung und Steuern beim Verkauf sind dabei nicht eingerechnet), **Sparrate ändern** (monatliche Sparrate einer Wertpapier-/Tagesgeld-Position springt ab dem Szenario-Startjahr auf einen neuen Betrag, die reguläre jährliche Steigerung läuft ab dann auf Basis der neuen Rate weiter) und **Einmalige Anschaffung** (frei benannte einmalige Ausgabe zu einem Jahr, z. B. ein Autokauf — bewusst ohne eigenes Fahrzeug-Tool, da der Betrag danach nicht weiterverfolgt werden muss). Der Vergleichs-Chart rechnet ausschließlich nominal (keine reale/inflationsbereinigte Linie, um die Szenario-Differenz nicht zusätzlich zu verkomplizieren). Betreffen mehrere Änderungen dasselbe Asset, gewinnt die letzte in der Liste — die UI weist mit einem Hinweis darauf hin, statt die Änderungen stillschweigend zu kombinieren. "Immobilienpreise steigen jährlich um X%" (eine globale Wertsteigerungs-Annahme statt einer Asset-bezogenen Änderung) ist aktuell keine eigene Änderungsart, da Wertsteigerung ohne einen geplanten Verkauf ohnehin keinen Effekt auf den Cashflow hat.
- **Sparziel-Rechner** (`/sparziel`): reiner Client-Rechner ohne Datenbank-Anbindung, nutzt direkt die geteilte Sparpositions-Verlaufsfunktion (`berechneSparpositionsverlauf`) aus `src/server/calc/rendite/portfolioverlauf.ts` — dieselbe Formel wie in Finanzübersicht/Szenarien, nur ohne Persistenz. Gibt Kapital nach 10/20 Jahren sowie das erste Jahr aus, in dem ein frei wählbarer Zielbetrag erreicht wird (`findeJahrBisZielbetrag`, `src/server/calc/rendite/sparziel.ts`); Horizont ist auf 40 Jahre begrenzt, danach heißt es "nicht in 40 Jahren" statt zu extrapolieren. Gleiche Vereinfachung wie die Sparpositionen in der Finanzübersicht: Sparrate wird jährlich am Jahresanfang gutgeschrieben (kein unterjähriger Zinseszins), Rendite bleibt über den gesamten Zeitraum konstant.
- **Dashboard** (`/`, Startseite): aggregiert Kennzahlen über alle Tools aus denselben Server-Loadern/Engine-Funktionen wie die Einzeltools (keine eigene Berechnungslogik) — Anzahl Immobilien im Besitz, Summe aus Wertpapier-/Tagesgeld-Positionen mit Status `Besitze ich`, deren monatlicher Immobilien-Cashflow (netto, alle besessenen Objekte) sowie die Anzahl gespeicherter Szenarien. Zeigt zusätzlich einen Hinweis, falls mindestens ein besessenes Objekt auf Ampel Rot steht. Zwei schlichte Grafiken ergänzen die Zahlen: ein horizontaler Balken zur Vermögensverteilung (Immobilien-Eigenkapitalanteil vs. Bargeld & Depots, via `berechneImmobilienPositionen`) sowie ein Ampel-Verteilungsbalken über alle besessenen Objekte. Der Immobilien-Eigenkapitalanteil zählt hier bewusst NUR zur Verteilungsansicht mit (Frage: "wo steckt mein Vermögen?") — anders als in der Finanzübersicht, die ihn wegen ihrer Cashflow-only-Philosophie explizit ausklammert (siehe oben). Darunter drei weitere Kennzahlen: durchschnittliche Bruttorendite über alle besessenen Objekte, größte Sparposition, sowie eine grobe Näherung des Gesamtvermögens (Immobilien-EK-Referenz + Bargeld & Depots).
