import { describe, expect, it } from "vitest";
import { addiereTage } from "./datum";
import { berechneGewichtsverlauf, berechneTrendKgProTag, gewichtAmDatum, glaetteGewichte } from "./gewichtstrend";

const start = "2026-09-01";
const linear = (anzahl: number, startKg: number, proTag: number) =>
  Array.from({ length: anzahl }, (_, i) => ({ datum: addiereTage(start, i), gewichtKg: startKg + proTag * i }));

describe("glaetteGewichte", () => {
  it("mittelt über ein 7-Tage-Fenster (nur vorhandene Messungen)", () => {
    const punkte = glaetteGewichte([
      { datum: "2026-09-01", gewichtKg: 80 },
      { datum: "2026-09-03", gewichtKg: 82 },
      { datum: "2026-09-10", gewichtKg: 78 },
    ]);
    expect(punkte.map((p) => p.durchschnitt7)).toEqual([80, 81, 78]);
  });

  it("sortiert unsortierte Eingaben", () => {
    const punkte = glaetteGewichte([
      { datum: "2026-09-03", gewichtKg: 82 },
      { datum: "2026-09-01", gewichtKg: 80 },
    ]);
    expect(punkte[0].datum).toBe("2026-09-01");
  });
});

describe("berechneTrendKgProTag", () => {
  it("erkennt eine lineare Abnahme von 0,1 kg/Tag", () => {
    expect(berechneTrendKgProTag(linear(14, 80, -0.1), addiereTage(start, 13))).toBeCloseTo(-0.1, 6);
  });

  it("null bei weniger als 3 Messungen", () => {
    expect(berechneTrendKgProTag(linear(2, 80, -0.1), addiereTage(start, 1))).toBeNull();
  });

  it("null, wenn die Messungen weniger als 7 Tage abdecken", () => {
    expect(berechneTrendKgProTag(linear(5, 80, -0.1), addiereTage(start, 4))).toBeNull();
  });
});

describe("berechneGewichtsverlauf", () => {
  it("prognostiziert das Erreichen des Zielgewichts aus dem Trend", () => {
    const heute = addiereTage(start, 13);
    const v = berechneGewichtsverlauf(linear(14, 90, -0.25), 80, heute);

    expect(v.aktuellKg).toBeCloseTo(86.75, 6);
    expect(v.aktuellGeglaettetKg).toBeCloseTo(87.5, 6);
    expect(v.trendKgProWoche).toBeCloseTo(-1.75, 6);
    expect(v.veraenderung7TageKg).toBeCloseTo(-1.75, 6);
    expect(v.prognose.status).toBe("IN_RICHTUNG");
    expect(v.prognose.tage).toBeGreaterThanOrEqual(30);
    expect(v.prognose.tage).toBeLessThanOrEqual(31);
    expect(v.prognose.datum).toBe(addiereTage(heute, v.prognose.tage!));
  });

  it("FALSCHE_RICHTUNG, wenn das Gewicht vom Ziel weg läuft", () => {
    const v = berechneGewichtsverlauf(linear(14, 80, 0.1), 75, addiereTage(start, 13));
    expect(v.prognose.status).toBe("FALSCHE_RICHTUNG");
  });

  it("STAGNATION bei flachem Verlauf", () => {
    const v = berechneGewichtsverlauf(linear(14, 80, 0), 75, addiereTage(start, 13));
    expect(v.prognose.status).toBe("STAGNATION");
  });

  it("ERREICHT, wenn der geglättete Wert am Ziel liegt", () => {
    const v = berechneGewichtsverlauf(linear(14, 75, 0), 75.1, addiereTage(start, 13));
    expect(v.prognose.status).toBe("ERREICHT");
  });

  it("KEIN_ZIEL ohne Zielgewicht, ZU_WENIG_DATEN mit nur zwei Messungen", () => {
    expect(berechneGewichtsverlauf(linear(14, 80, -0.1), null, addiereTage(start, 13)).prognose.status).toBe("KEIN_ZIEL");
    expect(berechneGewichtsverlauf(linear(2, 80, -0.1), 70, addiereTage(start, 1)).prognose.status).toBe("ZU_WENIG_DATEN");
  });

  it("ignoriert Messungen nach dem Stichtag und kommt ohne Daten aus", () => {
    const v = berechneGewichtsverlauf(linear(14, 80, -0.1), 70, "2026-08-01");
    expect(v.aktuellKg).toBeNull();
    expect(v.punkte).toEqual([]);
  });
});

describe("gewichtAmDatum", () => {
  it("nimmt die letzte Messung am oder vor dem Datum", () => {
    const werte = [
      { datum: "2026-09-01", gewichtKg: 80 },
      { datum: "2026-09-05", gewichtKg: 79 },
    ];
    expect(gewichtAmDatum(werte, "2026-09-04")).toBe(80);
    expect(gewichtAmDatum(werte, "2026-09-05")).toBe(79);
    expect(gewichtAmDatum(werte, "2026-08-31")).toBeNull();
  });
});
