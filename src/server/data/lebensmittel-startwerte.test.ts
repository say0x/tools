import { describe, expect, it } from "vitest";
import { LEBENSMITTEL_STARTWERTE } from "./lebensmittel-startwerte";

describe("LEBENSMITTEL_STARTWERTE", () => {
  it("hat eindeutige Bezeichnungen (Upsert-Schlüssel im Seed)", () => {
    const namen = LEBENSMITTEL_STARTWERTE.map((l) => l.bezeichnung);
    expect(new Set(namen).size).toBe(namen.length);
  });

  it("hat plausible, nicht-negative Werte", () => {
    for (const l of LEBENSMITTEL_STARTWERTE) {
      expect(l.kcalPro100g, l.bezeichnung).toBeGreaterThanOrEqual(0);
      expect(l.kcalPro100g, l.bezeichnung).toBeLessThanOrEqual(900);
      expect(l.proteinPro100g + l.kohlenhydratePro100g + l.fettPro100g, l.bezeichnung).toBeLessThanOrEqual(100);
      expect(l.standardPortionG, l.bezeichnung).toBeGreaterThan(0);
    }
  });

  // Fängt Tippfehler (z. B. vertauschte Spalten): Atwater-Faktoren 4/4/9 müssen
  // die angegebene Energie ungefähr ergeben. Toleranz großzügig, weil Ballaststoffe
  // (~2 kcal/g) und Rundung in den Tabellenwerten stecken.
  it("kcal passen zu den Makronährstoffen (Atwater ±15 % bzw. ±12 kcal)", () => {
    for (const l of LEBENSMITTEL_STARTWERTE) {
      if (l.enthaeltAlkohol) continue;
      const atwater = 4 * l.proteinPro100g + 4 * l.kohlenhydratePro100g + 9 * l.fettPro100g;
      const toleranz = Math.max(12, l.kcalPro100g * 0.15);
      expect(Math.abs(atwater - l.kcalPro100g), `${l.bezeichnung}: ${atwater} vs. ${l.kcalPro100g}`).toBeLessThanOrEqual(toleranz);
    }
  });
});
