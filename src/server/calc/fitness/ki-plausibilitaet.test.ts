import { describe, expect, it } from "vitest";
import { pruefeKiAnalyse, skalierePosition } from "./ki-plausibilitaet";

const basis = { erkannt: true, beschreibung: "", konfidenz: "HOCH" as const, hinweise: "" };

describe("pruefeKiAnalyse", () => {
  it("rundet, entfernt leere Positionen und summiert", () => {
    const r = pruefeKiAnalyse({
      ...basis,
      positionen: [
        { bezeichnung: " Reis ", mengeG: 180.4, kcal: 234.6, proteinG: 4.86, kohlenhydrateG: 50.4, fettG: 0.54 },
        { bezeichnung: "  ", mengeG: 10, kcal: 10, proteinG: 0, kohlenhydrateG: 0, fettG: 0 },
      ],
    });
    expect(r.positionen).toEqual([{ bezeichnung: "Reis", mengeG: 180, kcal: 235, proteinG: 4.9, kohlenhydrateG: 50.4, fettG: 0.5 }]);
    expect(r.summe.kcal).toBe(235);
  });

  it("Summe hat keine Gleitkomma-Reste (2,3 + 7,5 + 4,3 = 14,1)", () => {
    const pos = (fettG: number) => ({ bezeichnung: "x", mengeG: 10, kcal: 9 * fettG, proteinG: 0, kohlenhydrateG: 0, fettG });
    const r = pruefeKiAnalyse({ ...basis, positionen: [pos(2.3), pos(7.5), pos(4.3)] });
    expect(2.3 + 7.5 + 4.3).not.toBe(14.1);
    expect(r.summe.fettG).toBe(14.1);
  });

  it("markiert Positionen, deren kcal nicht zu den Makros passen", () => {
    const r = pruefeKiAnalyse({
      ...basis,
      positionen: [{ bezeichnung: "Pizza", mengeG: 300, kcal: 1500, proteinG: 30, kohlenhydrateG: 90, fettG: 20 }],
    });
    expect(r.inkonsistentePositionen).toEqual(["Pizza"]);
  });

  it("negative oder ungültige Werte werden zu 0", () => {
    const r = pruefeKiAnalyse({ ...basis, positionen: [{ bezeichnung: "x", mengeG: -5, kcal: Number.NaN, proteinG: -1, kohlenhydrateG: 0, fettG: 0 }] });
    expect(r.positionen[0]).toMatchObject({ mengeG: 0, kcal: 0, proteinG: 0 });
  });

  it("ohne Positionen gilt nichts als erkannt", () => {
    expect(pruefeKiAnalyse({ ...basis, positionen: [] }).erkannt).toBe(false);
  });
});

describe("skalierePosition", () => {
  it("skaliert Nährwerte proportional zur neuen Menge", () => {
    const p = skalierePosition({ bezeichnung: "Nudeln", mengeG: 200, kcal: 300, proteinG: 11, kohlenhydrateG: 60, fettG: 1.8 }, 300);
    expect(p).toEqual({ bezeichnung: "Nudeln", mengeG: 300, kcal: 450, proteinG: 16.5, kohlenhydrateG: 90, fettG: 2.7 });
  });

  it("bei Ausgangsmenge 0 wird nur die Menge gesetzt", () => {
    expect(skalierePosition({ bezeichnung: "x", mengeG: 0, kcal: 50, proteinG: 0, kohlenhydrateG: 0, fettG: 0 }, 100).kcal).toBe(50);
  });
});
