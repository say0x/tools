import { describe, expect, it } from "vitest";
import {
  berechneHerzfrequenzzonen,
  formatDauer,
  geschwindigkeitKmh,
  gewichtFuerWiederholungen,
  maximalpulsTanaka,
  paceSekundenProKm,
  parseDauer,
  riegelPrognoseSekunden,
  schaetzeEinerMaximum,
} from "./sportrechner";

describe("Pace & Tempo", () => {
  it("10 km in 50:00 → 5:00 min/km und 12 km/h", () => {
    expect(formatDauer(paceSekundenProKm(10, 3000))).toBe("5:00");
    expect(geschwindigkeitKmh(10, 3000)).toBe(12);
  });

  it("Riegel: 10 km in 50:00 → Halbmarathon ≈ 1:50:19, Marathon ≈ 3:50:01", () => {
    expect(riegelPrognoseSekunden(10, 3000, 21.0975)).toBeCloseTo(6619.2, 1);
    expect(formatDauer(riegelPrognoseSekunden(10, 3000, 21.0975))).toBe("1:50:19");
    expect(formatDauer(riegelPrognoseSekunden(10, 3000, 42.195))).toBe("3:50:01");
  });

  it("ungültige Eingaben liefern 0 statt NaN/Infinity", () => {
    expect(paceSekundenProKm(0, 3000)).toBe(0);
    expect(geschwindigkeitKmh(10, 0)).toBe(0);
    expect(riegelPrognoseSekunden(0, 3000, 10)).toBe(0);
  });
});

describe("parseDauer / formatDauer", () => {
  it.each([
    ["1:30:00", 5400],
    ["45", 2700],
    ["4:30", 270],
    ["0:59", 59],
  ])("%s → %i s", (eingabe, sekunden) => {
    expect(parseDauer(eingabe)).toBe(sekunden);
  });

  it.each(["abc", "1:2:3:4", "", "1::2"])("%s ist ungültig", (eingabe) => {
    expect(parseDauer(eingabe)).toBeNull();
  });

  it("formatiert Stunden mit führenden Nullen bei Minuten", () => {
    expect(formatDauer(3661)).toBe("1:01:01");
  });
});

describe("Herzfrequenz", () => {
  it("Tanaka: 208 − 0,7 · 40 = 180", () => {
    expect(maximalpulsTanaka(40)).toBe(180);
  });

  it("Karvonen mit Ruhepuls 60, HFmax 180: Zone 2 = 132–144", () => {
    const zone2 = berechneHerzfrequenzzonen(180, 60)[1];
    expect([zone2.vonBpm, zone2.bisBpm]).toEqual([132, 144]);
  });

  it("ohne Ruhepuls: Prozent von HFmax", () => {
    const zone2 = berechneHerzfrequenzzonen(180, null)[1];
    expect([zone2.vonBpm, zone2.bisBpm]).toEqual([108, 126]);
  });
});

describe("1RM", () => {
  it("100 kg × 5: Epley 116,7, Brzycki 112,5", () => {
    const r = schaetzeEinerMaximum(100, 5);
    expect(r.epley).toBeCloseTo(116.667, 2);
    expect(r.brzycki).toBeCloseTo(112.5, 5);
    expect(r.mittelwert).toBeCloseTo(114.583, 2);
  });

  it("1 Wiederholung = Gewicht selbst; Brzycki ab 37 Wdh. undefiniert", () => {
    expect(schaetzeEinerMaximum(100, 1).mittelwert).toBe(100);
    expect(schaetzeEinerMaximum(50, 40).brzycki).toBeNull();
  });

  it("Rückrechnung Epley: 116,67 kg 1RM → 100 kg für 5 Wdh.", () => {
    expect(gewichtFuerWiederholungen(100 * (1 + 5 / 30), 5)).toBeCloseTo(100, 6);
  });
});
