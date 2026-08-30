# Changelog

Format angelehnt an [Keep a Changelog](https://keepachangelog.com/). Nur fachlich relevante Änderungen — nicht jeder Commit. Vollständige Historie: `git log`.

## [0.2.0] — 2026-08-23 bis 2026-08-29

Der Versionsbump auf `0.2.0-20260823` geschah bereits mit #22 — aber ohne eigenen Changelog-Eintrag, und die folgenden 49 PRs (drei vollständige Audit-Serien: Tool-Audits je Rechner, Produkt-/UX-Audits je Rechner, Backend-/DB-Audit) blieben ebenfalls uneinsortiert. Dieser Eintrag holt das nach — chronologisch, nur PR-Titel, keine rückwirkend erfundene Detailtiefe (siehe Prinzip unten unter "Vor diesem Changelog"). #72–#76 fehlten trotz der mit #75/#76 eingeführten Pflicht-Regel ebenfalls noch (siehe [Audit-Log](../qa/audit-log.md)) — hier nachgetragen, statt die Lücke ein zweites Mal stehen zu lassen.

- Doku-Vollausbau: ADRs, Ökosystem-Doku, Versionierung, Changelog (#22)
- Dokumentationslücken geschlossen (PropertyForm-UI, Profil-Tool, form-errors.ts) (#23)
- Doppelte Engine-Berechnung auf dem Dashboard vermieden (#24)
- Vitest-Config als natives ESM geladen statt CJS-Warnung zu ignorieren (#25)
- Kennzahlen-Sidebar aus PropertyForm.tsx extrahiert (#26)
- Fehlende loading.tsx für 4 dynamische Routen ergänzt (#27)
- App-weite error.tsx / global-error.tsx ergänzt (#28)
- Besitzstatus-Änderung in der Finanzübersicht bei Fehler zurückgerollt (#29)
- EK-Rendite als "n/v" statt irreführender 0% ohne EK-Einsatz (#30)
- aria-label + role="img" für alle 11 Chart-Komponenten ergänzt (#31)
- Grünton der "Kredit abbezahlt"-Referenzlinie vereinheitlicht (#32)
- Leere Vergleichs-Charts abgefangen, Jahres-Achsen entzerrt (#33)
- Chart-Mark-Spezifikationen an etablierte Dataviz-Richtlinien angeglichen (#34)
- Kategoriale Chart-Palette gegen CVD-Sicherheit validiert (#35)
- Besitzstatus-Badge-Farbe von Ampel-Grün entkoppelt (#36)
- Cashflow-Aufschlüsselung für ein wählbares Jahr (#37)
- Redundante Cashflow-Charts entfernt (#38)
- "Rechnet sich das?"-Badge korrigiert, EK-Rendite-Tooltip ergänzt (#39)
- "Rechnet sich das?" auf Cashflow-Trend statt Jahr-1-Schnappschuss umgestellt (#40)
- Miete/Einnahmen als eigene Balkenzeile im Cashflow-Vergleich (#41)
- Finanzübersicht: Sparpositionen beim Speichern upserten statt löschen+neu anlegen (#42)
- Szenarien: Sparraten-Änderung greift jetzt auch im Default-Startjahr (#43)
- Steuerrechner: Tarifjahr-Anzeige an tatsächlich verwendeten Tarif gekoppelt (#44)
- Kreditvergleich: Volltilgungs-Prädikat vereinheitlicht, Doku-Fund korrigiert (#45)
- Kaufen-oder-Anlegen: verkaufte/archivierte Objekte aus der Auswahl genommen (#46)
- Profil: Kredite upserten statt löschen+neu anlegen, Backup vervollständigt (#47)
- Dashboard: doppelte Ampel-/Besitzstatus-Konstanten auf die zentralen Quellen umgestellt (#48)
- Dashboard: Kaltstart-CTA und Vertrauens-Hinweis für "Vermögen gesamt" (#49)
- Immobilien-Rechner: direkter Link "Kaufen oder Anlegen?" von der Objekt-Detailseite (#50)
- Finanzübersicht: Fehlerliste, Ungespeichert-Hinweis und Szenarien-Link angeglichen (#51)
- Szenarien: Fehlerliste, Ungespeichert-Hinweis, Finanzübersicht-Link und Ladezustand angeglichen (#52)
- Sparziel-Rechner: Chart-Accessibility, Ergebnis-Akzentfarbe und Finanzübersicht-Link ergänzt (#53)
- Steuerrechner: Chart-Accessibility, Feld-Hilfetexte und Profil-Link ergänzt (#54)
- Kreditvergleich: Chart-/Tabellen-Accessibility und Link zu Immobilien-Objekten ergänzt (#55)
- Kaufen-oder-Anlegen: Chart-Accessibility, Leerzustand-Link, Ladezustand und Nav-Label angeglichen (#56)
- Profil: Ungespeichert-Hinweis und vollständigen Ladezustand ergänzt (#57)
- Gesamtsystem: verbleibende Cross-Tool-Lücken aus der UX-Audit-Serie geschlossen (#58)
- Schema: fehlende Indizes auf Foreign-Key-Spalten ergänzt (#59)
- Backend: doppelte ReferenceKaufnebenkostenDefaults-Query per `cache()` dedupliziert (#60)
- PropertyForm: Server-Action-Fehler beim Speichern abgefangen statt Formular crashen zu lassen (#61)
- Referenzdaten-Admin: Server-Action-Fehler in allen 6 Bearbeiten-Widgets abgefangen (#62)
- Switch: Accessible Name für alle 6 Nutzungsstellen sichergestellt (#63)
- Tests: Unit-Tests für die drei ungetesteten Zod-Schemas ergänzt (#64)
- Schema: Geld- und Prozentfelder von Float auf Decimal umgestellt (#65)
- Docs: schema.md an Decimal-Umstellung und FK-Index-Fix angepasst (#66)
- chore: Dependencies auf neueste kompatible Versionen aktualisiert (#67)
- Accessibility: axe-verifizierte a11y-Fixes + E2E-Suite (Playwright + axe-core) (#68)
- Performance-Audit, Multi-Browser-E2E und DB-Backup/Restore ergänzt (#69)
- fix: Server Actions geben `ActionResult` zurück statt Fehler zu werfen (ADR-0008) (#70)
- Security: HTTP-Security-Header (CSP, X-Frame-Options, u. a.) ergänzt (#71)
- QS: Test-Coverage gemessen, echte Lücke in server/data/ geschlossen (#72)
- Type-Safety-Audit dokumentiert — keine Funde (#73)
- Dead-Code-Sweep — verifizierte tote Exports und Dependencies entfernt (#74)
- Docs-Aktualitäts-Sweep — CHANGELOG-Lücke, Zahlen- und Link-Drift behoben (#75)
- Projekt-Governance: Audit-Log, Workflow-Doku, Guardrail-Skripte (#76)
- Dashboard: Netto-Vermögen neben der Brutto-Referenzgröße gezeigt (#77)
- Tilgungsplan: wiederkehrende statt nur einmaliger Anschlussfinanzierung simuliert (#78)
- Daten-Backup: Wiedereinspiel-Mechanismus für den JSON-Export ergänzt (voller Ersatz, Vorschau + Freitext-Bestätigung) (#79)
- Sparpositionen (Finanzübersicht, Szenarien, Sparziel-Rechner): unterjähriger statt jährlicher Zinseszins (#80)
- fix: `upgrade-insecure-requests` aus der CSP entfernt — brach das Laden von CSS/JS bei direktem HTTP-Zugriff (ohne den HTTPS-Reverse-Proxy) komplett (#81)
- Kreditvergleich: beliebig viele Kredite statt fest zwei (#82)
- Szenarien: fünfter Änderungstyp „Immobilie statt Alternativanlage" — Opportunitätskosten-Vergleich wie in Kaufen-oder-Anlegen?, jetzt auch im Szenario-System (#83)
- Steuerrechner: Solidaritätszuschlag, Kirchensteuer und Sozialabgaben ergänzt (bisher nur §32a-Einkommensteuer) — neue steuerliche Angaben im Profil (Bundesland, Kirchensteuerpflicht, Beschäftigungsstatus, gesetzlich krankenversichert, kinderlos) als Vorbelegung (#84)
- Deployment: Opt-in `RESET_USER_DATA_ON_DEPLOY` (Default aus) löscht bei jedem Container-Start alle Nutzer-Daten und seedet die Referenzdaten neu — nur für Demo-/Test-Instanzen gedacht. Grunderwerbsteuer Bremen im Seed korrigiert (5,0% → 5,5%, seit 1.7.2025) (#85)
- Lokales Mehrbenutzer-Datenmodell: Objekte, Profil und Szenarien gehören jetzt einem `User`; neuer `/nutzer`-Bereich zum Anlegen/Wechseln lokaler Test-User (kein echtes Login/Auth — ADR-0009, Revision von ADR-0006), Referenzdaten bleiben global (#86)

## [0.1.0] — 2026-08-23

Erstes Release mit formaler Versionierung/Changelog. Bündelt die Ergebnisse eines vollständigen Repository-Audits (Security, Datenbank, Code-Qualität, UX) und einer Tool-Ökosystem-Analyse.

### Added
- CI-Pipeline (`.github/workflows/ci.yml`): Lint, Tests, Build bei jedem Push/PR (#19, Fix in #20).
- ESLint-Regel erzwingt die framework-freie `calc/`-Grenze mechanisch statt nur per Konvention (#17).
- Tests für zuvor ungetestete `splitPropertyData` und die Import-Deduplizierung (#16).
- Exit-Szenario wertet jetzt tatsächlich aus (Spekulationssteuer war definiert, aber nie verdrahtet) (#13).
- Neue Warnung vor unrealistisch günstigen Annahmen (Leerstand, Wert-/Mietsteigerung) im Immobilien-Rechner (#13).
- Kaufen-oder-Anlegen?: Rendite-Vorschlag aus den echten, besessenen Wertpapierdepots statt hartcodiertem Startwert (#21).
- Architecture Decision Records, Tool-Ökosystem-Dokumentation, restrukturierte `docs/`-Baumstruktur (dieses Release).

### Changed
- Navigation: nur noch 4 Hauptpunkte sichtbar, restliche 6 Tools/Einstellungen in einem "Weitere Tools"-Dropdown (#13).
- `reference-data.ts`: alle 7 Server Actions auf das sonst einheitliche `safeParse()`+lesbare-Fehlermeldung-Muster umgestellt (#15).
- `PropertyForm.tsx` von 1072 auf 832 Zeilen aufgeteilt (`Stat`, `GewerkeSubform`, `flattenFormErrors` extrahiert; letzteres dabei mit einer identischen Duplikat-Implementierung in `ProfileForm.tsx` zusammengeführt) (#18).

### Fixed
- Kreditvergleich: Namensfeld hatte keinen sichtbaren Fokus-Ring bei Tastatur-Navigation (#15).
- `ObjektChartsPanel.tsx`: Betrachtungszeitraum-Input hatte als einzige Stelle im Code keinen Fokus-Ring (#15).
- `docker-compose.yml`: Postgres-Port war unnötig auf den Host gemappt, mit trivialen Zugangsdaten (#15).

### Security
- Postgres-Host-Port-Exposition behoben (siehe Fixed). `npm audit`-Fund (`deepmerge-ts` über die Prisma-CLI) geprüft und als Build-Zeit-only mit geringer realer Ausnutzbarkeit eingeordnet, siehe [`docs/security/overview.md`](../security/overview.md).

## Vor diesem Changelog

Chronologisch (neueste zuerst), nur Commit-Titel — für Details vor der Einführung dieses Changelogs `git log` bemühen, keine rückwirkend erfundene Detailtiefe:

- Dokumentation neu strukturiert: docs/ mit Schnittstellen-Referenz (#12)
- Szenario-Vergleich: Immobilienwert grafisch & schriftlich sichtbar machen (#11)
- Vier neue Tools: Steuerrechner, Kreditvergleich, Kaufen-oder-Anlegen, Backup (#10)
- Lint-Bereinigung, Ladezustände, Bundle-Splitting, Import-Skript-Fix (#9)
- Mehrfachlöschen, Vergleich-Lesbarkeit, Docker-Build-Cache (#8)
- Dashboard: Vermögensverteilung & Ampel-Grafik, mehr Kennzahlen (#7)
- Dashboard, Sparziel-Rechner, Filter/Suche, SEO-Metadaten (#6)
- Szenario-System: "Was wäre wenn" ohne die echten Daten zu verändern (#5)
- Immobilien-Rechner, Finanzübersicht und die vorangehenden Grundlagen (#1–#4, vor der PR-Nummerierungs-Konvention)
