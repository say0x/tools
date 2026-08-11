import { describe, expect, it } from "vitest";
import { berechneAfaJaehrlich, ermittleAfaSatzProzent } from "./afa";

describe("berechneAfaJaehrlich", () => {
  it("berechnet die lineare AfA korrekt", () => {
    expect(berechneAfaJaehrlich(160000, 2)).toBe(3200);
  });

  it("skaliert linear mit dem Satz", () => {
    expect(berechneAfaJaehrlich(160000, 2.5)).toBe(4000);
  });
});

describe("ermittleAfaSatzProzent", () => {
  it("leitet ohne Override den Standardsatz (2%) für Baujahr ab 1925 her", () => {
    expect(ermittleAfaSatzProzent(1925, false, 99)).toBe(2);
    expect(ermittleAfaSatzProzent(1995, false, 99)).toBe(2);
    expect(ermittleAfaSatzProzent(2024, false, 99)).toBe(2);
  });

  it("leitet ohne Override den Altbau-Satz (2,5%) für Baujahr vor 1925 her", () => {
    expect(ermittleAfaSatzProzent(1924, false, 99)).toBe(2.5);
    expect(ermittleAfaSatzProzent(1800, false, 99)).toBe(2.5);
  });

  it("verwendet mit Override den manuell eingetragenen Satz statt der Herleitung", () => {
    expect(ermittleAfaSatzProzent(1995, true, 3.5)).toBe(3.5);
    expect(ermittleAfaSatzProzent(1800, true, 1)).toBe(1);
  });
});
