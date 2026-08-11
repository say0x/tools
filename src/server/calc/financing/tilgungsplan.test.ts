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
    expect(plan[2]).toEqual({ jahr: 3, restschuldStart: 0, zinszahlung: 0, tilgungszahlung: 0, restschuldEnde: 0, zinssatzProzent: 0 });
    expect(plan[4].restschuldEnde).toBe(0);
  });

  it("weist für jedes Jahr den Zinssatz aus, der ohne Anschlussfinanzierung konstant bleibt", () => {
    const plan = berechneTilgungsplan(200000, 4, 2, 5);
    expect(plan.map((j) => j.zinssatzProzent)).toEqual([4, 4, 4, 4, 4]);
  });

  describe("Anschlussfinanzierung nach Ablauf der Zinsbindung", () => {
    it("hebt den Zins ab dem Jahr nach Zinsbindungsende um den Aufschlag an und setzt die Annuität auf Basis der dann aktuellen Restschuld neu an", () => {
      const plan = berechneTilgungsplan(100000, 4, 2, 3, 1, 2);

      // Jahr 1 (innerhalb Zinsbindung): unverändert wie ohne Anschlussfinanzierung.
      expect(plan[0]).toEqual({ jahr: 1, restschuldStart: 100000, zinszahlung: 4000, tilgungszahlung: 2000, restschuldEnde: 98000, zinssatzProzent: 4 });

      // Jahr 2: Zinsbindung abgelaufen (zinsbindungJahre=1) -> neuer Zins 4+2=6%,
      // neue Annuität = 98000 * (6+2)/100 = 7840.
      expect(plan[1]).toEqual({ jahr: 2, restschuldStart: 98000, zinszahlung: 5880, tilgungszahlung: 1960, restschuldEnde: 96040, zinssatzProzent: 6 });

      // Jahr 3: bleibt beim neuen Zins/der neuen Annuität (nur EIN Zinssprung simuliert).
      expect(plan[2]).toEqual({ jahr: 3, restschuldStart: 96040, zinszahlung: 5762.4, tilgungszahlung: 2077.6, restschuldEnde: 93962.4, zinssatzProzent: 6 });
    });

    it("verändert bei Aufschlag 0 den Tilgungsplan nicht gegenüber einem durchgehenden Darlehen ohne Anschlussfinanzierung", () => {
      const mitZinsbindung = berechneTilgungsplan(100000, 4, 2, 5, 2, 0);
      const ohneZinsbindung = berechneTilgungsplan(100000, 4, 2, 5);
      expect(mitZinsbindung).toEqual(ohneZinsbindung);
    });

    it("simuliert nur einen einzigen Zinssprung, auch wenn die Zinsbindung mehrfach in den Horizont passen würde", () => {
      const plan = berechneTilgungsplan(100000, 4, 2, 4, 1, 2);
      // Jahre 2-4 bleiben alle beim einmalig gesetzten Anschlusszins von 6%.
      expect(plan.slice(1).every((j) => j.zinssatzProzent === 6)).toBe(true);
    });
  });
});
