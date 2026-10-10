# ADR-0011 — REST-API `/api/v1` mit Bearer-Tokens neben dem login-freien UI

**Status**: Accepted (ergänzt [ADR-0006](0006-kein-app-level-login.md) und [ADR-0007](0007-monolith-statt-microservices.md), ohne sie aufzuheben)

## Context

Home Assistant, iOS-Kurzbefehle, Smart-Waagen und eigene Skripte sollen Fitness- und Finanzdaten lesen und Werte (Gewicht, Wasser, Schritte, Mahlzeiten, Trainings) schreiben. Server Actions sind dafür ungeeignet: Ihre IDs sind Build-Interna, sie erwarten den Next.js-Client und haben kein stabiles Format. Das UI selbst hat bewusst kein Login ([ADR-0006](0006-kein-app-level-login.md)); der aktive Nutzer kommt aus einem unsignierten Cookie ([ADR-0009](0009-lokales-mehrbenutzer-datenmodell.md)). Ein Gerät wie Home Assistant hat aber keinen Browser-Cookie — es braucht eine eigene, dauerhafte Zuordnung zu einem Nutzer.

## Decision

1. **Route Handlers unter `src/app/api/v1/**`** im bestehenden Monolithen (kein separater Dienst, ADR-0007). Gemeinsamer Rahmen in `src/server/api/handler.ts` (`apiRoute()`): Token-Auflösung, Schreibrecht-Prüfung, JSON-Parsing mit Größenlimit, Zod-Validierung, einheitliches Fehlerformat `{ fehler: { code, nachricht, details? } }`, `Cache-Control: no-store`.
2. **Bearer-Tokens pro Nutzer** (`ApiToken`-Tabelle): `tk_` + 32 Zufallsbytes (base64url). Gespeichert wird nur der SHA-256-Hash plus ein 9-Zeichen-Präfix zur Wiedererkennung; der Klartext wird genau einmal angezeigt. Jedes Token ist entweder **nur lesend** oder **lesend + schreibend**. Widerrufen = Löschen. Max. 20 je Nutzer; `zuletztGenutztAm` wird höchstens einmal pro Minute aktualisiert.
3. **Explizite `userId`** in allen von der API genutzten Datenfunktionen (`…FuerUser(userId, …)`, `ladeDashboardKennzahlen(userId)`) — die API liest nie das Nutzer-Cookie. Löschen immer per `(id, userId)`, ein fremder Eintrag liefert 404.
4. **Dieselben Zod-Schemas** wie die Server Actions (`src/server/actions/fitness-schema.ts`); die OpenAPI-3.1-Beschreibung (`/api/v1/openapi.json`) erzeugt ihre Request-Bodies aus genau diesen Schemas. Ein Test gleicht alle `route.ts`-Dateien mit der Spezifikation ab.
5. **Öffentlich** sind nur `/api/v1/status` (Health-Check ohne Nutzerdaten, auch Docker-Healthcheck) und `/api/v1/openapi.json`.
6. **Home Assistant** bekommt einen aggregierten Endpunkt (`/home-assistant/sensoren`) mit flachen snake_case-Namen — ein Request statt 20 Sensor-Polls. Die YAML-Konfiguration auf `/integrationen` und in der Doku wird aus derselben Sensorliste erzeugt und gegen das API-Schema getestet.
7. **Versionierung über den Pfad**: Innerhalb von `v1` nur additive Änderungen (neue Felder/Endpunkte). Umbenennen oder Entfernen → `/api/v2`.

## Reason

- Tokens statt Login: Ein Gerät braucht eine langlebige, widerrufbare Berechtigung, kein Passwort. Ein gehashtes Zufallstoken mit 256 Bit Entropie braucht weder Salt noch langsames Hashing; ein Datenbank-Leak gibt keine nutzbaren Tokens preis.
- Lese-Tokens begrenzen den Schaden, wenn eine Anzeige-Integration (z. B. ein Dashboard-Tablet) kompromittiert wird.
- Gemeinsame Schemas verhindern, dass API und UI unterschiedliche Grenzen erzwingen; die generierte Spezifikation kann nicht veralten, ohne dass ein Test fehlschlägt.

## Consequences

- **Die Vertrauensgrenze bleibt das Netzwerk** (ADR-0006): Wer das UI erreicht, kann auf `/integrationen` Tokens für jeden lokalen Nutzer erstellen. Tokens schützen die API gegen Geräte/Skripte ohne Token, nicht gegen Personen mit UI-Zugriff. Wird `tools` je öffentlich erreichbar, reichen Tokens allein nicht — dann ADR-0006 revidieren (echtes Login vor dem UI).
- Kein Rate-Limiting auf Token-Ebene (nur das KI-Tageslimit). Bei 256-Bit-Tokens ist Raten aussichtslos; Missbrauch durch einen gültigen Token-Inhaber ist durch die Netzwerkprämisse abgedeckt.
- Tokens laufen nicht automatisch ab — bewusst, weil Home Assistant sonst unbemerkt ausfällt. Unbenutzte Tokens erkennt man an „zuletzt genutzt“ und widerruft sie.
- Neue Schreibwege müssen über `apiRoute({ schreiben: true }, …)` laufen und in `src/server/api/openapi.ts` dokumentiert werden; sonst schlägt `openapi.test.ts` fehl.
- Referenz: [`docs/api/README.md`](../../api/README.md), [`docs/integrations/home-assistant.md`](../../integrations/home-assistant.md).
