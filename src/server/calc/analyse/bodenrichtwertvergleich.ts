// Referenz: docs/tools/immobilien-rechner.md
//
// Bewusst getrennt von verhandlungsargumente.ts, dessen eigene Dokumentation
// nur "reine Fakten aus dem eigenen Modell — keine erfundenen
// Marktvergleiche oder Richtwerte von außen" einbezieht: dieser Vergleich
// nutzt gezielt externe, amtliche Bodenrichtwerte (BORIS-D/BORIS-SH).
//
// Bewusst rein informativ, kein Ampel-Verdikt wie bei den
// Verhandlungsargumenten: eine "zu teuer"-Bewertung bräuchte eine echte
// Aufteilung von Boden- und Gebäudewert (Sachwertverfahren) — ein simpler
// Schwellenwert auf den Bodenwert-Anteil wäre selbst der "erfundene
// Richtwert", den verhandlungsargumente.ts explizit vermeidet.

import type { Bundesland, Lagetyp, Objekttyp } from "../types";

export interface BodenrichtwertVergleich {
  bodenrichtwertProM2: number;
  grundstuecksflaecheQm: number;
  bodenwertGeschaetzt: number;
  anteilAmKaufpreisProzent: number;
}

export interface BodenrichtwertVergleichInput {
  objekttyp: Objekttyp;
  grundstuecksflaecheQm: number | null;
  bundesland: Bundesland;
  lagetyp: Lagetyp;
  kaufpreis: number;
  bodenrichtwertByBundeslandLagetyp: Record<string, number>;
}

/**
 * Schätzt den Bodenwert-Anteil am Kaufpreis anhand des amtlichen
 * Bodenrichtwerts (€/m² Grundstücksfläche) — rein informativ, siehe
 * Modulkommentar oben. Liefert null, wenn der Vergleich nicht anwendbar ist:
 * ETW hat kein eigenes Grundstück in diesem Datenmodell (WEG-
 * Bruchteilseigentum), ohne erfasste Grundstücksfläche fehlt die Basis, und
 * ohne passende Referenzzeile (aktuell nur Schleswig-Holstein) gibt es
 * nichts zum Vergleichen.
 */
export function berechneBodenrichtwertVergleich(input: BodenrichtwertVergleichInput): BodenrichtwertVergleich | null {
  if (input.objekttyp === "ETW") return null;
  if (input.grundstuecksflaecheQm == null || input.grundstuecksflaecheQm <= 0) return null;
  if (input.kaufpreis <= 0) return null;

  const referenzKey = `${input.bundesland}:${input.lagetyp}`;
  const bodenrichtwertProM2 = input.bodenrichtwertByBundeslandLagetyp[referenzKey];
  if (bodenrichtwertProM2 == null) return null;

  const bodenwertGeschaetzt = bodenrichtwertProM2 * input.grundstuecksflaecheQm;

  return {
    bodenrichtwertProM2,
    grundstuecksflaecheQm: input.grundstuecksflaecheQm,
    bodenwertGeschaetzt,
    anteilAmKaufpreisProzent: (bodenwertGeschaetzt / input.kaufpreis) * 100,
  };
}
