# ADR-0012 — Skalierbare Navigation: Kategorien, „Alle Tools“-Panel und Befehlspalette

**Status**: Accepted (baut auf der Tool-Registry aus #93 auf)

## Context

Die Kopfzeile zeigte fünf Tools direkt und den Rest in einem „Weitere Tools“-Dropdown. Gemessen mit 12 Tools:
- Bei 640 px lief die Kopfzeile über (718 px Inhalt), die Seite scrollte seitlich, „Weitere Tools“ war abgeschnitten.
- Bei 768 px brach der Menüknopf auf zwei Zeilen um.

Jedes neue Tool verlängerte entweder die Kopfzeile oder eine ungegliederte Dropdown-Liste. Die Startseite wuchs pro Tool um eine ganze Kartenzeile. Die Plattform soll aber beliebig viele weitere Tools aufnehmen.

## Decision

1. **Kategorien in der Registry** (`KATEGORIEN` in `src/lib/tool-registry.ts`): Jedes Tool gehört genau einer Kategorie an. Panel und Startseite gruppieren danach.
2. **Kopfzeile mit fester Breite**:
   - Logo, Nutzerwechsel, „Start“, höchstens **4 angeheftete Tools** (`kopfzeile: true`, Namen ≤ 16 Zeichen), dazu die Knöpfe „Suchen“ und „Alle Tools“.
   - Unter 1024 px entfallen die angehefteten Links; unter 640 px zeigen beide Knöpfe nur ihr Symbol.
   - Die Breite hängt damit nicht von der Zahl der Tools ab.
3. **„Alle Tools“-Panel**:
   - Ein Panel für Desktop und Mobil, das alle Tools nach Kategorie in Spalten zeigt (1 → 2 → 4 Spalten je nach Breite), mit Kurzbeschreibung. Es ist scrollbar, wenn es höher als der Bildschirm wird.
   - Umgesetzt als Disclosure-Muster (Knopf mit `aria-expanded`, `nav` mit Links), nicht als `role="menu"`. Dadurch funktionieren Tab-Navigation und Screenreader ohne eigene Pfeiltasten-Logik.
4. **Befehlspalette** (Strg+K / ⌘K / „/“):
   - Durchsucht Tools, Bereiche (Tabs) und Schnellzugriffe (z. B. „Neues Objekt anlegen“). Die Suche verknüpft mehrere Begriffe mit UND, ignoriert Umlaut-Schreibweisen und gewichtet Titeltreffer am stärksten; optionale `stichworte` je Tool dienen als Synonyme.
   - Ohne Suchbegriff erscheinen zuerst die zuletzt verwendeten Tools. Dieser Verlauf liegt nur in `localStorage` und ist reiner Komfort.
   - Umgesetzt als nativer `<dialog>` (Fokusfalle, Escape, Rückgabe des Fokus) mit Combobox/Listbox nach WAI-ARIA.
5. **Startseite**: Werkzeuge als ein Kasten je Kategorie mit Liste statt einer Karte je Tool — ein neues Tool kostet eine Zeile in seiner Spalte.
6. **Bereichs-Tabs** generisch (`ToolTabs`) aus `bereiche` der Registry; Query-Parameter wie `datum` bleiben per `behaeltParameter` erhalten.
7. **Grenzen als Tests** (`tool-registry.test.ts`): ≤ 4 Kopfzeilen-Tools, ≤ 8 Tools je Kategorie (sonst neue Kategorie), keine leeren Kategorien, jede Seite gehört zu einem Tool. E2E-Tests prüfen den fehlenden Überlauf bei 375/640/768/1024/1280 px.

## Reason

- **Zwei Zugänge decken beide Nutzungsarten ab:** Das gegliederte Panel hilft beim Stöbern („was gibt es?“), die Suche beim gezielten Springen („Steuer…“). Die Suche skaliert dabei unabhängig von der Tool-Anzahl (gemessen: < 5 ms bei 200 Tools).
- **Die Kopfzeile bleibt stabil:** Nur die meistgenutzten Tools sind direkt erreichbar, alles andere ist zwei Klicks oder ein Tastenkürzel entfernt.
- **Eine Darstellung für zwei Orte:** Panel und Startseite teilen dieselbe Komponente (`ToolKategorien`), dadurch gibt es keine zweite Liste, die auseinanderlaufen kann.
- **Bewusst ohne Bibliothek:** Kein UI-Paket für Dialog/Combobox; der native `<dialog>` deckt Fokusführung und Escape ab, der Rest sind rund 250 Zeilen eigener Code (Palette und Suchlogik).

## Consequences

- Neue Tools brauchen eine Kategorie und eine Beschreibung; `stichworte` und `schnellzugriffe` sind optional, verbessern aber die Suche.
- Wird eine Kategorie voll (> 8), schlägt ein Test fehl — dann eine neue Kategorie in `KATEGORIEN` anlegen statt die Grenze anzuheben.
- „Zuletzt verwendet“ ist gerätelokal und nicht nutzerbezogen. Angeheftete Favoriten je Nutzer wären der nächste Schritt, falls die vier festen Kopfzeilen-Tools nicht mehr für alle passen. Sie sind bewusst nicht umgesetzt (kein Bedarf belegt).
- Referenz: [`docs/tools/weitere-rechner.md`](../../tools/weitere-rechner.md) (Navigation), [`docs/development/workflow.md`](../../development/workflow.md#neues-tool-hinzufügen).
