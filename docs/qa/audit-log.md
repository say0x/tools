# Audit-Log

Kanonischer, fortlaufend nummerierter Index **aller** cross-cutting Audits an diesem Projekt — Security-, Datenbank-, Code-Qualität-, QA- und Doku-Reviews mit eigenem Methodik-Ansatz und schriftlichem Fundbericht. Zweck: eine einzige Stelle im Repo, an der sich jeder Audit wiederfinden lässt, ohne PR-Historie oder Chat-Verlauf durchsuchen zu müssen.

**Nicht hier erfasst**: die granularen Pro-Tool-Iterationsserien ("Tool-Audit", "Produkt-/UX-Audit" je Rechner) — das war Feature-/Polish-Arbeit mit Ergebnis direkt im Code, nachvollziehbar über [`docs/releases/CHANGELOG.md`](../releases/CHANGELOG.md) und `git log`, keine eigenständige Methodik mit Fundbericht. Ebenso nicht erfasst: reine Architektur-Entscheidungen ohne vorangehenden Review (die tragen ihre eigene fortlaufende Nummer als [ADR](../architecture/decisions/)).

## Konvention

- Ein neuer cross-cutting Audit bekommt beim Anlegen die nächste freie Nummer und eine Zeile in der Tabelle unten — **im selben PR**, der den Audit abschließt, nicht nachträglich.
- Der Fundbericht steht immer im Repo (i. d. R. als datierter Abschnitt in [`docs/qa/overview.md`](overview.md) oder in der thematisch passenden `docs/`-Seite) — ein claude.ai-Artefakt ist höchstens eine zusätzliche, besser lesbare Kopie, nie die einzige Quelle. Das war bei Audit #1 und #2 (unten) noch anders und ist der Grund, warum deren Fundberichte nur noch über das CHANGELOG nachvollziehbar sind — seit Audit #3 durchgängig behoben.
- "Datum" ist das Merge-Datum des (letzten) zugehörigen PRs, nicht das Erstellungsdatum.

## Index

| Nr | Datum | Audit | PR(s) | Fundstelle(n) |
|---|---|---|---|---|
| 1 | 2026-08-22/23 | Erstes Repository-Audit (Security, Datenbank, Code-Qualität, UX) + Tool-Ökosystem-Analyse | #13–#21 | [CHANGELOG [0.1.0]](../releases/CHANGELOG.md), [`security/overview.md`](../security/overview.md) ("Stand: 2026-08-22") — Detailfunde ursprünglich nur als Artefakt, nicht im Repo |
| 2 | 2026-08-26–28 | Backend-/DB-Audit-Serie (Schema-Review, Migrations-Historie, Query-Performance, Server-Actions, Security & Datenintegrität, Infrastruktur/Deployment) | #59–#66 | [`database/schema.md`](../database/schema.md) — Abschlussbericht ursprünglich nur als Artefakt |
| 3 | 2026-08-28 | Accessibility-Audit | #68 | [`qa/overview.md`](overview.md#accessibility-audit-2026-08-28) |
| 4 | 2026-08-28 | Performance-Audit | #69 | [`qa/overview.md`](overview.md#performance-audit-2026-08-28) |
| 5 | 2026-08-28 | Mehrbrowser-Test | #69 | [`qa/overview.md`](overview.md#mehrbrowser-test-2026-08-28) |
| 6 | 2026-08-28 | HTTP-Security-Header-Audit | #71 | [`security/overview.md`](../security/overview.md), [`deployment/docker.md`](../deployment/docker.md#http-security-header) |
| 7 | 2026-08-28 | Test-Coverage-Audit | #72 | [`qa/overview.md`](overview.md#test-coverage-2026-08-28) |
| 8 | 2026-08-28 | Type-Safety-Audit | #73 | [`qa/overview.md`](overview.md#type-safety-audit-2026-08-28) |
| 9 | 2026-08-28 | Dead-Code-Sweep | #74 | [`qa/overview.md`](overview.md#dead-code-sweep-2026-08-28) |
| 10 | 2026-08-28 | Docs-Aktualitäts-Sweep | #75 | [`qa/overview.md`](overview.md#docs-aktualitäts-sweep-2026-08-28), [`releases/CHANGELOG.md`](../releases/CHANGELOG.md) |
| 11 | 2026-08-28 | Projekt-Governance: Audit-Log, Workflow-Doku, Guardrail-Skripte | #76 (dieser PR) | dieses Dokument, [`development/workflow.md`](../development/workflow.md) |

Nächste freie Nummer: **12**.
