# REST-API v1

Persönliche Schnittstelle für Fitness- und Finanzdaten — für Home Assistant, iOS-Kurzbefehle, Smart-Waagen und eigene Skripte. Architekturentscheidung: [ADR-0011](../architecture/decisions/0011-rest-api-mit-bearer-tokens.md). Home-Assistant-Anleitung: [`../integrations/home-assistant.md`](../integrations/home-assistant.md).

- **Basis-URL**: `http(s)://<host>/api/v1` (lokal `http://localhost:3000/api/v1`)
- **Maschinenlesbare Beschreibung**: `GET /api/v1/openapi.json` (OpenAPI 3.1, ohne Token abrufbar — z. B. in Swagger Editor, Insomnia oder Bruno importieren)
- **Tokens, fertige Konfiguration, Endpunktliste**: Seite **Integrationen & API** (`/integrationen`, im Menü unter „Weitere Tools“)

Code: Routen in `src/app/api/v1/**/route.ts`, gemeinsamer Rahmen in `src/server/api/handler.ts`, Antwortformate in `src/server/api/dto.ts`, Spezifikation in `src/server/api/openapi.ts`.

## Authentifizierung

```
Authorization: Bearer tk_…
```

| Eigenschaft | Verhalten |
|---|---|
| Format | `tk_` + 43 Zeichen base64url (32 Zufallsbytes) |
| Speicherung | nur SHA-256-Hash + die ersten 9 Zeichen zur Wiedererkennung; der Klartext wird beim Erstellen **einmal** angezeigt |
| Bindung | ein Token gehört genau einem (lokalen) Nutzer und sieht nur dessen Daten |
| Rechte | „Nur lesen“ (GET) oder „Lesen + Schreiben“ (zusätzlich POST/PUT/DELETE) |
| Widerrufen | auf `/integrationen` — wirkt sofort |
| Limits | max. 20 Tokens je Nutzer; kein Ablaufdatum („zuletzt genutzt“ zeigt Karteileichen) |
| Backup/Reset | Tokens sind bewusst **nicht** im JSON-Backup (Zugangsdaten gehören nicht in Exporte) und überstehen `RESET_USER_DATA_ON_DEPLOY` — sie hängen am Nutzer, nicht an dessen Daten. Gelöscht werden sie nur per Widerruf oder mit dem Nutzer. |

Erster Test nach dem Einrichten:

```bash
export TOOLS_TOKEN=tk_…
curl -s -H "Authorization: Bearer $TOOLS_TOKEN" http://localhost:3000/api/v1/ich
```

## Konventionen

- **JSON** in beide Richtungen; schreibende Requests brauchen `Content-Type: application/json`. Max. Body 64 KB (Mahlzeiten-Liste 256 KB, Foto-Analyse 8 MB).
- **Datum** immer `JJJJ-MM-TT` im Kalender von Europe/Berlin. Fehlt `datum` in einem Schreib-Request oder Query-Parameter, gilt **heute**.
- **Zahlen**: Kalorien ganzzahlig, Gramm/kg/Stunden mit einer Nachkommastelle, Euro mit zwei. Nährwerte von Einträgen gelten für die eingetragene Menge, Lebensmittel-Werte je 100 g.
- **`null`** heißt „unbekannt/nicht gesetzt“ (z. B. Ziele ohne Fitness-Profil) — nie stillschweigend 0.
- **Herkunft**: Über die API angelegte Einträge tragen `quelle: "API"` (Foto-Analyse: `FOTO_KI`) und erscheinen im UI wie alle anderen.
- **Caching**: alle Antworten `Cache-Control: no-store`.
- **Stabilität**: innerhalb von `v1` kommen nur Felder/Endpunkte hinzu; Umbenennen oder Entfernen erst in `v2`. Clients sollten unbekannte Felder ignorieren.

## Fehler

Jeder Fehler hat dieselbe Form:

```json
{ "fehler": { "code": "VALIDIERUNG", "nachricht": "Eingabe ungültig.", "details": [{ "feld": "gewichtKg", "nachricht": "Gewicht muss zwischen 20 und 400 kg liegen" }] } }
```

| HTTP | `code` | Bedeutung |
|---|---|---|
| 400 | `UNGUELTIGE_ANFRAGE` | Query-Parameter ungültig, falscher Content-Type, kein gültiges JSON, Zeitraum zu lang |
| 401 | `NICHT_AUTHENTIFIZIERT` | Header fehlt, Token unbekannt oder widerrufen (mit `WWW-Authenticate: Bearer`) |
| 403 | `KEIN_SCHREIBZUGRIFF` | Lese-Token bei POST/PUT/DELETE |
| 404 | `NICHT_GEFUNDEN` | Eintrag existiert nicht oder gehört einem anderen Nutzer |
| 413 | `ZU_GROSS` | Body über dem Limit |
| 422 | `VALIDIERUNG` | Feldwerte ungültig — `details` nennt jedes Feld (bei Listen mit Index, z. B. `[2].kcal`) |
| 429 | `LIMIT_ERREICHT` | Tageslimit der KI-Analysen (`KI_FOTO_LIMIT_PRO_TAG`) |
| 502 | `EXTERNER_DIENST` | Anthropic-API nicht erreichbar oder Fehler |
| 503 | `NICHT_KONFIGURIERT` | Foto-Analyse ohne `ANTHROPIC_API_KEY` |
| 500 | `SERVERFEHLER` | unerwarteter Fehler — Details nur im Server-Log |

