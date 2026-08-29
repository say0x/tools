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
    expect(plan[2]).toEqual({ jahr: 3, restschuldStart: 0, zinszahlung: 0, tilgungszahlung: 0, restschuldEnde: 0, zinssatzProzent: 0, sondertilgungBetrag: 0 });
    expect(plan[4].restschuldEnde).toBe(0);
  });

  it("weist für jedes Jahr den Zinssatz aus, der ohne Anschlussfinanzierung konstant bleibt", () => {
    const plan = berechneTilgungsplan(200000, 4, 2, 5);
    expect(plan.map((j) => j.zinssatzProzent)).toEqual([4, 4, 4, 4, 4]);
  });

  describe("Anschlussfinanzierung nach Ablauf der Zinsbindung", () => {
    it("hebt den Zins ab dem Jahr nach Zinsbindungsende um den Aufschlag an und setzt die Annuität auf Basis der dann aktuellen Restschuld neu an", () => {
      const plan = berechneTilgungsplan(100000, 4, 2, 2, 1, 2);

      // Jahr 1 (innerhalb Zinsbindung): unverändert wie ohne Anschlussfinanzierung.
      expect(plan[0]).toEqual({ jahr: 1, restschuldStart: 100000, zinszahlung: 4000, tilgungszahlung: 2000, restschuldEnde: 98000, zinssatzProzent: 4, sondertilgungBetrag: 0 });

      // Jahr 2: Zinsbindung abgelaufen (zinsbindungJahre=1) -> neuer Zins 4+2=6%,
      // neue Annuität = 98000 * (6+2)/100 = 7840.
      expect(plan[1]).toEqual({ jahr: 2, restschuldStart: 98000, zinszahlung: 5880, tilgungszahlung: 1960, restschuldEnde: 96040, zinssatzProzent: 6, sondertilgungBetrag: 0 });
    });

    it("verändert bei Aufschlag 0 den Tilgungsplan nicht gegenüber einem durchgehenden Darlehen ohne Anschlussfinanzierung", () => {
      const mitZinsbindung = berechneTilgungsplan(100000, 4, 2, 5, 2, 0);
      const ohneZinsbindung = berechneTilgungsplan(100000, 4, 2, 5);
      expect(mitZinsbindung).toEqual(ohneZinsbindung);
    });

    it("simuliert bei mehrfachem Zinsbindungsablauf innerhalb des Betrachtungszeitraums mehrere aufeinanderfolgende Zinssprünge (kumulativer Aufschlag)", () => {
      // Zinsbindung nur 1 Jahr -> jedes Jahr ab Jahr 2 ein neuer Sprung um +2 Punkte
      // gegenüber dem zuletzt gültigen Zins: 4 -> 6 -> 8 -> 10.
      const plan = berechneTilgungsplan(100000, 4, 2, 4, 1, 2);
      expect(plan.map((j) => j.zinssatzProzent)).toEqual([4, 6, 8, 10]);
    });

    it("löst eine Anschlussfinanzierung nur bei tatsächlichem Ablauf der (mehrjährigen) Zinsbindung aus, nicht in jedem Jahr dazwischen", () => {
      // Zinsbindung 2 Jahre -> Sprünge erst nach Jahr 2 und nach Jahr 4, nicht dazwischen.
      const plan = berechneTilgungsplan(100000, 4, 2, 6, 2, 1);
      expect(plan.map((j) => j.zinssatzProzent)).toEqual([4, 4, 5, 5, 6, 6]);
    });

    it("löst innerhalb der ersten Zinsbindung noch keine Anschlussfinanzierung aus, wenn der Horizont die zweite Zinsbindungsperiode nicht mehr erreicht", () => {
      const plan = berechneTilgungsplan(100000, 4, 2, 3, 5, 2);
      expect(plan.map((j) => j.zinssatzProzent)).toEqual([4, 4, 4]);
    });
  });

  describe("Sondertilgung", () => {
    it("tilgt zusätzlich zur regulären Annuität einen festen Anteil der ursprünglichen Darlehenssumme pro Jahr", () => {
      // Sondertilgung 5% von 100000 = 5000/Jahr, zusätzlich zur regulären Tilgung.
      const plan = berechneTilgungsplan(100000, 4, 2, 3, Infinity, 0, 5, 5);

      expect(plan[0].tilgungszahlung).toBe(2000); // reguläre Tilgung unverändert
      expect(plan[0].sondertilgungBetrag).toBe(5000);
      expect(plan[0].restschuldEnde).toBe(93000); // 100000 - 2000 (regulär) - 5000 (Sondertilgung)
    });

    it("reduziert die Restschuld schneller als ohne Sondertilgung und verkürzt die Laufzeit bis zur Volltilgung", () => {
      const ohneSondertilgung = berechneTilgungsplan(100000, 4, 2, 50);
      const mitSondertilgung = berechneTilgungsplan(100000, 4, 2, 50, Infinity, 0, 5, 5);

      const volltilgungOhne = ohneSondertilgung.findIndex((j) => j.restschuldEnde <= 0.01 && j.restschuldStart > 0.01);
      const volltilgungMit = mitSondertilgung.findIndex((j) => j.restschuldEnde <= 0.01 && j.restschuldStart > 0.01);

      expect(volltilgungMit).toBeLessThan(volltilgungOhne);
    });

    it("lässt tilgungszahlung unverändert (Sondertilgung fließt nicht in die reguläre Tilgung/Cashflow-Basis ein)", () => {
      const ohneSondertilgung = berechneTilgungsplan(100000, 4, 2, 3);
      const mitSondertilgung = berechneTilgungsplan(100000, 4, 2, 3, Infinity, 0, 5, 5);
      expect(mitSondertilgung[0].tilgungszahlung).toBe(ohneSondertilgung[0].tilgungszahlung);
      expect(mitSondertilgung[0].zinszahlung).toBe(ohneSondertilgung[0].zinszahlung);
    });

    it("deckelt die Sondertilgung defensiv auf sondertilgungMaxProzent, auch wenn sondertilgungProzent darüber liegt", () => {
      const gedeckelt = berechneTilgungsplan(100000, 4, 2, 3, Infinity, 0, 20, 5);
      const erwartet = berechneTilgungsplan(100000, 4, 2, 3, Infinity, 0, 5, 5);
      expect(gedeckelt).toEqual(erwartet);
    });

    it("kappt die Sondertilgung im letzten Jahr auf die verbleibende Restschuld, statt ins Negative zu tilgen", () => {
      // Kleines Darlehen, hohe Sondertilgung -> Restschuld ist nach Jahr 1 bereits deutlich unter dem Sondertilgungsbetrag.
      const plan = berechneTilgungsplan(10000, 4, 2, 5, Infinity, 0, 50, 50);
      expect(plan.every((j) => j.restschuldEnde >= 0)).toBe(true);
      expect(plan.find((j) => j.restschuldEnde <= 0.01)).toBeDefined();
    });

    it("bleibt bei sondertilgungProzent 0 (Default) identisch zum Tilgungsplan ohne Sondertilgung", () => {
      const ohne = berechneTilgungsplan(100000, 4, 2, 10);
      const mitNull = berechneTilgungsplan(100000, 4, 2, 10, Infinity, 0, 0, 5);
      expect(mitNull).toEqual(ohne);
    });
  });
});
