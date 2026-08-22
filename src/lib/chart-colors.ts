// Referenz: docs/weitere-rechner.md ("Geteilte UI-Bausteine für Diagramme")
//
// Kuratierte Palette für die ersten Einträge (bewusst gewählte, gut unterscheidbare
// Farben) — darüber hinaus (mehr Objekte im Vergleich als Palette-Einträge) wird per
// Goldenem Winkel (137.508°) eine neue, von den vorherigen Farbtönen weit entfernte
// HSL-Farbe erzeugt, statt die Palette zyklisch zu wiederholen. Wiederholte Farben
// würden bei vielen verglichenen Objekten unterschiedliche Objekte optisch
// ununterscheidbar machen (Balken-/Linienfarbe ist dort das primäre Unterscheidungsmerkmal).
const KURATIERTE_FARBEN = [
  "#3b82f6",
  "#f97316",
  "#10b981",
  "#a855f7",
  "#ec4899",
  "#eab308",
  "#06b6d4",
  "#f43f5e",
  "#84cc16",
  "#8b5cf6",
  "#14b8a6",
  "#fb923c",
];

export function farbeFuerIndex(index: number): string {
  if (index < KURATIERTE_FARBEN.length) return KURATIERTE_FARBEN[index];
  const hue = (index * 137.508) % 360;
  return `hsl(${hue.toFixed(1)}, 70%, 60%)`;
}
