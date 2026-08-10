import { describe, expect, it } from "vitest";
import { berechneGewerkeAuswertung } from "./gewerke";
import { referenceDataFixture } from "../__tests__/fixtures";

describe("berechneGewerkeAuswertung", () => {
  it("schätzt Kosten aus Referenzmittelwert × Wohnfläche × Zustandsfaktor", () => {
    const result = berechneGewerkeAuswertung(
      [{ gewerk: "DACH", zustand: 6, eigentumsTyp: "SONDEREIGENTUM" }],
      100,
      referenceDataFixture
    );

    // Mittelwert Dach (150+250)/2=200, Zustand 6 -> Faktor 1.0 -> 200*100*1.0
    expect(result.posten[0].geschaetzteKostenEuro).toBe(20000);
    expect(result.summeSondereigentumEuro).toBe(20000);
    expect(result.summeGemeinschaftseigentumEuro).toBe(0);
    expect(result.risikoScore).toBe(6);
  });

  it("respektiert einen manuellen Kosten-Override unabhängig vom Zustand", () => {
    const result = berechneGewerkeAuswertung(
      [{ gewerk: "DACH", zustand: 1, eigentumsTyp: "SONDEREIGENTUM", geschaetzteKostenOverride: 5000 }],
      100,
      referenceDataFixture
    );

    expect(result.posten[0].geschaetzteKostenEuro).toBe(5000);
    expect(result.posten[0].istOverride).toBe(true);
  });

  it("weist Gemeinschaftseigentum getrennt aus, zählt aber zur Gesamtsumme", () => {
    const result = berechneGewerkeAuswertung(
      [
        { gewerk: "DACH", zustand: 2, eigentumsTyp: "GEMEINSCHAFTSEIGENTUM" },
        { gewerk: "FENSTER", zustand: 2, eigentumsTyp: "SONDEREIGENTUM" },
      ],
      100,
      referenceDataFixture
    );

    expect(result.summeGemeinschaftseigentumEuro).toBeGreaterThan(0);
    expect(result.summeSondereigentumEuro).toBeGreaterThan(0);
    expect(result.summeGesamtEuro).toBeCloseTo(
      result.summeGemeinschaftseigentumEuro + result.summeSondereigentumEuro,
      2
    );
  });

  it("liefert einen neutralen Risiko-Score ohne erfasste Gewerke", () => {
    const result = berechneGewerkeAuswertung([], 100, referenceDataFixture);
    expect(result.risikoScore).toBe(3);
    expect(result.summeGesamtEuro).toBe(0);
  });
});
