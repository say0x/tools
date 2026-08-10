import { describe, expect, it } from "vitest";
import { berechneKaufnebenkosten } from "./kaufnebenkosten";
import { referenceDataFixture } from "../__tests__/fixtures";

describe("berechneKaufnebenkosten", () => {
  it("nutzt den Referenz-Grunderwerbsteuersatz und die Defaults für Notar/Grundbuch/Makler", () => {
    const result = berechneKaufnebenkosten(
      {
        kaufpreis: 200000,
        bundesland: "BAYERN",
        grunderwerbsteuerProzent: 0,
        grunderwerbsteuerOverride: false,
        notarProzent: 1.75,
        notarOverride: false,
        grundbuchProzent: 1.75,
        grundbuchOverride: false,
        maklerprovisionProzent: 0,
        maklerprovisionOverride: false,
      },
      referenceDataFixture
    );

    expect(result.grunderwerbsteuerProzent).toBe(3.5);
    expect(result.grunderwerbsteuerEuro).toBe(7000);
    expect(result.notarProzent).toBe(1.0);
    expect(result.notarEuro).toBe(2000);
    expect(result.grundbuchProzent).toBe(0.5);
    expect(result.grundbuchEuro).toBe(1000);
    expect(result.maklerprovisionProzent).toBeCloseTo(3.57, 2);
    expect(result.maklerprovisionEuro).toBeCloseTo(7140, 2);
    expect(result.summeEuro).toBeCloseTo(17140, 2);
  });

  it("respektiert manuelle Overrides statt der Defaults", () => {
    const result = berechneKaufnebenkosten(
      {
        kaufpreis: 200000,
        bundesland: "BAYERN",
        grunderwerbsteuerProzent: 3.5,
        grunderwerbsteuerOverride: false,
        notarProzent: 2.0,
        notarOverride: true,
        grundbuchProzent: 0.5,
        grundbuchOverride: true,
        maklerprovisionProzent: 0,
        maklerprovisionOverride: true,
      },
      referenceDataFixture
    );

    expect(result.notarEuro).toBe(4000);
    expect(result.grundbuchEuro).toBe(1000);
    expect(result.maklerprovisionEuro).toBe(0);
  });
});
