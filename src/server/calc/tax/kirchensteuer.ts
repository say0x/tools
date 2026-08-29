import type { Bundesland } from "../types";

// Kirchensteuersatz nach Bundesland (Sitz der Kirchengemeinde, nicht der
// Konfession) — stabil seit Jahrzehnten, deshalb anders als Soli/Sozialabgaben
// keine Jahres-Tabelle. Bayern und Baden-Württemberg 8 %, alle anderen 14
// Bundesländer 9 %.
const ACHT_PROZENT_BUNDESLAENDER: ReadonlySet<Bundesland> = new Set(["BAYERN", "BADEN_WUERTTEMBERG"]);

/** Kirchensteuer als Prozentsatz der Einkommensteuer, je nach Bundesland. */
export function kirchensteuersatzProzent(bundesland: Bundesland): number {
  return ACHT_PROZENT_BUNDESLAENDER.has(bundesland) ? 8 : 9;
}

/**
 * Kirchensteuer (8 % bzw. 9 % der Einkommensteuer, je nach Bundesland) — 0,
 * wenn keine Kirchensteuerpflicht besteht. Kein Kinderfreibetrag-Abzug von
 * der Bemessungsgrundlage modelliert (wie beim restlichen Steuerrechner).
 */
export function berechneKirchensteuer(einkommensteuer: number, bundesland: Bundesland, kirchensteuerpflichtig: boolean): number {
  if (!kirchensteuerpflichtig) return 0;
  return round2(einkommensteuer * (kirchensteuersatzProzent(bundesland) / 100));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
