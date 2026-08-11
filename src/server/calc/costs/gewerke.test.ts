import { describe, expect, it } from "vitest";
import { berechneGewerkeAuswertung, ermittleMiteigentumsanteilProzent } from "./gewerke";
import { referenceDataFixture } from "../__tests__/fixtures";

describe("berechneGewerkeAuswertung", () => {
  it("schätzt Kosten aus Referenzmittelwert × Wohnfläche × Zustandsfaktor", () => {
    const result = berechneGewerkeAuswertung(
      [{ gewerk: "DACH", zustand: 6, eigentumsTyp: "SONDEREIGENTUM", sofortSanieren: true }],
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
      [{ gewerk: "DACH", zustand: 1, eigentumsTyp: "SONDEREIGENTUM", geschaetzteKostenOverride: 5000, sofortSanieren: true }],
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
        { gewerk: "DACH", zustand: 2, eigentumsTyp: "GEMEINSCHAFTSEIGENTUM", sofortSanieren: true },
        { gewerk: "FENSTER", zustand: 2, eigentumsTyp: "SONDEREIGENTUM", sofortSanieren: true },
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
      [{ gewerk: "FENSTER", zustand: 3, eigentumsTyp: "SONDEREIGENTUM", verglasung: "EINFACH", sofortSanieren: true }],
      100,
      referenceDataFixture,
      2024
    );
    const dreifach = berechneGewerkeAuswertung(
      [{ gewerk: "FENSTER", zustand: 3, eigentumsTyp: "SONDEREIGENTUM", verglasung: "DREIFACH", sofortSanieren: true }],
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
      [{ gewerk: "DACH", zustand: 3, eigentumsTyp: "SONDEREIGENTUM", verglasung: "EINFACH", sofortSanieren: true }],
      100,
      referenceDataFixture,
      2024
    );
    // Mittelwert Dach (150+250)/2=200, Zustand 3 -> Faktor 0.3 -> 200*100*0.3=6000, kein Verglasungsfaktor
    expect(result.posten[0].geschaetzteKostenEuro).toBe(6000);
  });

  it("lässt einen negativen Kosten-Override nie negativ in die Summe einfließen", () => {
    const result = berechneGewerkeAuswertung(
      [{ gewerk: "DACH", zustand: 3, eigentumsTyp: "SONDEREIGENTUM", geschaetzteKostenOverride: -50000, sofortSanieren: true }],
      100,
      referenceDataFixture,
      2024
    );
    expect(result.posten[0].geschaetzteKostenEuro).toBe(0);
    expect(result.summeGesamtEuro).toBe(0);
  });

  it("berechnet das Alter aus Baujahr und Bezugsjahr", () => {
    const result = berechneGewerkeAuswertung(
      [{ gewerk: "DACH", zustand: 3, eigentumsTyp: "SONDEREIGENTUM", baujahr: 1990, sofortSanieren: true }],
      100,
      referenceDataFixture,
      2024
    );
    expect(result.posten[0].alterJahre).toBe(34);
  });

  it("trennt Sofort- und Später-Summe nach dem sofortSanieren-Schalter, Risiko-Score bleibt unverändert", () => {
    const result = berechneGewerkeAuswertung(
      [
        { gewerk: "DACH", zustand: 6, eigentumsTyp: "SONDEREIGENTUM", sofortSanieren: true },
        { gewerk: "HEIZUNG", zustand: 5, eigentumsTyp: "SONDEREIGENTUM", sofortSanieren: false },
      ],
      100,
      referenceDataFixture,
      2024
    );

    const dachKosten = result.posten[0].geschaetzteKostenEuro;
    const heizungKosten = result.posten[1].geschaetzteKostenEuro;

    expect(result.summeSofortEuro).toBeCloseTo(dachKosten, 2);
    expect(result.summeSpaeterEuro).toBeCloseTo(heizungKosten, 2);
    expect(result.summeGesamtEuro).toBeCloseTo(dachKosten + heizungKosten, 2);
    // Risiko-Score bezieht weiterhin BEIDE Posten ein, unabhängig von sofortSanieren.
    expect(result.risikoScore).toBeCloseTo(
      (6 * dachKosten + 5 * heizungKosten) / (dachKosten + heizungKosten),
      2
    );
  });

  it("rechnet Gemeinschaftseigentum-Kosten ohne hinterlegte Gesamtwohnfläche wie bisher über die eigene Wohnfläche", () => {
    const result = berechneGewerkeAuswertung(
      [{ gewerk: "DACH", zustand: 6, eigentumsTyp: "GEMEINSCHAFTSEIGENTUM", sofortSanieren: true }],
      60,
      referenceDataFixture,
      2024
    );
    // Mittelwert Dach 200, Zustand 6 -> Faktor 1.0 -> 200*60*1.0 (eigene Wohnfläche als Basis)
    expect(result.posten[0].geschaetzteKostenEuro).toBe(12000);
    expect(result.miteigentumsanteilProzentEffektiv).toBe(100);
  });

  it("rechnet Gemeinschaftseigentum mit hinterlegter Gesamtwohnfläche mathematisch identisch, solange kein Override gesetzt ist", () => {
    const ohneGesamtflaeche = berechneGewerkeAuswertung(
      [{ gewerk: "DACH", zustand: 6, eigentumsTyp: "GEMEINSCHAFTSEIGENTUM", sofortSanieren: true }],
      60,
      referenceDataFixture,
      2024
    );
    const mitGesamtflaeche = berechneGewerkeAuswertung(
      [{ gewerk: "DACH", zustand: 6, eigentumsTyp: "GEMEINSCHAFTSEIGENTUM", sofortSanieren: true }],
      60,
      referenceDataFixture,
      2024,
      { gebaeudeWohnflaecheGesamt: 600, miteigentumsanteilOverride: false, miteigentumsanteilProzentManuell: 100 }
    );
    expect(mitGesamtflaeche.posten[0].geschaetzteKostenEuro).toBeCloseTo(ohneGesamtflaeche.posten[0].geschaetzteKostenEuro, 2);
    expect(mitGesamtflaeche.miteigentumsanteilProzentEffektiv).toBe(10); // 60/600*100
  });

  it("wendet einen manuell überschriebenen Miteigentumsanteil auf die Gesamtwohnfläche an, nicht auf Sondereigentum", () => {
    const result = berechneGewerkeAuswertung(
      [
        { gewerk: "DACH", zustand: 6, eigentumsTyp: "GEMEINSCHAFTSEIGENTUM", sofortSanieren: true },
        { gewerk: "FENSTER", zustand: 6, eigentumsTyp: "SONDEREIGENTUM", sofortSanieren: true },
      ],
      60,
      referenceDataFixture,
      2024,
      { gebaeudeWohnflaecheGesamt: 600, miteigentumsanteilOverride: true, miteigentumsanteilProzentManuell: 8.7 }
    );
    // Mittelwert Dach 200 * 600 (Gesamtwohnfläche) * 1.0 (Zustand 6) * 8.7% = 10440
    expect(result.posten[0].geschaetzteKostenEuro).toBeCloseTo(10440, 2);
    // Sondereigentum bleibt unverändert über die eigene Wohnfläche (60m²), kein Anteil angewendet.
    // Mittelwert Fenster (80+150)/2=115, Zustand 6 -> Faktor 1.0 -> 115*60
    expect(result.posten[1].geschaetzteKostenEuro).toBeCloseTo(115 * 60, 2);
    expect(result.miteigentumsanteilProzentEffektiv).toBe(8.7);
  });

  it("ignoriert einen Miteigentumsanteil-Override ohne hinterlegte Gesamtwohnfläche (kein Doppel-Diskontieren)", () => {
    const result = berechneGewerkeAuswertung(
      [{ gewerk: "DACH", zustand: 6, eigentumsTyp: "GEMEINSCHAFTSEIGENTUM", sofortSanieren: true }],
      60,
      referenceDataFixture,
      2024,
      { gebaeudeWohnflaecheGesamt: null, miteigentumsanteilOverride: true, miteigentumsanteilProzentManuell: 8.7 }
    );
    expect(result.miteigentumsanteilProzentEffektiv).toBe(100);
    expect(result.posten[0].geschaetzteKostenEuro).toBe(12000); // wie ohne Anteil-Feature: 200*60*1.0
  });
});

