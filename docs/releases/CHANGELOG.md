# Changelog

Format angelehnt an [Keep a Changelog](https://keepachangelog.com/). Nur fachlich relevante Änderungen — nicht jeder Commit. Vollständige Historie: `git log`.

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
