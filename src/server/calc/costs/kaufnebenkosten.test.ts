import { describe, expect, it } from "vitest";
import { berechneKaufnebenkosten } from "./kaufnebenkosten";
import { referenceDataFixture } from "../__tests__/fixtures";

describe("berechneKaufnebenkosten", () => {
  it("nutzt den Referenz-Grunderwerbsteuersatz und die Defaults für Notar/Makler", () => {
    const result = berechneKaufnebenkosten(
      {
        kaufpreis: 200000,
        bundesland: "BAYERN",
        grunderwerbsteuerProzent: 0,
        grunderwerbsteuerOverride: false,
        notarGrundbuchProzent: 1.75,
        notarGrundbuchOverride: false,
        maklerprovisionProzent: 0,
        maklerprovisionOverride: false,
      },
      referenceDataFixture
    );

    expect(result.grunderwerbsteuerProzent).toBe(3.5);
    expect(result.grunderwerbsteuerEuro).toBe(7000);
    expect(result.notarGrundbuchProzent).toBe(1.75);
    expect(result.notarGrundbuchEuro).toBe(3500);
    expect(result.maklerprovisionProzent).toBeCloseTo(3.57, 2);
    expect(result.maklerprovisionEuro).toBeCloseTo(7140, 2);
    expect(result.summeEuro).toBeCloseTo(17640, 2);
  });

  it("respektiert manuelle Overrides statt der Defaults", () => {
    const result = berechneKaufnebenkosten(
      {
        kaufpreis: 200000,
        bundesland: "BAYERN",
        grunderwerbsteuerProzent: 3.5,
        grunderwerbsteuerOverride: false,
        notarGrundbuchProzent: 2.5,
        notarGrundbuchOverride: true,
        maklerprovisionProzent: 0,
        maklerprovisionOverride: true,
      },
      referenceDataFixture
    );

    expect(result.notarGrundbuchEuro).toBe(5000);
    expect(result.maklerprovisionEuro).toBe(0);
  });
});