describe("ermittleMiteigentumsanteilProzent", () => {
  it("liefert 100% ohne hinterlegte Gesamtwohnfläche, unabhängig vom Override", () => {
    expect(
      ermittleMiteigentumsanteilProzent({
        wohnflaeche: 60,
        gebaeudeWohnflaecheGesamt: null,
        miteigentumsanteilOverride: true,
        miteigentumsanteilProzentManuell: 8.7,
      })
    ).toBe(100);
  });

  it("leitet den Anteil ohne Override aus eigeneWohnflaeche/gebaeudeWohnflaecheGesamt her", () => {
    expect(
      ermittleMiteigentumsanteilProzent({
        wohnflaeche: 60,
        gebaeudeWohnflaecheGesamt: 600,
        miteigentumsanteilOverride: false,
        miteigentumsanteilProzentManuell: 99,
      })
    ).toBe(10);
  });

  it("verwendet mit Override den manuell eingetragenen Anteil statt der Herleitung", () => {
    expect(
      ermittleMiteigentumsanteilProzent({
        wohnflaeche: 60,
        gebaeudeWohnflaecheGesamt: 600,
        miteigentumsanteilOverride: true,
        miteigentumsanteilProzentManuell: 8.7,
      })
    ).toBe(8.7);
  });
});
