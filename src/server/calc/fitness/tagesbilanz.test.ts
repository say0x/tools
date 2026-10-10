import { describe, expect, it } from "vitest";
import { berechneTagesbilanz, naehrwerteFuerMenge, summiereNaehrwerte } from "./tagesbilanz";

const makroziele = { proteinG: 150, fettG: 70, kohlenhydrateG: 200, kohlenhydrateAufNullBegrenzt: false };

describe("naehrwerteFuerMenge", () => {
  it("rechnet Werte je 100 g auf die Menge um", () => {
    const n = naehrwerteFuerMenge({ kcalPro100g: 370, proteinPro100g: 13.5, kohlenhydratePro100g: 58.7, fettPro100g: 7 }, 50);
    expect(n.kcal).toBeCloseTo(185, 5);
    expect(n.proteinG).toBeCloseTo(6.75, 5);
    expect(n.kohlenhydrateG).toBeCloseTo(29.35, 5);
    expect(n.fettG).toBeCloseTo(3.5, 5);
  });
});

describe("summiereNaehrwerte", () => {
  it("liefert Nullen für eine leere Liste", () => {
    expect(summiereNaehrwerte([])).toEqual({ kcal: 0, proteinG: 0, kohlenhydrateG: 0, fettG: 0 });
  });
});

describe("berechneTagesbilanz", () => {
  const mahlzeiten = [
    { mahlzeit: "FRUEHSTUECK" as const, kcal: 500, proteinG: 30, kohlenhydrateG: 60, fettG: 15 },
    { mahlzeit: "MITTAGESSEN" as const, kcal: 800, proteinG: 50, kohlenhydrateG: 80, fettG: 30 },
    { mahlzeit: "FRUEHSTUECK" as const, kcal: 100, proteinG: 0, kohlenhydrateG: 25, fettG: 0 },
  ];
  const trainings = [
    { sportart: "KRAFTTRAINING" as const, intensitaet: "MITTEL" as const, dauerMin: 60, distanzKm: null, kcalVerbrauch: null, kcalOverride: false },
  ];

  it("summiert Zufuhr, rechnet Training aufs Budget und zeigt Makro-Fortschritt", () => {
    const b = berechneTagesbilanz({ mahlzeiten, trainings, gewichtKg: 80, kalorienziel: 2000, makroziele, trainingskalorienAnrechnen: true });

    expect(b.zugefuehrt).toEqual({ kcal: 1400, proteinG: 80, kohlenhydrateG: 165, fettG: 45 });
    expect(b.proMahlzeit.FRUEHSTUECK.kcal).toBe(600);
    expect(b.proMahlzeit.ABENDESSEN.kcal).toBe(0);
    expect(b.trainingsverbrauchKcal).toBe(320);
    expect(b.budget).toBe(2320);
    expect(b.verbleibend).toBe(920);
    expect(b.ueberBudget).toBe(false);
    expect(b.budgetProzent).toBeCloseTo((1400 / 2320) * 100, 5);
    expect(b.makros.protein.prozent).toBeCloseTo((80 / 150) * 100, 5);
  });

  it("ohne Anrechnung bleibt das Budget beim Kalorienziel", () => {
    const b = berechneTagesbilanz({ mahlzeiten, trainings, gewichtKg: 80, kalorienziel: 1300, makroziele, trainingskalorienAnrechnen: false });
    expect(b.budget).toBe(1300);
    expect(b.verbleibend).toBe(-100);
    expect(b.ueberBudget).toBe(true);
  });

  it("Makro-Prozent ist null bei Ziel 0", () => {
    const b = berechneTagesbilanz({
      mahlzeiten,
      trainings: [],
      gewichtKg: 80,
      kalorienziel: 2000,
      makroziele: { ...makroziele, kohlenhydrateG: 0 },
      trainingskalorienAnrechnen: true,
    });
    expect(b.makros.kohlenhydrate.prozent).toBeNull();
  });
});
