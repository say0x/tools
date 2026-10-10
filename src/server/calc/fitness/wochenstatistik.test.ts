import { describe, expect, it } from "vitest";
import { berechneZeitraumstatistik, letzteTage, type TagesWerte } from "./wochenstatistik";
import { heuteIso, istIsoDatum, tageImBereich } from "./datum";

const tag = (datum: string, kcal: number | null, budget = 2000, extra: Partial<TagesWerte> = {}): TagesWerte => ({
  datum,
  zugefuehrt: kcal == null ? null : { kcal, proteinG: 100, kohlenhydrateG: 0, fettG: 0 },
  budget,
  trainingMinuten: 0,
  trainingKcal: 0,
  trainingAnzahl: 0,
  aktivitaet: null,
  ...extra,
});

describe("berechneZeitraumstatistik", () => {
  it("mittelt nur über protokollierte Tage und zählt den Zielkorridor (±10 %)", () => {
    const s = berechneZeitraumstatistik([
      tag("2026-09-01", 2100),
      tag("2026-09-02", 1500),
      tag("2026-09-03", null),
      tag("2026-09-04", 1900, 2000, { trainingMinuten: 45, trainingKcal: 300, trainingAnzahl: 1, aktivitaet: { schritte: 8000, wasserMl: 2000, schlafStunden: 7, ruhepuls: 55 } }),
    ]);

    expect(s.tage).toBe(4);
    expect(s.tageMitErnaehrung).toBe(3);
    expect(s.tageImZielkorridor).toBe(2);
    expect(s.durchschnittKcal).toBeCloseTo(5500 / 3, 6);
    expect(s.bilanzKcal).toBe(100 - 500 - 100);
    expect(s.rechnerischeVeraenderungKg).toBeCloseTo(-500 / 7700, 6);
    expect(s.trainingMinuten).toBe(45);
    expect(s.durchschnittSchritte).toBe(8000);
  });

  it("liefert null-Durchschnitte ohne Daten", () => {
    const s = berechneZeitraumstatistik([tag("2026-09-01", null)]);
    expect(s.durchschnittKcal).toBeNull();
    expect(s.durchschnittSchritte).toBeNull();
    expect(s.bilanzKcal).toBe(0);
  });
});

describe("Datums-Helfer", () => {
  it("letzteTage liefert N aufsteigende Tage inkl. Monatswechsel", () => {
    expect(letzteTage("2026-10-02", 3)).toEqual(["2026-09-30", "2026-10-01", "2026-10-02"]);
  });

  it("tageImBereich ist inklusiv", () => {
    expect(tageImBereich("2026-02-27", "2026-03-01")).toEqual(["2026-02-27", "2026-02-28", "2026-03-01"]);
  });

  it("istIsoDatum lehnt ungültige Kalendertage ab", () => {
    expect(istIsoDatum("2026-02-28")).toBe(true);
    expect(istIsoDatum("2026-02-30")).toBe(false);
    expect(istIsoDatum("28.02.2026")).toBe(false);
  });

  it("heuteIso nutzt die deutsche Zeitzone (00:30 MESZ ist noch UTC-Vortag)", () => {
    expect(heuteIso("Europe/Berlin", new Date("2026-07-14T22:30:00.000Z"))).toBe("2026-07-15");
    expect(heuteIso("UTC", new Date("2026-07-14T22:30:00.000Z"))).toBe("2026-07-14");
  });
});
