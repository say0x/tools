# ADR-0009 — Lokales Mehrbenutzer-Datenmodell, Test-User-Switcher statt Auth

**Status**: Accepted

## Context

ADR-0006 stand explizit unter einer Bedingung: "Käme ein zweiter Nutzer [...] hinzu, müsste diese ADR revidiert und ein echtes Auth-System nachgerüstet werden — nicht stillschweigend ignoriert werden." Genau dieser Fall ist eingetreten: `tools` soll perspektivisch als Mehrbenutzer-SaaS angeboten werden (automatischer Abgleich von Immobilien-Angeboten gegen Bodenrichtwert/Durchschnittspreis für mehrere Nutzer). Bevor das gebaut wird, soll das Datenmodell und die App-Logik auf echte Mehrbenutzerfähigkeit umgestellt und lokal mit mehreren Test-Identitäten verifiziert werden — explizit **ohne** in diesem Schritt schon echtes Auth/HTTPS/Login zu bauen, da weiterhin nur lokal getestet wird und die App weiterhin ausschließlich im VPN-only-Homelab läuft.

## Decision

1. **Echtes Datenmodell**: Ein neues `User`-Modell (nur `id`/`name`/`createdAt` — bewusst kein Passwort/E-Mail). `Asset`, `UserProfile` und `Szenario` bekommen eine Pflicht-`userId`-Relation (`onDelete: Cascade`); alle abhängigen Modelle (Property, Wertpapierposition, Tagesgeldkonto, UserLiability, SzenarioAenderung, …) erben die Zugehörigkeit transitiv über bestehende Cascade-FKs. `UserProfile.userId` ist `@unique` — dieselbe "genau eine Zeile"-Invarianz wie beim bisherigen Singleton, jetzt aber DB-erzwungen pro User statt global.
2. **Referenzdaten bleiben global**: Die 7 `Reference*`-Tabellen (Grunderwerbsteuer, Mietpreise, Gewerk-Kosten, …) bekommen bewusst **keine** `userId` — sie sind geteilte Startwerte/Vergleichsbasis für alle Test-User.
3. **Kein echtes Auth**: Statt Login/Session gibt es einen bewusst unsicheren, rein lokalen Mechanismus: ein unsigniertes Cookie (`tools_active_user_id`) merkt sich den "aktiven" Test-User; `getActiveUserId()` (`src/server/session.ts`) liest es server-seitig und wird von jeder Server Action/jedem Loader intern aufgerufen (kein `userId`-Parameter, den Aufrufer durchreichen müssten). Ein `/nutzer`-Bereich erlaubt Anlegen/Wechseln der Test-User über eine einfache Formular-UI in der Nav-Leiste.
4. **Sicherheitsmodell unverändert**: Der VPN-only-Netzwerkperimeter aus ADR-0006 bleibt die tatsächliche Sicherheitsgrenze — das Cookie schützt vor gar nichts (jeder mit Netzwerkzugriff kann sich als beliebiger Test-User ausgeben) und ist explizit nur zum lokalen Verifizieren der Datentrennung gedacht.

## Reason

Der Cookie-Helper (statt eines explizit durchgereichten `userId`-Parameters) hält den Diff auf die eigentlichen Query-`where`-Klauseln beschränkt, statt jede der ~25 betroffenen Funktionssignaturen zu ändern — und bildet genau das Muster ab, das ein späteres echtes Auth-System übernehmen wird (server-seitige Session-Auflösung statt Parameter-Durchreichen): nur das Innenleben von `getActiveUserId()` wird dann ausgetauscht, keine Aufrufer.

Referenzdaten global zu lassen vermeidet unnötigen Migrations-/Pflegeaufwand für Daten, die laut ihrer eigenen Doku als geteilte Vergleichsbasis gedacht sind — kein Test-User braucht eine eigene Kopie der Grunderwerbsteuersätze.

Echtes Auth jetzt schon zu bauen hätte die eigentliche Frage dieses Schritts (funktioniert die Datentrennung überhaupt korrekt?) mit einer komplett separaten Fragestellung (Passwort-Sicherheit, Session-Handling, CSRF, …) vermischt — die Reihenfolge Datenmodell zuerst, Auth später hält beides sauber trennbar und testbar.

## Consequences

- ADR-0006 bleibt in seiner Kernaussage (kein App-Level-Login, VPN-only-Perimeter als Sicherheitsgrenze) gültig — nur die dort genannte Prämisse "`UserProfile` ist als Singleton modelliert (kein Multi-Tenancy-Datenmodell)" ist durch diese ADR überholt. ADR-0006 wird entsprechend als **teilweise superseded durch ADR-0009** markiert, nicht komplett ersetzt.
- Diese ADR selbst ist wieder nur an ihre eigene Prämisse gebunden: **kein** öffentlicher/nicht-VPN-Zugriff. Sobald `tools` tatsächlich außerhalb des Homelabs erreichbar sein soll (SaaS-Betrieb), muss der Cookie-Mechanismus durch echtes, verifiziertes Auth ersetzt werden — wieder nicht stillschweigend, sondern über eine eigene ADR-Revision.
- `scripts/reset-user-data.ts` und der `RESET_USER_DATA_ON_DEPLOY`-Deploy-Hook wirken weiterhin plattformweit über alle Test-User (kein Request-Kontext im Skript, aus dem sich ein einzelner User ableiten ließe) — dokumentiert in `docs/deployment/docker.md`.
