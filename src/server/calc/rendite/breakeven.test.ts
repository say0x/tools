import { describe, expect, it } from "vitest";
import { berechneBreakevenKaufpreis } from "./breakeven";

describe("berechneBreakevenKaufpreis", () => {
  it("meldet erreichbar:true ohne Suche, wenn der aktuelle Kaufpreis das Ziel schon erfüllt", () => {
    const result = berechneBreakevenKaufpreis(100000, () => 500, 0);
    expect(result).toEqual({ erreichbar: true, breakevenKaufpreis: 100000, differenzZuAktuellemKaufpreis: 0 });
  });

  it("findet per Bisektion den Kaufpreis, an dem eine lineare Metrik die Zielschwelle kreuzt", () => {
    // evaluate(x) = 1000 - 0.01x -> Nullstelle bei x = 100000
    const evaluate = (kaufpreis: number) => 1000 - 0.01 * kaufpreis;
    const result = berechneBreakevenKaufpreis(150000, evaluate, 0);

    expect(result.erreichbar).toBe(true);
    expect(result.breakevenKaufpreis).toBeCloseTo(100000, 0);
    expect(result.differenzZuAktuellemKaufpreis).toBeCloseTo(50000, 0);
  });

  it("meldet erreichbar:false, wenn selbst ein Kaufpreis von 0 die Zielschwelle nicht erreicht", () => {
    const evaluate = () => -500; // konstant negativ, unabhängig vom Kaufpreis
    const result = berechneBreakevenKaufpreis(150000, evaluate, 0);

    expect(result).toEqual({ erreichbar: false, breakevenKaufpreis: null, differenzZuAktuellemKaufpreis: null });
  });
});
