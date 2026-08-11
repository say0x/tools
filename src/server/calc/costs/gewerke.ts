import { VERGLASUNG_KOSTENFAKTOR, ZUSTANDSFAKTOR } from "../constants";
import type { GewerkeAuswertung, GewerkKostenResult, PropertyGewerkInput, ReferenceDataSnapshot } from "../types";

export interface MiteigentumsanteilInput {
  wohnflaeche: number;
  gebaeudeWohnflaecheGesamt: number | null;
  miteigentumsanteilOverride: boolean;
  miteigentumsanteilProzentManuell: number;
}

/**
 * Ermittelt den Miteigentumsanteil (%), der Gemeinschaftseigentum-Kosten auf
 * die eigene Wohnung umlegt (computed-with-override). Ohne hinterlegte
 * Gesamtwohnfläche des Gebäudes ist kein sinnvoller Anteil herleitbar — dann
 * gilt 100% und ein Override wird ignoriert (sonst würde die eigene
 * Wohnfläche fälschlich ein zweites Mal verrechnet).
 */
export function ermittleMiteigentumsanteilProzent(input: MiteigentumsanteilInput): number {
  const { wohnflaeche, gebaeudeWohnflaecheGesamt, miteigentumsanteilOverride, miteigentumsanteilProzentManuell } = input;
  if (!gebaeudeWohnflaecheGesamt || gebaeudeWohnflaecheGesamt <= 0) return 100;
  if (miteigentumsanteilOverride) return miteigentumsanteilProzentManuell;
  return round2((wohnflaeche / gebaeudeWohnflaecheGesamt) * 100);
}

/**
 * Schätzt je erfasstem Gewerk die Sanierungskosten aus Referenz-€/m²
 * (Mittelwert Min/Max) × Zustandsfaktor, und leitet daraus einen nach
 * Kostenanteil gewichteten Risiko-Score ab (fließt in die empfohlene
 * Instandhaltungsrücklage ein — unabhängig davon, ob ein Posten sofort oder
 * erst später saniert werden soll). Sondereigentum-Posten rechnen mit der
 * eigenen Wohnfläche; Gemeinschaftseigentum-Posten mit der Gesamtwohnfläche
 * des Gebäudes × Miteigentumsanteil (fällt ohne hinterlegte Gesamtwohnfläche
 * auf die eigene Wohnfläche zurück — mathematisch identisch zum bisherigen
 * Verhalten). Bei Fenstern fließt zusätzlich die Verglasungsart als
 * Kostenfaktor ein. Posten mit sofortSanieren=false zählen nicht in die
 * Sofortinvestition, sondern werden nur informativ ausgewiesen (bleiben aber
 * Teil des Risiko-Scores für die Instandhaltungsrücklage). Manuelle
 * Kosten-Overrides werden nie negativ übernommen.
 */