## Endpunkte

✎ = braucht Schreibzugriff. Felder, Grenzen und Antwortschemas vollständig in `/api/v1/openapi.json`.

| Methode | Pfad | Zweck |
|---|---|---|
| GET | `/status` | Health-Check ohne Token (DB-Ping, Version, ob KI aktiv ist); 503 bei DB-Ausfall |
| GET | `/openapi.json` | diese Spezifikation, ohne Token |
| GET | `/ich` | Token prüfen: Nutzer, Token-Name, Schreibrecht, „heute“ |
| GET | `/fitness/tag?datum=` | Tagesübersicht: Ziele, Zufuhr, Training, Budget, Tageswerte, alle Einträge |
| GET | `/fitness/zeitraum?bis=&tage=7` | Statistik + Tageswerte über 1–366 Tage |
| GET | `/fitness/mahlzeiten?datum=` bzw. `?von=&bis=` | Ernährungseinträge eines Tages/Zeitraums |
| POST ✎ | `/fitness/mahlzeiten` | Eintrag (Objekt) oder bis zu 50 Einträge (Array) anlegen |
| DELETE ✎ | `/fitness/mahlzeiten/{id}` | Eintrag löschen |
| POST ✎ | `/fitness/mahlzeiten/foto-analyse` | Foto per KI schätzen, optional direkt speichern |
| GET | `/fitness/training?von=&bis=` | Trainings (Default 30 Tage) |
| POST ✎ | `/fitness/training` | Training anlegen; Verbrauch wird geschätzt, wenn kein `kcalOverride` |
| DELETE ✎ | `/fitness/training/{id}` | Training löschen |
| GET | `/fitness/gewicht?von=&bis=` | Messungen (Default 90 Tage) + 7-Tage-Schnitt, Trend, Zielprognose |
| POST ✎ | `/fitness/gewicht` | Gewicht für einen Tag speichern (Upsert — zweiter Wert am selben Tag überschreibt) |
| DELETE ✎ | `/fitness/gewicht/{id}` | Messung löschen |
| GET | `/fitness/tageswerte?datum=` | Schritte, Wasser, Schlaf, Ruhepuls |
| PUT ✎ | `/fitness/tageswerte` | Teil-Update: nur gesendete Felder ändern sich, `null` löscht |
| POST ✎ | `/fitness/tageswerte/wasser` | `ml` addieren (negativ = korrigieren, nie unter 0) |
| GET | `/fitness/lebensmittel?suche=&limit=` | Lebensmittel-Datenbank inkl. eigener Lebensmittel |
| GET | `/finanzen/uebersicht` | Kennzahlen der Startseite (Vermögen, Netto, Notgroschen, Immobilien-Cashflow, Ampel) |
| GET | `/home-assistant/sensoren` | alle Sensorwerte für Home Assistant in einem Request |

## Beispiele

```bash
API=http://localhost:3000/api/v1
AUTH="Authorization: Bearer $TOOLS_TOKEN"

# Mahlzeit mit mehreren Positionen
curl -s -X POST -H "$AUTH" -H "Content-Type: application/json" "$API/fitness/mahlzeiten" -d '[
  {"mahlzeit": "FRUEHSTUECK", "bezeichnung": "Haferflocken", "mengeG": 60, "kcal": 222, "proteinG": 8.1, "kohlenhydrateG": 35.2, "fettG": 4.2},
  {"mahlzeit": "FRUEHSTUECK", "bezeichnung": "Milch 1,5 %", "mengeG": 200, "kcal": 94, "proteinG": 6.8, "kohlenhydrateG": 9.6, "fettG": 3}
]'

# Lauf nachtragen (Verbrauch wird aus der Distanz geschätzt)
curl -s -X POST -H "$AUTH" -H "Content-Type: application/json" "$API/fitness/training" \
  -d '{"datum": "2026-10-09", "sportart": "LAUFEN", "dauerMin": 42, "distanzKm": 8.1}'

# Nur Schritte setzen, Wasser/Schlaf bleiben unverändert
curl -s -X PUT -H "$AUTH" -H "Content-Type: application/json" "$API/fitness/tageswerte" -d '{"schritte": 9120}'

# Foto analysieren und direkt speichern
curl -s -X POST -H "$AUTH" -H "Content-Type: application/json" "$API/fitness/mahlzeiten/foto-analyse" \
  -d "{\"bild\": \"$(base64 -w0 essen.jpg)\", \"mediaType\": \"image/jpeg\", \"speichern\": true, \"mahlzeit\": \"ABENDESSEN\"}"
```

