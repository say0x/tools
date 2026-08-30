# ADR-0006 — Kein App-Level-Login, Absicherung über VPN-only-Netzwerk

**Status**: Accepted (die Multi-Tenancy-Prämisse — `UserProfile` als Singleton — ist durch [ADR-0009](0009-lokales-mehrbenutzer-datenmodell.md) überholt; kein App-Level-Login und der VPN-only-Perimeter bleiben unverändert gültig)

## Context

`tools` verarbeitet sensible persönliche Finanzdaten (Einkommen, Vermögen, Immobilienbewertungen) für genau einen Nutzer im eigenen Homelab. Ein klassisches Login-System (Nutzerverwaltung, Passwort-Hashing, Session-Handling, Passwort-Reset-Flow) ist Standard-Praxis für mehrbenutzerfähige, öffentlich erreichbare Anwendungen.

## Decision

Kein Login im Next.js-Code. Absicherung ausschließlich über das Netzwerk: der Reverse-Proxy vor `tools.sayox.de` ist nur über VPN erreichbar, `robots: { index: false, follow: false }` verhindert versehentliche Suchmaschinen-Indexierung, `UserProfile` ist als Singleton modelliert (kein Multi-Tenancy-Datenmodell).

## Reason

Für einen einzigen Nutzer auf einem selbst kontrollierten Netzwerk fügt ein App-Level-Login eine komplette, wartungsintensive Sicherheits-Subsystem-Fläche (Passwort-Speicherung, Session-Fixation, Brute-Force-Schutz, …) hinzu, ohne einen zusätzlichen Bedrohungsakteur abzuwehren, den der VPN-Perimeter nicht bereits ausschließt. Das Netzwerk ist hier die richtige Vertrauensgrenze, nicht die Anwendung.

## Consequences

- Diese Entscheidung ist an ihre Prämisse gebunden: **ein** Nutzer, **kein** öffentlicher Zugriff. Käme ein zweiter Nutzer oder ein öffentlicher Netzwerkpfad hinzu, müsste diese ADR revidiert und ein echtes Auth-System nachgerüstet werden — nicht stillschweigend ignoriert werden.
- Das Sicherheits-Audit (2026-08-22) hat diese Prämisse aktiv geprüft, nicht blind akzeptiert: ein Fund war ein unnötig auf den Host gemappter Postgres-Port, der die VPN-only-Grenze für die Datenbank (nicht nur die App) unterlaufen hätte — behoben, weil er die Prämisse dieser ADR verletzt hätte, ohne dass die ADR selbst falsch war.
