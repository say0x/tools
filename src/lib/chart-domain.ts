// Y-Achsen-Domain für Balkendiagramme, die immer die Nullinie einschließt —
// sonst wirken Balkenhöhen-Unterschiede optisch verzerrt (Standard-
// Auto-Skalierung von Recharts schneidet bei rein negativen/positiven Daten
// oft knapp am Datenbereich ab, ohne 0 als Referenz).

function niceFloor(value: number): number {
  if (value >= 0) return 0;
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(value))));
  return Math.floor(value / magnitude) * magnitude;
}

function niceCeil(value: number): number {
  if (value <= 0) return 0;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / magnitude) * magnitude;
}

export const nullBasierteDomain: [(dataMin: number) => number, (dataMax: number) => number] = [
  (dataMin: number) => niceFloor(dataMin),
  (dataMax: number) => niceCeil(dataMax),
];
