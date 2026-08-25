// Referenz: docs/tools/weitere-rechner.md ("Geteilte UI-Bausteine für Diagramme")
//
// Validierte kategoriale Palette (8 Farbtöne, feste Reihenfolge) — nicht frei gewählt,
// sondern gegen Colorblind-Sicherheit (CVD) geprüft: Reihenfolge + Helligkeit stammen aus
// einer für genau diesen Zweck (Diagramm-Serienfarben, dunkle Oberfläche) validierten
// Referenzpalette, gegen die tatsächliche App-Oberfläche (#0f172a) nachgeprüft.
//
// Sicherheitsgarantie je nach Verwendung:
// - Benachbarte Paare (Slot 1↔2, 2↔3, ..., 7↔8) sind alle CVD-sicher — ausreichend für
//   Stapel-/Balkendiagramme, wo nur direkt aneinandergrenzende Segmente verglichen werden.
// - Für Kontexte, in denen JEDES Farbpaar nebeneinander auftreten kann (Linien, die sich
//   kreuzen; frei wählbare Objekte im Vergleich) sind nur die ersten 3 Slots (Blau/Orange/
//   Aqua) paarweise sicher — das ist eine strukturelle Grenze des Farbsystems, keine
//   Konfigurationsfrage. Mehr als 3 gleichzeitig frei vergleichbare Serien bräuchten
//   „Sonstiges"-Bündelung oder Small-Multiples statt weiterer Farben.
//
// Darüber hinaus (mehr Objekte im Vergleich als Palette-Einträge) wird per Goldenem
// Winkel (137.508°) eine neue, von den vorherigen Farbtönen weit entfernte HSL-Farbe
// erzeugt statt die Palette zyklisch zu wiederholen — bewusst unvalidiert (kein
// praktikabler Weg, beliebig viele Farben CVD-sicher zu halten), aber immer noch besser
// unterscheidbar als eine Wiederholung.
const KURATIERTE_FARBEN = [
  "#3987e5", // 1 Blau
  "#d95926", // 2 Orange
  "#199e70", // 3 Aqua
  "#c98500", // 4 Gelb
  "#d55181", // 5 Magenta
  "#008300", // 6 Grün
  "#9085e9", // 7 Violett
  "#e66767", // 8 Rot
];

export function farbeFuerIndex(index: number): string {
  if (index < KURATIERTE_FARBEN.length) return KURATIERTE_FARBEN[index];
  const hue = (index * 137.508) % 360;
  return `hsl(${hue.toFixed(1)}, 70%, 60%)`;
}
