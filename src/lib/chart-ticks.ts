// Referenz: docs/tools/weitere-rechner.md ("Geteilte UI-Bausteine für Diagramme")
//
// Recharts' XAxis beschriftet bei einer Kategorie-Achse ohne interval-Prop jeden
// einzelnen Datenpunkt — bei Mehrjahres-Charts (bis zu 50 Jahre) wird das schnell
// unleserlich gequetscht. tickInterval() begrenzt auf ca. 10 sichtbare Beschriftungen.

/** interval-Wert für Recharts' XAxis: 0 = jeden Tick zeigen, N = jeden (N+1)-ten. */
export function tickInterval(datenpunkte: number): number {
  if (datenpunkte <= 12) return 0;
  return Math.ceil(datenpunkte / 10) - 1;
}
