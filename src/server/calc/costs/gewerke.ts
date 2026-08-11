import { VERGLASUNG_KOSTENFAKTOR, ZUSTANDSFAKTOR } from "../constants";
import type { GewerkeAuswertung, GewerkKostenResult, PropertyGewerkInput, ReferenceDataSnapshot } from "../types";

/**
 * Schätzt je erfasstem Gewerk die Sanierungskosten aus Referenz-€/m²
 * (Mittelwert Min/Max) × Wohnfläche × Zustandsfaktor, und leitet daraus einen
 * nach Kostenanteil gewichteten Risiko-Score ab (fließt in die empfohlene
 * Instandhaltungsrücklage ein). Gemeinschaftseigentum-Posten werden separat
 * ausgewiesen, da sie ggf. über eine WEG-Sonderumlage statt direkt anfallen.
 * Bei Fenstern fließt zusätzlich die Verglasungsart als Kostenfaktor ein
 * (unabhängig vom Zustand — Einfachverglasung ist energetisch unabhängig vom
 * optischen Zustand ersetzungswürdig). Manuelle Kosten-Overrides werden nie
 * negativ übernommen (Schutz gegen fehlerhafte Eingaben, die die
 * Gesamtinvestition sonst rechnerisch mindern würden).
 */
export function berechneGewerkeAuswertung(
  gewerke: PropertyGewerkInput[],
  wohnflaeche: number,
  referenceData: Pick<ReferenceDataSnapshot, "gewerkKosten">,
  bezugsjahr: number
): GewerkeAuswertung {
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
      };
    }

    const kosten = referenceData.gewerkKosten[g.gewerk];
    const kostenProM2Mittel = kosten ? (kosten.min + kosten.max) / 2 : 0;
    const zustandsfaktor = ZUSTANDSFAKTOR[g.zustand] ?? ZUSTANDSFAKTOR[3];
    const verglasungsfaktor = g.gewerk === "FENSTER" && g.verglasung ? VERGLASUNG_KOSTENFAKTOR[g.verglasung] : null;
    const geschaetzteKostenEuro = round2(kostenProM2Mittel * wohnflaeche * zustandsfaktor * (verglasungsfaktor ?? 1));

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
    };
  });

  const summeSondereigentumEuro = round2(
    posten.filter((p) => p.eigentumsTyp === "SONDEREIGENTUM").reduce((sum, p) => sum + p.geschaetzteKostenEuro, 0)
  );
  const summeGemeinschaftseigentumEuro = round2(
    posten.filter((p) => p.eigentumsTyp === "GEMEINSCHAFTSEIGENTUM").reduce((sum, p) => sum + p.geschaetzteKostenEuro, 0)
  );
  const summeGesamtEuro = round2(summeSondereigentumEuro + summeGemeinschaftseigentumEuro);

  const gewichtsBasis = posten.reduce((sum, p) => sum + p.geschaetzteKostenEuro, 0);
  const risikoScore =
    gewichtsBasis > 0
      ? round2(posten.reduce((sum, p) => sum + p.zustand * p.geschaetzteKostenEuro, 0) / gewichtsBasis)
      : posten.length > 0
        ? round2(posten.reduce((sum, p) => sum + p.zustand, 0) / posten.length)
        : 3;

  return { posten, summeSondereigentumEuro, summeGemeinschaftseigentumEuro, summeGesamtEuro, risikoScore };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
