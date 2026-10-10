/** Leeres/ungültiges Eingabefeld → null statt NaN/0; akzeptiert deutsches Dezimalkomma. */
export function zahlOderNull(wert: string): number | null {
  const bereinigt = wert.trim().replace(",", ".");
  if (bereinigt === "") return null;
  const n = Number(bereinigt);
  return Number.isFinite(n) ? n : null;
}

/** Vorbelegung für Eingabefelder im deutschen Format ("0,5" statt "0.5"). */
export function zahlAlsText(n: number | null | undefined): string {
  return n == null ? "" : String(n).replace(".", ",");
}
