import { describe, expect, it } from "vitest";
import { berechneBodenrichtwertVergleich, type BodenrichtwertVergleichInput } from "../bodenrichtwertvergleich";

function baseInput(overrides: Partial<BodenrichtwertVergleichInput> = {}): BodenrichtwertVergleichInput {
  return {
    objekttyp: "HAUS",
    grundstuecksflaecheQm: 500,
    bundesland: "SCHLESWIG_HOLSTEIN",
    lagetyp: "LAENDLICH",
    kaufpreis: 400_000,
    bodenrichtwertByBundeslandLagetyp: { "SCHLESWIG_HOLSTEIN:LAENDLICH": 60 },
    ...overrides,
  };
}

describe("berechneBodenrichtwertVergleich", () => {
  it("liefert null für ETW (kein eigenes Grundstück in diesem Datenmodell)", () => {
    expect(berechneBodenrichtwertVergleich(baseInput({ objekttyp: "ETW" }))).toBeNull();
  });

  it("liefert null ohne erfasste Grundstücksfläche", () => {
    expect(berechneBodenrichtwertVergleich(baseInput({ grundstuecksflaecheQm: null }))).toBeNull();
  });

  it("liefert null bei Grundstücksfläche 0", () => {
    expect(berechneBodenrichtwertVergleich(baseInput({ grundstuecksflaecheQm: 0 }))).toBeNull();
  });

  it("liefert null ohne passende Referenzzeile (z. B. anderes Bundesland)", () => {
    expect(berechneBodenrichtwertVergleich(baseInput({ bundesland: "BAYERN" }))).toBeNull();
  });

  it("berechnet Bodenwert und Anteil am Kaufpreis für HAUS mit validen Daten", () => {
    const ergebnis = berechneBodenrichtwertVergleich(baseInput());

    expect(ergebnis).toEqual({
      bodenrichtwertProM2: 60,
      grundstuecksflaecheQm: 500,
      bodenwertGeschaetzt: 30_000,
      anteilAmKaufpreisProzent: 7.5,
    });
  });

  it("funktioniert auch für MEHRFAMILIENHAUS", () => {
    const ergebnis = berechneBodenrichtwertVergleich(
      baseInput({ objekttyp: "MEHRFAMILIENHAUS", lagetyp: "GROSSSTADT", bodenrichtwertByBundeslandLagetyp: { "SCHLESWIG_HOLSTEIN:GROSSSTADT": 450 } })
    );

    expect(ergebnis).toEqual({
      bodenrichtwertProM2: 450,
      grundstuecksflaecheQm: 500,
      bodenwertGeschaetzt: 225_000,
      anteilAmKaufpreisProzent: 56.25,
    });
  });
});
