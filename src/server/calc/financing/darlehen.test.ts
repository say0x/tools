import { describe, expect, it } from "vitest";
import { berechneFinanzierung, berechneGesamtinvestition } from "./darlehen";
import type { PropertyFinancingInput } from "../types";

const basis = { kaufpreis: 200000, kaufnebenkostenEuro: 17640, sofortinvestitionEuro: 0 };

function financing(overrides: Partial<PropertyFinancingInput> = {}): PropertyFinancingInput {
  return {
    eigenkapital: 0,
    zinssatzProzent: 4,
    anfaenglicheTilgungProzent: 2,
    zinsbindungJahre: 10,
    finanzierungsart: "FINANZIERUNG_100",
    eigenkapitalquoteManuellProzent: null,
    ...overrides,
  };
}

describe("berechneGesamtinvestition", () => {
  it("summiert Kaufpreis, Nebenkosten und Sofortinvestition", () => {
    expect(berechneGesamtinvestition({ kaufpreis: 200000, kaufnebenkostenEuro: 17640, sofortinvestitionEuro: 5000 })).toBe(
      222640
    );
  });
});

describe("berechneFinanzierung", () => {
  it("FINANZIERUNG_100: Darlehen deckt nur den Kaufpreis", () => {
    const result = berechneFinanzierung(financing({ finanzierungsart: "FINANZIERUNG_100" }), basis);
    expect(result.darlehenssummeEuro).toBe(200000);
    expect(result.eigenkapitalEinsatzEuro).toBeCloseTo(17640, 2);
  });

  it("FINANZIERUNG_110: Darlehen deckt Kaufpreis + Nebenkosten", () => {
    const result = berechneFinanzierung(financing({ finanzierungsart: "FINANZIERUNG_110" }), basis);
    expect(result.darlehenssummeEuro).toBeCloseTo(217640, 2);
    expect(result.eigenkapitalEinsatzEuro).toBe(0);
  });

  it("MANUELL: Darlehen aus Gesamtinvestition abzüglich EK-Quote", () => {
    const result = berechneFinanzierung(
      financing({ finanzierungsart: "MANUELL", eigenkapitalquoteManuellProzent: 20 }),
      basis
    );
    const gesamtinvestition = berechneGesamtinvestition(basis);
    expect(result.darlehenssummeEuro).toBeCloseTo(gesamtinvestition * 0.8, 2);
    expect(result.eigenkapitalEinsatzEuro).toBeCloseTo(gesamtinvestition * 0.2, 2);
  });
});
