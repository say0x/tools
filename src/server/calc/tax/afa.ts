/** Standard-AfA-Satz nach §7 Abs. 4 EStG für nach 1925 fertiggestellte Gebäude. */
export const AFA_SATZ_STANDARD_PROZENT = 2;
/** Erhöhter AfA-Satz für vor 1925 fertiggestellte ("Altbau") Gebäude. */
export const AFA_SATZ_ALTBAU_PROZENT = 2.5;
/** Baujahr-Grenze: Gebäude ab diesem Jahr gelten als "Neubau" im Sinne von §7 Abs. 4 EStG. */
export const AFA_ALTBAU_GRENZJAHR = 1925;

/**
 * Ermittelt den anzusetzenden AfA-Satz (computed-with-override): ohne Override
 * wird er allein aus dem Baujahr nach §7 Abs. 4 EStG hergeleitet (2%, bzw. 2,5%
 * bei Baujahr vor 1925), mit Override gilt der manuell eingetragene Satz.
 */
export function ermittleAfaSatzProzent(
  baujahr: number,
  afaSatzProzentOverride: boolean,
  afaSatzProzentManuell: number
): number {
  if (afaSatzProzentOverride) return afaSatzProzentManuell;
  return baujahr < AFA_ALTBAU_GRENZJAHR ? AFA_SATZ_ALTBAU_PROZENT : AFA_SATZ_STANDARD_PROZENT;
}

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
