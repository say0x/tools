import { describe, expect, it } from "vitest";
import { berechneAffordability } from "./check";
import { makeProfileFixture } from "../__tests__/fixtures";

describe("berechneAffordability", () => {
  it("ist GRUEN, wenn Quote und Reserve innerhalb der Schwellen liegen", () => {
    const result = berechneAffordability({
      profile: makeProfileFixture({ nettoEinkommenMonatlich: 4000, vorhandenesEigenkapital: 80000 }),
      neueFinanzierungsrateMonatlich: 1000,
      eigenkapitalEinsatzEuro: 17640,
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
    });

    expect(result.schuldendienstquoteProzent).toBe(50);
    expect(result.ampel).toBe("ROT");
  });

  it("ist ROT, wenn das Eigenkapital für den Einsatz nicht ausreicht", () => {
    const result = berechneAffordability({
      profile: makeProfileFixture({ vorhandenesEigenkapital: 10000 }),
      neueFinanzierungsrateMonatlich: 500,
      eigenkapitalEinsatzEuro: 20000,
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
    });

    expect(result.schuldendienstquoteProzent).toBe(25); // (300+700)/4000
  });
});
