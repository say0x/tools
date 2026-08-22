import { describe, expect, it } from "vitest";
import { berechneExitSzenario } from "./exit-szenario";
import type { VermoegensverlaufJahr } from "../types";

function jahr(overrides: Partial<VermoegensverlaufJahr> & { jahr: number }): VermoegensverlaufJahr {
  return {
    restschuld: 0,
    immobilienwert: 0,
    eigenkapitalanteil: 0,
    immobilienwertReal: 0,
    eigenkapitalanteilReal: 0,
    cashflowVorSteuerJahr: 0,
    cashflowNachSteuerJahr: 0,
    kumulierterCashflowVorSteuer: 0,
    kumulierterCashflowNachSteuer: 0,
    ...overrides,
  };
}

describe("berechneExitSzenario", () => {
  it("gibt null zurück, wenn kein Verkauf geplant ist", () => {
    const result = berechneExitSzenario({
      geplant: false,
      haltedauerJahre: 10,
      vermoegensverlauf: [jahr({ jahr: 10, immobilienwert: 400000, restschuld: 100000 })],
      anschaffungskostenEuro: 300000,
      afaJaehrlich: 4000,
      grenzsteuersatzProzent: 42,
    });

    expect(result).toBeNull();
  });

  it("besteuert den Gewinn bei Verkauf innerhalb der Spekulationsfrist (< 10 Jahre)", () => {
    const vermoegensverlauf = Array.from({ length: 6 }, (_, i) =>
      jahr({ jahr: i + 1, immobilienwert: 300000 + i * 10000, restschuld: 250000 - i * 5000 })
    );

    const result = berechneExitSzenario({
      geplant: true,
      haltedauerJahre: 6,
      vermoegensverlauf,
      anschaffungskostenEuro: 300000,
      afaJaehrlich: 4000,
      grenzsteuersatzProzent: 42,
    });

    expect(result).not.toBeNull();
    expect(result?.verkaufspreisEuro).toBe(350000);
    expect(result?.restschuldEuro).toBe(225000);
    expect(result?.erloesVorSteuerEuro).toBe(125000);
    expect(result?.kumulierteAfaEuro).toBe(24000);
    expect(result?.spekulationssteuer.pflichtig).toBe(true);
    // Veräußerungsgewinn = Verkaufspreis - (Anschaffungskosten - kumulierte AfA) = 350000 - (300000 - 24000) = 74000
    expect(result?.spekulationssteuer.veraeusserungsgewinnEuro).toBe(74000);
    expect(result?.erloesNachSteuerEuro).toBeLessThan(result!.erloesVorSteuerEuro);
  });

  it("bleibt steuerfrei bei Verkauf nach Ablauf der Spekulationsfrist (>= 10 Jahre)", () => {
    const vermoegensverlauf = Array.from({ length: 10 }, (_, i) =>
      jahr({ jahr: i + 1, immobilienwert: 300000 + i * 10000, restschuld: 250000 - i * 5000 })
    );

    const result = berechneExitSzenario({
      geplant: true,
      haltedauerJahre: 10,
      vermoegensverlauf,
      anschaffungskostenEuro: 300000,
      afaJaehrlich: 4000,
      grenzsteuersatzProzent: 42,
    });

    expect(result?.spekulationssteuer.pflichtig).toBe(false);
    expect(result?.spekulationssteuer.steuerEuro).toBe(0);
    expect(result?.erloesNachSteuerEuro).toBe(result?.erloesVorSteuerEuro);
  });

  it("klemmt auf den letzten verfügbaren Verlaufseintrag, wenn die Haltedauer den Vermögensverlauf übersteigt", () => {
    const vermoegensverlauf = [jahr({ jahr: 1, immobilienwert: 310000, restschuld: 245000 })];

    const result = berechneExitSzenario({
      geplant: true,
      haltedauerJahre: 50,
      vermoegensverlauf,
      anschaffungskostenEuro: 300000,
      afaJaehrlich: 4000,
      grenzsteuersatzProzent: 42,
    });

    expect(result?.verkaufspreisEuro).toBe(310000);
  });
});
