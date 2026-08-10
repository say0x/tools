import { describe, expect, it } from "vitest";
import { berechneTilgungsplan } from "./tilgungsplan";

describe("berechneTilgungsplan", () => {
  it("berechnet Jahr 1 eines Annuitätendarlehens korrekt", () => {
    const plan = berechneTilgungsplan(200000, 4, 2, 5);
    expect(plan[0].zinszahlung).toBe(8000);
    expect(plan[0].tilgungszahlung).toBe(4000);
    expect(plan[0].restschuldEnde).toBe(196000);
  });

  it("reduziert den Zinsanteil mit sinkender Restschuld über die Jahre", () => {
    const plan = berechneTilgungsplan(200000, 4, 2, 5);
    expect(plan[1].zinszahlung).toBeLessThan(plan[0].zinszahlung);
    expect(plan[1].tilgungszahlung).toBeGreaterThan(plan[0].tilgungszahlung);
  });

  it("füllt den Horizont nach vollständiger Tilgung mit Nullen auf, statt die Reihe abzubrechen", () => {
    const plan = berechneTilgungsplan(10000, 0, 50, 5);
    expect(plan).toHaveLength(5);
    expect(plan[1].restschuldEnde).toBe(0);
    expect(plan[2]).toEqual({ jahr: 3, restschuldStart: 0, zinszahlung: 0, tilgungszahlung: 0, restschuldEnde: 0 });
    expect(plan[4].restschuldEnde).toBe(0);
  });
});
