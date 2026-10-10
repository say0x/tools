import { describe, expect, it } from "vitest";
import {
  eigenesLebensmittelSchema,
  fitnessProfilSchema,
  gewichtSchema,
  mahlzeitSchema,
  tagesAktivitaetSchema,
  trainingSchema,
  wasserHinzufuegenSchema,
} from "./fitness-schema";

const gueltigesProfil = {
  groesseCm: 180,
  geburtsjahr: 1990,
  geschlecht: "MAENNLICH",
  aktivitaetslevel: "LEICHT",
  ziel: "ABNEHMEN",
  zielTempoKgProWoche: 0.5,
  zielGewichtKg: 75,
  kalorienzielKcal: null,
  kalorienzielOverride: false,
  proteinGProKg: 1.8,
  fettAnteilProzent: 30,
  wasserZielMl: null,
  schritteZiel: 10000,
  trainingskalorienAnrechnen: true,
  aktuellesGewichtKg: 82,
};

describe("fitnessProfilSchema", () => {
  it("akzeptiert ein vollständiges Profil", () => {
    expect(fitnessProfilSchema.safeParse(gueltigesProfil).success).toBe(true);
  });

  it.each([
    ["groesseCm", 90],
    ["zielTempoKgProWoche", 1.5],
    ["fettAnteilProzent", 60],
    ["kalorienzielKcal", 500],
    ["geschlecht", "DIVERS"],
  ])("lehnt %s = %s ab", (feld, wert) => {
    expect(fitnessProfilSchema.safeParse({ ...gueltigesProfil, [feld]: wert }).success).toBe(false);
  });
});

describe("gewichtSchema", () => {
  it("setzt Defaults für optionale Felder", () => {
    const r = gewichtSchema.parse({ datum: "2026-10-01", gewichtKg: 80.4 });
    expect(r).toEqual({ datum: "2026-10-01", gewichtKg: 80.4, koerperfettProzent: null, notiz: "" });
  });

  it("lehnt ungültige Kalendertage ab", () => {
    expect(gewichtSchema.safeParse({ datum: "2026-02-30", gewichtKg: 80 }).success).toBe(false);
  });
});

describe("mahlzeitSchema", () => {
  it("füllt Makros, Quelle und Konfidenz mit Defaults", () => {
    const r = mahlzeitSchema.parse({ datum: "2026-10-01", mahlzeit: "SNACK", bezeichnung: "Apfel", kcal: 80 });
    expect(r).toMatchObject({ proteinG: 0, kohlenhydrateG: 0, fettG: 0, mengeG: null, quelle: "MANUELL", kiKonfidenz: null });
  });

  it("trimmt die Bezeichnung und lehnt leere ab", () => {
    expect(mahlzeitSchema.safeParse({ datum: "2026-10-01", mahlzeit: "SNACK", bezeichnung: "   ", kcal: 80 }).success).toBe(false);
  });

  it("lehnt negative Kalorien ab", () => {
    expect(mahlzeitSchema.safeParse({ datum: "2026-10-01", mahlzeit: "SNACK", bezeichnung: "x", kcal: -1 }).success).toBe(false);
  });
});

describe("trainingSchema", () => {
  it("Defaults: Intensität MITTEL, kein Override", () => {
    const r = trainingSchema.parse({ datum: "2026-10-01", sportart: "LAUFEN", dauerMin: 30 });
    expect(r).toMatchObject({ intensitaet: "MITTEL", kcalOverride: false, kcalVerbrauch: null, distanzKm: null });
  });

  it("verlangt ganze Minuten ≥ 1", () => {
    expect(trainingSchema.safeParse({ datum: "2026-10-01", sportart: "LAUFEN", dauerMin: 0 }).success).toBe(false);
    expect(trainingSchema.safeParse({ datum: "2026-10-01", sportart: "LAUFEN", dauerMin: 12.5 }).success).toBe(false);
  });
});

describe("tagesAktivitaetSchema (Teil-Update)", () => {
  it("lässt nicht gesendete Felder undefined (= unverändert) und null als Löschen zu", () => {
    const r = tagesAktivitaetSchema.parse({ datum: "2026-10-01", schritte: 8123, wasserMl: null });
    expect(r.schritte).toBe(8123);
    expect(r.wasserMl).toBeNull();
    expect("schlafStunden" in r ? r.schlafStunden : undefined).toBeUndefined();
  });
});

describe("wasserHinzufuegenSchema", () => {
  it("erlaubt Korrekturen nach unten, aber keine absurden Mengen", () => {
    expect(wasserHinzufuegenSchema.safeParse({ datum: "2026-10-01", ml: -250 }).success).toBe(true);
    expect(wasserHinzufuegenSchema.safeParse({ datum: "2026-10-01", ml: 10_000 }).success).toBe(false);
  });
});

describe("eigenesLebensmittelSchema", () => {
  it("lehnt Makros über 100 g je 100 g ab", () => {
    expect(
      eigenesLebensmittelSchema.safeParse({ bezeichnung: "x", kcalPro100g: 100, proteinPro100g: 120, kohlenhydratePro100g: 0, fettPro100g: 0, standardPortionG: 100 }).success
    ).toBe(false);
  });
});
