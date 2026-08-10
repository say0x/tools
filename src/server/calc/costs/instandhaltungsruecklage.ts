import type { ReferenceDataSnapshot } from "../types";

export interface InstandhaltungsruecklageResult {
  basisSatzProM2ProJahr: number;
  risikoMultiplikator: number;
  empfohleneRuecklageMonatlich: number;
}

/**
 * Peters'sche Formel: Alters-gestaffelter €/m²/Jahr-Satz (aus Referenzdaten)
 * × Wohnfläche, skaliert mit einem Risiko-Multiplikator aus dem
 * Gewerke-Zustands-Score (1 sehr gut … 6 sehr schlecht, 3 = neutral).
 */
export function berechneEmpfohleneInstandhaltungsruecklage(
  baujahr: number,
  wohnflaeche: number,
  gewerkeRisikoScore: number,
  referenceData: Pick<ReferenceDataSnapshot, "instandhaltungssaetze">,
  bezugsjahr: number = new Date().getFullYear()
): InstandhaltungsruecklageResult {
  const alter = Math.max(0, bezugsjahr - baujahr);

  const eintrag =
    referenceData.instandhaltungssaetze.find(
      (s) => alter >= s.von && (s.bis === null || alter <= s.bis)
    ) ?? referenceData.instandhaltungssaetze[referenceData.instandhaltungssaetze.length - 1];

  const basisSatzProM2ProJahr = eintrag?.satz ?? 9;
  const risikoMultiplikator = round2(1 + (gewerkeRisikoScore - 3) * 0.15);

  const jaehrlich = basisSatzProM2ProJahr * wohnflaeche * risikoMultiplikator;

  return {
    basisSatzProM2ProJahr,
    risikoMultiplikator,
    empfohleneRuecklageMonatlich: round2(jaehrlich / 12),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
