import { describe, expect, it } from "vitest";
import { berechneAffordability } from "./check";
import { makeProfileFixture } from "../__tests__/fixtures";

describe("berechneAffordability", () => {
  it("ist GRUEN, wenn Quote und Reserve innerhalb der Schwellen liegen", () => {
    const result = berechneAffordability({
      profile: makeProfileFixture({ nettoEinkommenMonatlich: 4000, vorhandenesEigenkapital: 80000 }),
      neueFinanzierungsrateMonatlich: 1000,
      eigenkapitalEinsatzEuro: 17640,
      mieteinnahmenMonatlich: 0,
    });

    expect(result.schuldendienstquoteProzent).toBe(25);
    expect(result.liquiditaetsreserveNachKaufEuro).toBeCloseTo(62360, 2);
    expect(result.ampel).toBe("GRUEN");
  });

  it("ist ROT, wenn die Schuldendienstquote die Grenze überschreitet", () => {
    const result = berechneAffordability({
      profile: makeProfileFixture({ nettoEinkommenMonatlich: 2000, maxSchuldendienstquoteProzent: 35 }),
      neueFinanzierungsrateMonatlich: 1000,
      eigenkapitalEinsatzEuro: 0,
      mieteinnahmenMonatlich: 0,
    });

    expect(result.schuldendienstquoteProzent).toBe(50);
    expect(result.ampel).toBe("ROT");
  });

  it("ist ROT, wenn das Eigenkapital für den Einsatz nicht ausreicht", () => {
    const result = berechneAffordability({
      profile: makeProfileFixture({ vorhandenesEigenkapital: 10000 }),
      neueFinanzierungsrateMonatlich: 500,
      eigenkapitalEinsatzEuro: 20000,
      mieteinnahmenMonatlich: 0,
    });

    expect(result.liquiditaetsreserveNachKaufEuro).toBe(-10000);
    expect(result.ampel).toBe("ROT");
  });

  it("berücksichtigt bestehende Kredite in der Schuldendienstquote", () => {
    const result = berechneAffordability({
      profile: makeProfileFixture({
        nettoEinkommenMonatlich: 4000,
        liabilities: [{ bezeichnung: "Auto", monatlicheRate: 300, restschuld: 5000 }],
      }),
      neueFinanzierungsrateMonatlich: 700,
      eigenkapitalEinsatzEuro: 0,
      mieteinnahmenMonatlich: 0,
    });

    expect(result.schuldendienstquoteProzent).toBe(25); // (300+700)/4000
  });

  it("rechnet einen Anteil der Mieteinnahmen dem Netto-Einkommen hinzu (Kapitaldienstfähigkeit)", () => {
    const result = berechneAffordability({
      profile: makeProfileFixture({ nettoEinkommenMonatlich: 3000, mietanrechnungProzent: 80 }),
      neueFinanzierungsrateMonatlich: 1200,
      eigenkapitalEinsatzEuro: 0,
      mieteinnahmenMonatlich: 1000,
    });

    // Angerechnete Miete: 1000 * 80% = 800 -> effektives Einkommen 3800
    expect(result.angerechneteMieteMonatlich).toBe(800);
    expect(result.schuldendienstquoteProzent).toBeCloseTo(round2((1200 / 3800) * 100), 2);
    expect(result.begruendung.some((b) => b.includes("angerechnete Mieteinnahmen"))).toBe(true);
  });

  it("rechnet ohne Mietanrechnung (0%) keine Miete an", () => {
    const result = berechneAffordability({
      profile: makeProfileFixture({ nettoEinkommenMonatlich: 3000, mietanrechnungProzent: 0 }),
      neueFinanzierungsrateMonatlich: 1200,
      eigenkapitalEinsatzEuro: 0,
      mieteinnahmenMonatlich: 1000,
    });

    expect(result.angerechneteMieteMonatlich).toBe(0);
    expect(result.schuldendienstquoteProzent).toBe(40); // 1200/3000
  });
});

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
