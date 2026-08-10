import { describe, expect, it } from "vitest";
import { berechneEmpfohleneInstandhaltungsruecklage } from "./instandhaltungsruecklage";
import { referenceDataFixture } from "../__tests__/fixtures";

describe("berechneEmpfohleneInstandhaltungsruecklage", () => {
  it("wählt die Altersklasse aus Baujahr/Bezugsjahr und skaliert mit der Wohnfläche", () => {
    // Alter = 2024-2014 = 10 Jahre -> erste Altersklasse (0-21) -> 7.10 €/m²/Jahr
    const result = berechneEmpfohleneInstandhaltungsruecklage(2014, 100, 3, referenceDataFixture, 2024);

    expect(result.basisSatzProM2ProJahr).toBe(7.1);
    expect(result.risikoMultiplikator).toBe(1); // Score 3 = neutral
    expect(result.empfohleneRuecklageMonatlich).toBeCloseTo((7.1 * 100) / 12, 2);
  });

  it("erhöht die Rücklage bei schlechtem Gewerke-Risiko-Score", () => {
    const neutral = berechneEmpfohleneInstandhaltungsruecklage(2014, 100, 3, referenceDataFixture, 2024);
    const schlecht = berechneEmpfohleneInstandhaltungsruecklage(2014, 100, 6, referenceDataFixture, 2024);

    expect(schlecht.empfohleneRuecklageMonatlich).toBeGreaterThan(neutral.empfohleneRuecklageMonatlich);
  });

  it("nutzt die höchste Altersklasse für sehr alte Gebäude", () => {
    const result = berechneEmpfohleneInstandhaltungsruecklage(1900, 100, 3, referenceDataFixture, 2024);
    expect(result.basisSatzProM2ProJahr).toBe(11.5);
  });
});
