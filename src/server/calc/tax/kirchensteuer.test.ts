import { describe, expect, it } from "vitest";
import { berechneKirchensteuer, kirchensteuersatzProzent } from "./kirchensteuer";

describe("kirchensteuersatzProzent", () => {
  it("ist 8% in Bayern und Baden-Württemberg", () => {
    expect(kirchensteuersatzProzent("BAYERN")).toBe(8);
    expect(kirchensteuersatzProzent("BADEN_WUERTTEMBERG")).toBe(8);
  });

  it("ist 9% in allen anderen Bundesländern", () => {
    expect(kirchensteuersatzProzent("NORDRHEIN_WESTFALEN")).toBe(9);
    expect(kirchensteuersatzProzent("BERLIN")).toBe(9);
    expect(kirchensteuersatzProzent("SACHSEN")).toBe(9);
  });
});

describe("berechneKirchensteuer", () => {
  it("ist 0 ohne Kirchensteuerpflicht, unabhängig vom Bundesland", () => {
    expect(berechneKirchensteuer(10000, "BAYERN", false)).toBe(0);
    expect(berechneKirchensteuer(10000, "NORDRHEIN_WESTFALEN", false)).toBe(0);
  });

  it("berechnet 8% in Bayern bei Kirchensteuerpflicht", () => {
    expect(berechneKirchensteuer(10000, "BAYERN", true)).toBeCloseTo(800, 2);
  });

  it("berechnet 9% in Nordrhein-Westfalen bei Kirchensteuerpflicht", () => {
    expect(berechneKirchensteuer(10000, "NORDRHEIN_WESTFALEN", true)).toBeCloseTo(900, 2);
  });

  it("ist 0 bei einer Einkommensteuer von 0", () => {
    expect(berechneKirchensteuer(0, "NORDRHEIN_WESTFALEN", true)).toBe(0);
  });
});
