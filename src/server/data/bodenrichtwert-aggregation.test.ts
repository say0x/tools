import { describe, expect, it } from "vitest";
import { aggregateToLagetyp } from "./bodenrichtwert-aggregation";

describe("aggregateToLagetyp", () => {
  it("mittelt Wohnbauland-Zonen pro Lagetyp", () => {
    const ergebnis = aggregateToLagetyp([
      { bodenrichtwertEuroProM2: 400, nutzungsart: "W", lagetyp: "GROSSSTADT" },
      { bodenrichtwertEuroProM2: 500, nutzungsart: "W", lagetyp: "GROSSSTADT" },
      { bodenrichtwertEuroProM2: 60, nutzungsart: "W", lagetyp: "LAENDLICH" },
    ]);

    expect(ergebnis).toEqual(
      expect.arrayContaining([
        { lagetyp: "GROSSSTADT", bodenrichtwertProM2: 450 },
        { lagetyp: "LAENDLICH", bodenrichtwertProM2: 60 },
      ])
    );
    expect(ergebnis).toHaveLength(2);
  });

  it("ignoriert Zonen, die kein Wohnbauland sind", () => {
    const ergebnis = aggregateToLagetyp([
      { bodenrichtwertEuroProM2: 400, nutzungsart: "W", lagetyp: "GROSSSTADT" },
      { bodenrichtwertEuroProM2: 9999, nutzungsart: "GE", lagetyp: "GROSSSTADT" },
    ]);

    expect(ergebnis).toEqual([{ lagetyp: "GROSSSTADT", bodenrichtwertProM2: 400 }]);
  });

  it("liefert eine leere Liste ohne Zonen", () => {
    expect(aggregateToLagetyp([])).toEqual([]);
  });

  it("rundet auf 2 Nachkommastellen", () => {
    const ergebnis = aggregateToLagetyp([
      { bodenrichtwertEuroProM2: 100, nutzungsart: "W", lagetyp: "LAENDLICH" },
      { bodenrichtwertEuroProM2: 101, nutzungsart: "W", lagetyp: "LAENDLICH" },
      { bodenrichtwertEuroProM2: 100, nutzungsart: "W", lagetyp: "LAENDLICH" },
    ]);

    expect(ergebnis).toEqual([{ lagetyp: "LAENDLICH", bodenrichtwertProM2: 100.33 }]);
  });
});
