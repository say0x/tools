import { describe, expect, it } from "vitest";
import { berechneSolidaritaetszuschlag } from "./soli";

describe("berechneSolidaritaetszuschlag", () => {
  it("ist 0 bis zur Freigrenze (2025: 19.950 €)", () => {
    expect(berechneSolidaritaetszuschlag(19950, 2025)).toBe(0);
    expect(berechneSolidaritaetszuschlag(10000, 2025)).toBe(0);
    expect(berechneSolidaritaetszuschlag(0, 2025)).toBe(0);
  });

  it("greift in der Milderungszone nur teilweise, nicht sprunghaft mit den vollen 5,5%", () => {
    const ergebnis = berechneSolidaritaetszuschlag(20000, 2025);
    expect(ergebnis).toBeGreaterThan(0);
    expect(ergebnis).toBeLessThan(20000 * 0.055);
    expect(ergebnis).toBeCloseTo(0.119 * (20000 - 19950), 2);
  });

  it("ist bei hohem Einkommen exakt 5,5% der Einkommensteuer gedeckelt", () => {
    expect(berechneSolidaritaetszuschlag(100000, 2025)).toBeCloseTo(100000 * 0.055, 2);
  });

  it("steigt streng monoton mit der Einkommensteuer", () => {
    const werte = [0, 15000, 19950, 20000, 25000, 50000, 200000].map((est) => berechneSolidaritaetszuschlag(est, 2025));
    for (let i = 1; i < werte.length; i++) {
      expect(werte[i]).toBeGreaterThanOrEqual(werte[i - 1]);
    }
  });

  it("fällt für unbekannte Steuerjahre auf das jüngste bekannte Jahr zurück, statt zu crashen", () => {
    expect(() => berechneSolidaritaetszuschlag(50000, 2040)).not.toThrow();
  });
});
