import { describe, expect, it } from "vitest";
import { berechneGewerkeAuswertung } from "./gewerke";
import { referenceDataFixture } from "../__tests__/fixtures";

describe("berechneGewerkeAuswertung", () => {
  it("schätzt Kosten aus Referenzmittelwert × Wohnfläche × Zustandsfaktor", () => {
    const result = berechneGewerkeAuswertung(
      [{ gewerk: "DACH", zustand: 6, eigentumsTyp: "SONDEREIGENTUM" }],
      100,
      referenceDataFixture,
      2024
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
      referenceDataFixture,
      2024
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
      referenceDataFixture,
      2024
    );

    expect(result.summeGemeinschaftseigentumEuro).toBeGreaterThan(0);
    expect(result.summeSondereigentumEuro).toBeGreaterThan(0);
    expect(result.summeGesamtEuro).toBeCloseTo(
      result.summeGemeinschaftseigentumEuro + result.summeSondereigentumEuro,
      2
    );
  });

  it("liefert einen neutralen Risiko-Score ohne erfasste Gewerke", () => {
    const result = berechneGewerkeAuswertung([], 100, referenceDataFixture, 2024);
    expect(result.risikoScore).toBe(3);
    expect(result.summeGesamtEuro).toBe(0);
  });

  it("wendet den Verglasungsfaktor bei Fenstern zusätzlich zum Zustandsfaktor an", () => {
    const einfach = berechneGewerkeAuswertung(
      [{ gewerk: "FENSTER", zustand: 3, eigentumsTyp: "SONDEREIGENTUM", verglasung: "EINFACH" }],
      100,
      referenceDataFixture,
      2024
    );
    const dreifach = berechneGewerkeAuswertung(
      [{ gewerk: "FENSTER", zustand: 3, eigentumsTyp: "SONDEREIGENTUM", verglasung: "DREIFACH" }],
      100,
      referenceDataFixture,
      2024
    );
    // Mittelwert Fenster (80+150)/2=115, Zustand 3 -> Faktor 0.3 -> 115*100*0.3=3450 Basis
    expect(einfach.posten[0].geschaetzteKostenEuro).toBeCloseTo(3450 * 1.15, 2);
    expect(dreifach.posten[0].geschaetzteKostenEuro).toBeCloseTo(3450 * 0.7, 2);
    expect(einfach.posten[0].geschaetzteKostenEuro).toBeGreaterThan(dreifach.posten[0].geschaetzteKostenEuro);
  });

  it("ignoriert den Verglasungsfaktor bei anderen Gewerken und bei manuellem Override", () => {
    const result = berechneGewerkeAuswertung(
      [{ gewerk: "DACH", zustand: 3, eigentumsTyp: "SONDEREIGENTUM", verglasung: "EINFACH" }],
      100,
      referenceDataFixture,
      2024
    );
    // Mittelwert Dach (150+250)/2=200, Zustand 3 -> Faktor 0.3 -> 200*100*0.3=6000, kein Verglasungsfaktor
    expect(result.posten[0].geschaetzteKostenEuro).toBe(6000);
  });

  it("lässt einen negativen Kosten-Override nie negativ in die Summe einfließen", () => {
    const result = berechneGewerkeAuswertung(
      [{ gewerk: "DACH", zustand: 3, eigentumsTyp: "SONDEREIGENTUM", geschaetzteKostenOverride: -50000 }],
      100,
      referenceDataFixture,
      2024
    );
    expect(result.posten[0].geschaetzteKostenEuro).toBe(0);
    expect(result.summeGesamtEuro).toBe(0);
  });

  it("berechnet das Alter aus Baujahr und Bezugsjahr", () => {
    const result = berechneGewerkeAuswertung(
      [{ gewerk: "DACH", zustand: 3, eigentumsTyp: "SONDEREIGENTUM", baujahr: 1990 }],
      100,
      referenceDataFixture,
      2024
    );
    expect(result.posten[0].alterJahre).toBe(34);
  });
});
