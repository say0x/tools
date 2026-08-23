# ADR-0007 — Ein Next.js-Monolith statt Microservices/separater API

**Status**: Accepted

## Context

`tools` umfasst zehn fachlich unterscheidbare Werkzeuge (Immobilien-Rechner, Finanzübersicht, Szenarien, vier freistehende Rechner, Dashboard, Profil). Eine Plattform mit dieser Tool-Zahl könnte als Sammlung unabhängiger Services mit eigener API, eigenem Deployment und eigener Versionierung pro Tool gebaut werden.

## Decision

Alle Tools leben in einem Next.js-App-Router-Projekt. Es gibt keine separate REST-/GraphQL-API-Schicht — Formulare rufen Server Actions direkt auf, alle Tools teilen sich eine Postgres-Datenbank und werden als ein Docker-Image gebaut und deployed.

## Reason

Für einen einzigen Entwickler mit einem einzigen Deploy-Ziel (`tools.sayox.de`) bringt eine Service-Trennung keinen der üblichen Vorteile (unabhängige Skalierung, unabhängige Teams, unabhängige Releases) — sie würde ausschließlich Koordinations-Overhead erzeugen: mehrere Repos oder ein Monorepo-Build-System, Versionsabstimmung zwischen Services, Netzwerk-Latenz zwischen intern zusammengehörigen Aufrufen. Die geteilte Berechnungs-Engine (ADR-0001) und das geteilte Asset-Modell (ADR-0003) setzen ohnehin eine enge Kopplung voraus, die eine Service-Grenze künstlich zerschneiden würde.

## Consequences

- Jede Tool-Versionierung ist zwangsläufig Plattform-Versionierung — es gibt keine unabhängig auslieferbaren "Tool-Versionen", weil es keine unabhängig auslieferbaren Tools gibt. Eine vorgetäuschte separate Versionsnummer pro Tool wäre Dokumentation, die nicht der Realität entspricht (siehe `docs/tools/overview.md`, Abschnitt Versionierung).
- Wächst `tools` über den Homelab-Rahmen hinaus (mehrere Nutzer, öffentlicher Zugriff, Team-Betrieb), ist diese Entscheidung der erste Kandidat für eine Revision — zusammen mit ADR-0006.
