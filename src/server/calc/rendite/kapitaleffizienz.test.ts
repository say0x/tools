import { describe, expect, it } from "vitest";
import { berechneKapitaleffizienz } from "./kapitaleffizienz";

describe("berechneKapitaleffizienz", () => {
  it("ist GRUEN und bewertet nicht separat, wenn die EK-Rendite null ist (kein EK-Einsatz)", () => {
    const result = berechneKapitaleffizienz({
      eigenkapitalrenditeProzent: null,
      eigenkapitalEinsatzEuro: 0,
      mindestEigenkapitalrenditeProzent: 4,
      eigenkapitalPruefungAbEuro: 5000,
    });

    expect(result.ampel).toBe("GRUEN");
    expect(result.begruendung[0]).toContain("nicht definiert");
  });

  it("ist GRUEN und bewertet nicht separat, wenn die EK-Rendite null ist, selbst bei Prüfschwelle 0", () => {
    const result = berechneKapitaleffizienz({
      eigenkapitalrenditeProzent: null,
      eigenkapitalEinsatzEuro: 0,
      mindestEigenkapitalrenditeProzent: 4,
      eigenkapitalPruefungAbEuro: 0,
    });

    expect(result.ampel).toBe("GRUEN");
    expect(result.begruendung[0]).toContain("nicht definiert");
  });

  it("ist GRUEN und bewertet nicht separat, wenn der EK-Einsatz unter der Prüfschwelle liegt", () => {
    const result = berechneKapitaleffizienz({
      eigenkapitalrenditeProzent: -50,
      eigenkapitalEinsatzEuro: 2000,
      mindestEigenkapitalrenditeProzent: 4,
      eigenkapitalPruefungAbEuro: 5000,
    });

    expect(result.ampel).toBe("GRUEN");
    expect(result.begruendung[0]).toContain("Prüfschwelle");
  });

  it("ist ROT bei negativer EK-Rendite oberhalb der Prüfschwelle", () => {
    const result = berechneKapitaleffizienz({
      eigenkapitalrenditeProzent: -1.2,
      eigenkapitalEinsatzEuro: 200000,
      mindestEigenkapitalrenditeProzent: 4,
      eigenkapitalPruefungAbEuro: 5000,
    });

    expect(result.ampel).toBe("ROT");
    expect(result.begruendung[0]).toContain("negativ");
  });

  it("ist GELB, wenn die EK-Rendite positiv, aber unter der Mindestschwelle liegt", () => {
    const result = berechneKapitaleffizienz({
      eigenkapitalrenditeProzent: 1.2,
      eigenkapitalEinsatzEuro: 200000,
      mindestEigenkapitalrenditeProzent: 4,
      eigenkapitalPruefungAbEuro: 5000,
    });

    expect(result.ampel).toBe("GELB");
  });

  it("ist GRUEN, wenn die EK-Rendite die Mindestschwelle erreicht oder übersteigt", () => {
    const result = berechneKapitaleffizienz({
      eigenkapitalrenditeProzent: 5,
      eigenkapitalEinsatzEuro: 50000,
      mindestEigenkapitalrenditeProzent: 4,
      eigenkapitalPruefungAbEuro: 5000,
    });

    expect(result.ampel).toBe("GRUEN");
  });

  it("wertet den EK-Einsatz exakt an der Prüfschwelle bereits als bewertungspflichtig", () => {
    const result = berechneKapitaleffizienz({
      eigenkapitalrenditeProzent: 1,
      eigenkapitalEinsatzEuro: 5000,
      mindestEigenkapitalrenditeProzent: 4,
      eigenkapitalPruefungAbEuro: 5000,
    });

    expect(result.ampel).toBe("GELB");
  });
});
