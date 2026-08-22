/**
 * Sucht in einer Jahresreihe (Index 0 = heute, wie `berechneSparpositionsverlauf`)
 * das erste Jahr, in dem ein Zielbetrag erreicht oder überschritten wird.
 * `null`, wenn das Ziel innerhalb der Reihe nicht erreicht wird (Horizont zu
 * kurz oder Rendite/Sparrate zu niedrig) — bewusst kein Extrapolieren über die
 * Reihe hinaus, das müsste der Aufrufer über einen längeren Horizont lösen.
 */
export function findeJahrBisZielbetrag(verlauf: number[], zielbetrag: number): number | null {
  if (zielbetrag <= verlauf[0]) return 0;
  const index = verlauf.findIndex((wert) => wert >= zielbetrag);
  return index === -1 ? null : index;
}
