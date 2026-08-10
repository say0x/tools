import { describe, expect, it } from "vitest";
import { berechneAfaJaehrlich } from "./afa";

describe("berechneAfaJaehrlich", () => {
  it("berechnet die lineare AfA korrekt", () => {
    expect(berechneAfaJaehrlich(160000, 2)).toBe(3200);
  });

  it("skaliert linear mit dem Satz", () => {
    expect(berechneAfaJaehrlich(160000, 2.5)).toBe(4000);
  });
});
