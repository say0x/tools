# ADR-0010 — KI-Fotoanalyse von Mahlzeiten über die Claude API (optional)

**Status**: Accepted

## Context

Das Ernährungstagebuch (`/fitness/ernaehrung`) soll Mahlzeiten nicht nur per Lebensmittel-Datenbank oder manueller Eingabe erfassen, sondern auch per Foto: Foto aufnehmen → Positionen mit geschätzten Mengen und Nährwerten → kontrollieren → übernehmen. Eine verlässliche Bilderkennung mit Portionsschätzung lässt sich nicht sinnvoll selbst trainieren oder lokal im Homelab betreiben; alle brauchbaren Lösungen sind externe Vision-Modelle. Bisher lädt die App nichts von Drittanbietern ([ADR-0006](0006-kein-app-level-login.md), CSP ohne externe Ziele) — ein externer API-Aufruf ist also eine neue Art von Datenfluss.

## Decision

1. **Claude API über das offizielle SDK** (`@anthropic-ai/sdk`), serverseitig in einer Server Action (`src/server/actions/fitness-ki.ts` → `src/server/ki/mahlzeit-analyse.ts`). Der Browser spricht nie direkt mit der API; CSP bleibt unverändert (`connect-src 'self'`).
2. **Opt-in per Umgebungsvariable**: ohne `ANTHROPIC_API_KEY` ist die Funktion nicht verfügbar und der Foto-Tab erklärt, wie man sie aktiviert. Alles andere im Fitness-Modul funktioniert unabhängig davon.
3. **Modell** `claude-opus-5-5` (überschreibbar per `ANTHROPIC_MODEL`), **Structured Outputs** mit einem Zod-Schema (`erkannt`, `positionen[]`, `konfidenz`, `hinweise`), `effort: "medium"`, serverseitiger Refusal-Fallback (`fallbacks: "default"`) für Modelle, die ihn unterstützen.
4. **Kein Speichern ohne Bestätigung**: das Ergebnis ist eine Schätzung zur Kontrolle; der Nutzer korrigiert Mengen (Nährwerte skalieren proportional mit), entfernt Positionen und übernimmt erst dann. Gespeicherte Einträge tragen `quelle = FOTO_KI` und die KI-Konfidenz.
5. **Datensparsam**: der Browser verkleinert das Foto auf max. 1.568 px (JPEG) vor dem Upload; `tools` speichert das Foto **nicht** — nur die bestätigten Nährwerte.
6. **Kostendeckel**: `KI_FOTO_LIMIT_PRO_TAG` (Default 100 Analysen je Server-Prozess und Tag) gegen versehentliche Schleifen.

## Reason

- Strukturierte Ausgabe über ein Schema statt Freitext-Parsing macht die Antwort direkt typsicher verwendbar und vermeidet fragile Regex-Extraktion.
- Serverseitiger Aufruf hält den API-Schlüssel aus dem Browser und erlaubt Validierung (Bildtyp, Größe) und Fehlerübersetzung an einer Stelle.
- Opt-in statt Pflicht: wer keine Daten an einen externen Dienst geben will, verliert nichts außer dieser einen Erfassungsart.
- Bestätigungspflicht statt Auto-Speichern: Portions- und Ölschätzungen aus Fotos haben realistisch ±20–30 % Fehler; der Mensch bleibt die letzte Instanz.

## Consequences

- **Neuer externer Datenfluss**: Fotos (und optional der Zusatztext) gehen an die Anthropic API. Dokumentiert in [`docs/security/overview.md`](../../security/overview.md) und [`docs/tools/fitness.md`](../../tools/fitness.md#ki-fotoanalyse).
- Laufende Kosten pro Analyse (Größenordnung wenige Cent je Foto bei verkleinertem Bild); über `ANTHROPIC_MODEL` kann ein günstigeres Modell gewählt werden.
- Der Container braucht ausgehenden HTTPS-Zugriff auf `api.anthropic.com` (bzw. `ANTHROPIC_BASE_URL`).
- Tests laufen ohne Netzwerk: die Analysefunktion nimmt einen Client per Parameter entgegen (Fake im Unit-Test); End-to-End wurde gegen einen lokalen Mock der Messages-API verifiziert.
