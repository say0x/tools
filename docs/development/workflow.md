# Workflow & Konventionen

Wie an diesem Projekt gearbeitet wird — PR-Ablauf, Audit-Tracking, Code-Dokumentation, Guardrail-Skripte. Entstanden aus einer konkreten Lücke: der CHANGELOG hatte nach dem `0.2.0`-Versionsbump 49 gemergte PRs ohne Eintrag angesammelt, weil nirgends festgehalten war, dass ein PR seinen CHANGELOG-Eintrag mitbringen soll (siehe [Audit #10](../qa/audit-log.md)). Diese Seite macht die bisher nur implizit befolgten Regeln explizit und auffindbar — für jede künftige Session, nicht nur für die, die sie befolgt hat.

## PR-Workflow

1. Branch pro Aufgabe, sprechender Name (`quality/…`, `docs/…`, `fix/…`, …).
2. Änderung + Verifikation lokal: `npx tsc --noEmit`, `npm run lint`, `npx vitest run`, bei Bedarf `rm -rf .next && npm run build`.
3. PR öffnen. **Bei jeder fachlich relevanten Änderung** (siehe [`CHANGELOG.md`](../releases/CHANGELOG.md)s eigene Definition: "nicht jeder Commit") **gehört ein Eintrag unter der aktuellen Version in den PR** — nicht als Nachtrag in einer späteren Session. Rein interne Umbenennungen/Formatierung ohne Verhaltensänderung brauchen keinen Eintrag.
4. CI grün abwarten, mergen (Squash), lokalen `main` synchronisieren.

## Audit-Workflow

Ein **Audit** im Sinne dieses Projekts ist ein cross-cutting Review mit eigener Methodik und schriftlichem Fundbericht (Security-, QA-, Code-Qualität-, Doku-Review, …) — keine Pro-Tool-Feature-Iteration. Vollständiger, fortlaufend nummerierter Index: [`docs/qa/audit-log.md`](../qa/audit-log.md).

- Neue Nummer aus dem Audit-Log ziehen, **im selben PR** wie der Audit-Abschluss dort eintragen.
- Fundbericht geht immer ins Repo (i. d. R. ein datierter Abschnitt in [`docs/qa/overview.md`](../qa/overview.md) oder die thematisch passende Seite). Ein claude.ai-Artefakt ist optional als zusätzliche, besser lesbare Kopie erlaubt — **nie die einzige Quelle**. Frühere Audits (#1, #2), deren Funde nur als Artefakt existierten, sind dafür der abschreckende Präzedenzfall.
- Ein Fund, der nichts ändert (false positive, bewusst akzeptiertes Risiko), gehört genauso dokumentiert wie ein behobener — sonst wird derselbe Fund beim nächsten Audit erneut untersucht.

## Architecture Decision Records

Für Entscheidungen mit dauerhafter Tragweite (nicht für einzelne Bugfixes): neues ADR unter [`docs/architecture/decisions/`](../architecture/decisions/), fortlaufend nummeriert (aktuell bis `0008`), Format siehe bestehende ADRs. Ein ADR beantwortet "warum", nicht nur "was" — das eigentliche "was" steht im Code und ggf. der Tool-Referenzdoku.

## Code-Dokumentation

- **Kommentare**: nur wenn das WARUM nicht aus gut benanntem Code hervorgeht (versteckte Randbedingung, Workaround für einen konkreten Bug, überraschendes Verhalten) — nicht das WAS beschreiben, das sagt der Code selbst.
- **Datei-Header-Kommentar mit `docs/`-Seiten-Verweis**: für Module mit nennenswerter fachlicher Logik und einer eigenen `docs/tools/*.md`/`docs/architecture/*.md`-Gegenstelle (Beispiel: `eslint.config.mjs`s Verweis auf `docs/tools/immobilien-rechner.md`). **Ehrlicher Stand**: das ist eine Konvention für die wichtigen/komplexen Module, keine mechanisch erzwungene Regel für alle 133 Quelldateien — aktuell tragen 5 Dateien einen `// Referenz: docs/...`-Header-Kommentar dieser exakten Form (weitere ~18 verweisen inline, nicht im Header, auf eine `docs/`-Seite). Bei neuen Modulen mit eigener Doku-Seite den Verweis ergänzen; keine Nacherfassung auf Vorrat für Dateien ohne dedizierte Doku-Seite.
- **Bei Widerspruch zwischen Code und Doku gewinnt der Code** (bereits in [`docs/README.md`](../README.md) festgehalten) — Widerspruch wie einen Bug behandeln, nicht stehen lassen.

## Guardrail-Skripte

Zwei Skripte, die genau die Art von Drift abfangen, die den Docs-Aktualitäts-Sweep (Audit #10) nötig gemacht hat — beide jederzeit lokal ausführbar, nicht nur während eines formellen Audits:

- **`npm run check:links`** ([`scripts/check-doc-links.ts`](../../scripts/check-doc-links.ts)): verifiziert jeden Markdown-Link und jede `docs/*.md`-Pfadangabe im Repo gegen das Dateisystem. Deterministisch, keine Fehlalarme — läuft deshalb als eigener Schritt in der CI ([`ci.yml`](../../.github/workflows/ci.yml)), bricht den Build bei einem toten Link.
- **`npm run deadcode`** ([`knip`](https://knip.dev/)): findet unbenutzte Exports, Dateien und Dependencies. **Nicht** in der CI verankert — `knip`-Funde brauchen fachliche Prüfung (strukturell genutzte Typen, generierter Code, Peer-Dependencies erzeugen zuverlässig False Positives, siehe [Audit #9](../qa/audit-log.md)), ein automatischer CI-Fail würde entweder ständig rot sein oder zum reflexhaften Ignorieren verleiten. Empfohlene Kadenz: vor einem größeren Refactor oder im Rahmen eines Dead-Code-Sweep-Audits, nicht bei jedem PR.

## Doku-Aktualität zwischen Audits

Zahlen in der Doku (Testdateien-Anzahl, Migrationsanzahl, Zeilenzahlen einzelner Dateien) veralten zwangsläufig zwischen Audits — dafür gibt es keinen automatischen Schutz, das ist beim nächsten Docs-Aktualitäts-Sweep erneut zu prüfen. Was sich automatisch verhindern lässt (kaputte Links), ist über `check:links` in der CI abgesichert; was fachliche Prüfung braucht (Dead Code, veraltete Zahlen, überholte Annahmen), bleibt Aufgabe des jeweiligen Audits.
