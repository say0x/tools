# tools

Interne Tool-Suite von Dennis Kohnke — nicht öffentlich, für den Eigenbedarf im Homelab (`sayox.de`). Startet mit dem **Immobilien-Rechner**: Objekte erfassen, Kennzahlen live berechnen, speichern und vergleichen. Weitere Tools (Zinsrechner, Depot-Tracker, "Finanzielle Freiheit"-Dashboard) sollen auf demselben `Asset`-Datenmodell aufbauen.

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

## Deployment im Homelab (`tools.sayox.de`)

```bash
docker compose up -d --build
```

Das startet Postgres + die App (`Dockerfile`, Next.js `output: 'standalone'`). Der Container führt beim Start automatisch `prisma migrate deploy` aus (`docker-entrypoint.sh`), bevor der Server hochfährt.

**Einmalig nach dem ersten Deploy** die Referenzdaten befüllen:

```bash
docker compose exec app npx prisma db seed
```

(Danach nicht erneut ausführen, sonst werden manuelle Anpassungen auf der Referenzdaten-Seite überschrieben — der Seed läuft bewusst nicht automatisch bei jedem Start.)

Die App ist intern unter Port 3000 erreichbar; im Homelab per Reverse-Proxy auf `tools.sayox.de` mappen. Kein eigenes App-Level-Login eingebaut — die Absicherung erfolgt über das Docker-/Homelab-Netz bzw. den Reverse-Proxy (VPN-only o. ä.), da das Tool bewusst nicht öffentlich sein soll.

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
src/app/profil/                Nutzerprofil (Einkommen, Affordability-Schwellen)
```

## Bekannte Vereinfachungen

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
