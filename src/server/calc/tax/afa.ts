/** Jährliche lineare AfA in Euro auf den Gebäudeanteil des Kaufpreises. */
export function berechneAfaJaehrlich(
  gebaeudewertEuro: number,
  afaSatzProzent: number
): number {
  return round2(gebaeudewertEuro * (afaSatzProzent / 100));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
