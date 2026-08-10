import { describe, expect, it } from "vitest";
import { berechneEinkommensteuer, berechneGrenzsteuersatz } from "./grenzsteuersatz";

describe("berechneEinkommensteuer", () => {
  it("ist 0 bis zum Grundfreibetrag", () => {
    expect(berechneEinkommensteuer(12096, 2025)).toBe(0);
    expect(berechneEinkommensteuer(0, 2025)).toBe(0);
  });

  it("ist positiv knapp über dem Grundfreibetrag", () => {
    expect(berechneEinkommensteuer(13000, 2025)).toBeGreaterThan(0);
  });

  it("steigt streng monoton mit dem Einkommen", () => {
    const werte = [15000, 30000, 50000, 80000, 150000, 300000].map((zvE) =>
      berechneEinkommensteuer(zvE, 2025)
    );
    for (let i = 1; i < werte.length; i++) {
      expect(werte[i]).toBeGreaterThan(werte[i - 1]);
    }
  });
});

describe("berechneGrenzsteuersatz", () => {
  it("ist 0% am/unter dem Grundfreibetrag", () => {
    expect(berechneGrenzsteuersatz(10000, 2025)).toBe(0);
  });

  it("liegt in der zweiten Proportionalzone (>68.480€, 2025) exakt bei 42%", () => {
    expect(berechneGrenzsteuersatz(100000, 2025)).toBeCloseTo(42, 1);
  });

  it("liegt oberhalb der Reichensteuer-Schwelle (>277.825€) exakt bei 45%", () => {
    expect(berechneGrenzsteuersatz(500000, 2025)).toBeCloseTo(45, 1);
  });

  it("fällt für unbekannte Steuerjahre auf das jüngste bekannte Jahr zurück, statt zu crashen", () => {
    expect(() => berechneGrenzsteuersatz(65000, 2030)).not.toThrow();
  });
});