export function berechneGewerkeAuswertung(
  gewerke: PropertyGewerkInput[],
  wohnflaeche: number,
  referenceData: Pick<ReferenceDataSnapshot, "gewerkKosten">,
  bezugsjahr: number,
  weg: {
    gebaeudeWohnflaecheGesamt: number | null;
    miteigentumsanteilOverride: boolean;
    miteigentumsanteilProzentManuell: number;
  } = { gebaeudeWohnflaecheGesamt: null, miteigentumsanteilOverride: false, miteigentumsanteilProzentManuell: 100 }
): GewerkeAuswertung {
  const miteigentumsanteilProzentEffektiv = ermittleMiteigentumsanteilProzent({
    wohnflaeche,
    gebaeudeWohnflaecheGesamt: weg.gebaeudeWohnflaecheGesamt,
    miteigentumsanteilOverride: weg.miteigentumsanteilOverride,
    miteigentumsanteilProzentManuell: weg.miteigentumsanteilProzentManuell,
  });
  const geKostenBasisFlaeche =
    weg.gebaeudeWohnflaecheGesamt && weg.gebaeudeWohnflaecheGesamt > 0 ? weg.gebaeudeWohnflaecheGesamt : wohnflaeche;

  const posten: GewerkKostenResult[] = gewerke.map((g) => {
    const alterJahre = g.baujahr != null ? Math.max(0, bezugsjahr - g.baujahr) : null;

    if (g.geschaetzteKostenOverride != null) {
      return {
        gewerk: g.gewerk,
        zustand: g.zustand,
        eigentumsTyp: g.eigentumsTyp,
        geschaetzteKostenEuro: round2(Math.max(0, g.geschaetzteKostenOverride)),
        istOverride: true,
        baujahr: g.baujahr ?? null,
        alterJahre,
        verglasung: g.verglasung ?? null,
        verglasungsfaktor: null,
        sofortSanieren: g.sofortSanieren,
      };
    }

    const kosten = referenceData.gewerkKosten[g.gewerk];
    const kostenProM2Mittel = kosten ? (kosten.min + kosten.max) / 2 : 0;
    const zustandsfaktor = ZUSTANDSFAKTOR[g.zustand] ?? ZUSTANDSFAKTOR[3];
    const verglasungsfaktor = g.gewerk === "FENSTER" && g.verglasung ? VERGLASUNG_KOSTENFAKTOR[g.verglasung] : null;
    const flaechenBasis = g.eigentumsTyp === "GEMEINSCHAFTSEIGENTUM" ? geKostenBasisFlaeche : wohnflaeche;
    const anteilFaktor = g.eigentumsTyp === "GEMEINSCHAFTSEIGENTUM" ? miteigentumsanteilProzentEffektiv / 100 : 1;
    const geschaetzteKostenEuro = round2(kostenProM2Mittel * flaechenBasis * zustandsfaktor * (verglasungsfaktor ?? 1) * anteilFaktor);

    return {
      gewerk: g.gewerk,
      zustand: g.zustand,
      eigentumsTyp: g.eigentumsTyp,
      geschaetzteKostenEuro,
      istOverride: false,
      baujahr: g.baujahr ?? null,
      alterJahre,
      verglasung: g.verglasung ?? null,
      verglasungsfaktor,
      sofortSanieren: g.sofortSanieren,
    };
  });

  const summeSondereigentumEuro = round2(
    posten.filter((p) => p.eigentumsTyp === "SONDEREIGENTUM").reduce((sum, p) => sum + p.geschaetzteKostenEuro, 0)
  );
  const summeGemeinschaftseigentumEuro = round2(
    posten.filter((p) => p.eigentumsTyp === "GEMEINSCHAFTSEIGENTUM").reduce((sum, p) => sum + p.geschaetzteKostenEuro, 0)
  );
  const summeGesamtEuro = round2(summeSondereigentumEuro + summeGemeinschaftseigentumEuro);
  const summeSofortEuro = round2(posten.filter((p) => p.sofortSanieren).reduce((sum, p) => sum + p.geschaetzteKostenEuro, 0));
  const summeSpaeterEuro = round2(posten.filter((p) => !p.sofortSanieren).reduce((sum, p) => sum + p.geschaetzteKostenEuro, 0));

  const gewichtsBasis = posten.reduce((sum, p) => sum + p.geschaetzteKostenEuro, 0);
  const risikoScore =
    gewichtsBasis > 0
      ? round2(posten.reduce((sum, p) => sum + p.zustand * p.geschaetzteKostenEuro, 0) / gewichtsBasis)
      : posten.length > 0
        ? round2(posten.reduce((sum, p) => sum + p.zustand, 0) / posten.length)
        : 3;

  return {
    posten,
    summeSondereigentumEuro,
    summeGemeinschaftseigentumEuro,
    summeGesamtEuro,
    summeSofortEuro,
    summeSpaeterEuro,
    miteigentumsanteilProzentEffektiv,
    risikoScore,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
