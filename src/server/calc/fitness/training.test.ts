import { describe, expect, it } from "vitest";
import { effektiverTrainingsverbrauch, schaetzeTrainingsverbrauch } from "./training";

describe("schaetzeTrainingsverbrauch", () => {
  it("MET-Methode netto: (5 − 1) · 80 kg · 1 h = 320 kcal (Krafttraining mittel)", () => {
    const v = schaetzeTrainingsverbrauch({ sportart: "KRAFTTRAINING", intensitaet: "MITTEL", dauerMin: 60, distanzKm: null }, 80);
    expect(v).toEqual({ kcal: 320, methode: "MET", met: 5 });
  });

  it("Laufen mit Distanz: 1 kcal/kg/km brutto minus Ruheanteil", () => {
    const v = schaetzeTrainingsverbrauch({ sportart: "LAUFEN", intensitaet: "MITTEL", dauerMin: 60, distanzKm: 10 }, 70);
    expect(v.methode).toBe("LAUFDISTANZ");
    expect(v.kcal).toBe(630);
  });

  it("Laufen ohne Distanz fällt auf MET zurück", () => {
    const v = schaetzeTrainingsverbrauch({ sportart: "LAUFEN", intensitaet: "LEICHT", dauerMin: 30, distanzKm: null }, 70);
    expect(v.methode).toBe("MET");
    expect(v.kcal).toBe(Math.round(6 * 70 * 0.5));
  });

  it("Radfahren mit 30 km/h → MET 12", () => {
    const v = schaetzeTrainingsverbrauch({ sportart: "RADFAHREN", intensitaet: "LEICHT", dauerMin: 60, distanzKm: 30 }, 75);
    expect(v).toEqual({ kcal: 825, methode: "RADTEMPO", met: 12 });
  });

  it("Radfahren gemütlich (15 km/h) → MET 4", () => {
    const v = schaetzeTrainingsverbrauch({ sportart: "RADFAHREN", intensitaet: "HOCH", dauerMin: 60, distanzKm: 15 }, 75);
    expect(v.met).toBe(4);
    expect(v.kcal).toBe(225);
  });

  it("0 Minuten → 0 kcal", () => {
    expect(schaetzeTrainingsverbrauch({ sportart: "YOGA", intensitaet: "MITTEL", dauerMin: 0, distanzKm: null }, 70).kcal).toBe(0);
  });
});

describe("effektiverTrainingsverbrauch", () => {
  const basis = { sportart: "SCHWIMMEN" as const, intensitaet: "MITTEL" as const, dauerMin: 45, distanzKm: null };

  it("Override mit Wert gewinnt", () => {
    expect(effektiverTrainingsverbrauch({ ...basis, kcalOverride: true, kcalVerbrauch: 500 }, 80)).toEqual({
      kcal: 500,
      methode: "MANUELL",
      met: null,
    });
  });

  it("Override ohne Wert → Schätzung", () => {
    expect(effektiverTrainingsverbrauch({ ...basis, kcalOverride: true, kcalVerbrauch: null }, 80).methode).toBe("MET");
  });

  it("gespeicherter Wert ohne Override wird ignoriert (Gewicht könnte sich geändert haben)", () => {
    const v = effektiverTrainingsverbrauch({ ...basis, kcalOverride: false, kcalVerbrauch: 999 }, 80);
    expect(v.kcal).toBe(Math.round(6 * 80 * 0.75));
  });
});