Enum-Werte: `mahlzeit` ∈ `FRUEHSTUECK | MITTAGESSEN | ABENDESSEN | SNACK`; `sportart` ∈ `LAUFEN | GEHEN | WANDERN | RADFAHREN | SCHWIMMEN | KRAFTTRAINING | HIIT | YOGA | TEAMSPORT | RUDERN | SONSTIGES`; `intensitaet` ∈ `LEICHT | MITTEL | HOCH` (Default `MITTEL`).

### iOS-Kurzbefehl: Mahlzeit fotografieren

Voraussetzung: Das iPhone erreicht `tools` (Heimnetz oder VPN), `ANTHROPIC_API_KEY` ist auf dem Server gesetzt, Token mit Schreibzugriff.

1. **Foto aufnehmen** (oder „Fotos auswählen“).
2. **Bildgröße ändern** auf Breite 1568 (Höhe automatisch) — spart Upload und Kosten.
3. **Bild konvertieren** in JPEG, Qualität ca. 70 %.
4. **Base64-Codierung** (Codieren, Zeilenumbrüche: keine).
5. **Aus Menü auswählen**: Frühstück / Mittagessen / Abendessen / Snack → jeweils Text `FRUEHSTUECK` usw. in eine Variable `Mahlzeit`.
6. **Inhalte von URL abrufen**: URL `https://<tools-host>/api/v1/fitness/mahlzeiten/foto-analyse`, Methode **POST**, Header `Authorization` = `Bearer tk_…`, Anfragetext **JSON** mit `bild` (Text = Base64-Ergebnis), `mediaType` (Text `image/jpeg`), `speichern` (Boolesch = an), `mahlzeit` (Text = Variable).
7. **Wörterbuchwert abrufen** `analyse` → daraus `beschreibung` und `summe` → `kcal`.
8. **Mitteilung anzeigen**: „{beschreibung} — {kcal} kcal gespeichert“.

Die Schätzung ist eine Schätzung (±20–30 % sind bei Fotos realistisch): Die Einträge stehen danach in `/fitness/ernaehrung` und lassen sich dort korrigieren oder löschen. Ohne `speichern: true` liefert der Endpunkt nur die Schätzung — gut für einen Kurzbefehl mit Rückfrage („Übernehmen?“) und anschließendem `POST /fitness/mahlzeiten`.

### Smart-Waage / eigene Skripte

Jede Waage oder jedes Skript, das HTTP kann, sendet einfach `POST /fitness/gewicht` mit `{"gewichtKg": 82.4}` (optional `koerperfettProzent`, `datum`). Ein zweiter Wert am selben Tag überschreibt den ersten. Über Home Assistant: siehe [`../integrations/home-assistant.md`](../integrations/home-assistant.md#automationen).

## Sicherheit

- Ein Token ist ein Passwort: nicht in Repos, Screenshots oder Logs. In Home Assistant gehört es in `secrets.yaml`.
- Die API teilt die Vertrauensgrenze des UI: Heimnetz/VPN ([ADR-0006](../architecture/decisions/0006-kein-app-level-login.md)). Wer das UI erreicht, kann Tokens erstellen. Nicht ohne HTTPS-Reverse-Proxy und zusätzliche Zugangskontrolle ins Internet stellen.
- Für reine Anzeige (Dashboards, Wandtablets) ein **Nur-lesen**-Token verwenden.
- `/api/v1/status` und `/api/v1/openapi.json` enthalten keine Nutzerdaten und sind deshalb ohne Token erreichbar.
- Die Foto-Analyse sendet das Bild an die Anthropic API ([ADR-0010](../architecture/decisions/0010-ki-fotoanalyse-ueber-claude-api.md)); `tools` speichert das Bild nicht.

## Neuen Endpunkt hinzufügen

1. Datenfunktion mit expliziter `userId` in `src/server/data/*` (nie `getActiveUserId()` in API-Pfaden).
2. Eingabe-Schema in `src/server/actions/*-schema.ts` (gemeinsam mit der Server Action) oder `src/server/api/schemas.ts` (nur API).
3. Route `src/app/api/v1/<pfad>/route.ts` mit `apiRoute({ schreiben: true|false }, …)`, `export const dynamic = "force-dynamic"`; nur `GET/POST/PUT/DELETE/dynamic` exportieren.
4. Antwort über eine DTO-Funktion in `src/server/api/dto.ts` (gerundet, stabile Namen).
5. Pfad in `src/server/api/openapi.ts` dokumentieren — `openapi.test.ts` schlägt sonst fehl.
6. Diese Tabelle und ggf. die Home-Assistant-Doku ergänzen; CHANGELOG-Eintrag.
