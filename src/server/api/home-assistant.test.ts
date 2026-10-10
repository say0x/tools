import { describe, expect, it } from "vitest";
import { berechneEnergiebedarf } from "@/server/calc/fitness/energiebedarf";
import { berechneGewichtsverlauf } from "@/server/calc/fitness/gewichtstrend";
import { berechneTagesbilanz, summiereNaehrwerte } from "@/server/calc/fitness/tagesbilanz";
import { effektiverTrainingsverbrauch } from "@/server/calc/fitness/training";
import { berechneZeitraumstatistik } from "@/server/calc/fitness/wochenstatistik";
import type { FitnessProfilInput } from "@/server/calc/fitness/types";
import type { FitnessTag, MahlzeitZeile, TrainingZeile } from "@/server/data/fitness";
import type { DashboardKennzahlen } from "@/server/data/dashboard-kennzahlen";
import { baueHomeAssistantSensoren } from "./home-assistant";
import { fitnessTagDto } from "./dto";
import { erzeugeOpenApiSpezifikation } from "./openapi";

const profil: FitnessProfilInput = {
  groesseCm: 180,
  geburtsjahr: 1991,
  geschlecht: "MAENNLICH",
  aktivitaetslevel: "LEICHT",
  ziel: "ABNEHMEN",
  zielTempoKgProWoche: 0.5,
  zielGewichtKg: 78,
  kalorienzielKcal: null,
  kalorienzielOverride: false,
  proteinGProKg: 1.8,
  fettAnteilProzent: 30,
  wasserZielMl: null,
  schritteZiel: 10000,
  trainingskalorienAnrechnen: true,
};

const mahlzeit: MahlzeitZeile = {
  id: "m1",
  datum: "2026-10-10",
  mahlzeit: "FRUEHSTUECK",
  bezeichnung: "Haferflocken",
  mengeG: 60,
  kcal: 222,
  proteinG: 8.1,
  kohlenhydrateG: 35.22,
  fettG: 4.2,
  quelle: "LEBENSMITTEL_DB",
  kiKonfidenz: null,
  createdAt: "2026-10-10T06:00:00.000Z",
};

const trainingInput = { sportart: "LAUFEN" as const, intensitaet: "MITTEL" as const, dauerMin: 40, distanzKm: 7.5, kcalVerbrauch: null, kcalOverride: false };
const training: TrainingZeile = {
  ...trainingInput,
  id: "t1",
  datum: "2026-10-10",
  durchschnittsPuls: 150,
  notiz: "",
  quelle: "MANUELL",
  verbrauch: effektiverTrainingsverbrauch(trainingInput, 82.5),
};

function tag(mitProfil: boolean): FitnessTag {
  const energiebedarf = mitProfil ? berechneEnergiebedarf(profil, 82.5, 2026) : null;
  return {
    datum: "2026-10-10",
    profil: mitProfil ? profil : null,
    gewichtKg: mitProfil ? 82.5 : null,
    energiebedarf,
    bilanz: energiebedarf
      ? berechneTagesbilanz({
          mahlzeiten: [mahlzeit],
          trainings: [training],
          gewichtKg: 82.5,
          kalorienziel: energiebedarf.kalorienziel,
          makroziele: energiebedarf.makros,
          trainingskalorienAnrechnen: true,
        })
      : null,
    zugefuehrt: summiereNaehrwerte([mahlzeit]),
    mahlzeiten: [mahlzeit],
    trainings: [training],
    aktivitaet: { schritte: 8432, wasserMl: 750, schlafStunden: 7.5, ruhepuls: 54 },
    wasserZielMl: energiebedarf?.wasserZielMl ?? null,
    schritteZiel: mitProfil ? 10000 : null,
  };
}

const finanzen = {
  objekteGesamt: 27,
  objekteImBesitz: 2,
  monatlicherImmobilienCashflow: -596.456,
  ampelVerteilung: { GRUEN: 0, GELB: 2, ROT: 0 },
  durchschnittlicheBruttorendite: 5.04,
  sparvermoegen: 47000,
  sparpositionenImBesitz: 2,
  groessteSparposition: { name: "ETF-Depot", betrag: 35000 },
  tagesgeldImBesitz: 12000,
  fixkostenMonatlich: 2100,
  notgroschenMonate: 12000 / 2100,
  keinProfilHinterlegt: false,
  immobilienEigenkapitalReferenz: 0,
  gesamtvermoegenReferenz: 47000,
  gesamtSchuldenRestschuld: 8000,
  gesamtvermoegenNetto: 39000,
  szenarienAnzahl: 0,
  nochKeineDaten: false,
  objekteMitErgebnis: [],
} satisfies DashboardKennzahlen;

const woche = {
  tage: [],
  statistik: berechneZeitraumstatistik([
    { datum: "2026-10-10", zugefuehrt: summiereNaehrwerte([mahlzeit]), budget: 2684, trainingMinuten: 40, trainingKcal: 564, trainingAnzahl: 1, aktivitaet: null },
  ]),
};

const gewichte = [
  { datum: "2026-09-26", gewichtKg: 84 },
  { datum: "2026-09-30", gewichtKg: 83.6 },
  { datum: "2026-10-04", gewichtKg: 83.1 },
  { datum: "2026-10-07", gewichtKg: 82.9 },
  { datum: "2026-10-10", gewichtKg: 82.5 },
];

describe("baueHomeAssistantSensoren", () => {
  it("liefert gerundete Fitness- und Finanzwerte in snake_case", () => {
    const s = baueHomeAssistantSensoren({
      zeitpunkt: new Date("2026-10-10T08:00:00Z"),
      tag: tag(true),
      woche,
      gewicht: berechneGewichtsverlauf(gewichte, 78, "2026-10-10"),
      finanzen,
    });

    expect(s.datum).toBe("2026-10-10");
    expect(s.fitness).toMatchObject({
      kalorien_ziel: 2120,
      kalorien_gegessen: 222,
      kalorien_training: 564,
      kalorien_budget: 2684,
      kalorien_verbleibend: 2462,
      ueber_budget: false,
      protein_g: 8.1,
      kohlenhydrate_g: 35.2,
      wasser_ml: 750,
      schritte: 8432,
      training_minuten_heute: 40,
      gewicht_kg: 82.5,
      gewicht_ziel_kg: 78,
      gewicht_prognose_status: "IN_RICHTUNG",
    });
    expect(s.fitness.bmi).toBeCloseTo(25.6, 1);
    expect(s.finanzen).toMatchObject({
      vermoegen_netto_eur: 39000,
      immobilien_cashflow_monatlich_eur: -596.46,
      notgroschen_monate: 5.7,
      objekte_ampel_gelb: 2,
      bruttorendite_schnitt_prozent: 5,
    });
  });

  it("ohne Profil: Ziel-/Budgetwerte sind null statt 0", () => {
    const s = baueHomeAssistantSensoren({
      zeitpunkt: new Date("2026-10-10T08:00:00Z"),
      tag: tag(false),
      woche,
      gewicht: berechneGewichtsverlauf([], null, "2026-10-10"),
      finanzen,
    });
    expect(s.fitness.kalorien_ziel).toBeNull();
    expect(s.fitness.kalorien_verbleibend).toBeNull();
    expect(s.fitness.gewicht_kg).toBeNull();
    expect(s.fitness.bmi).toBeNull();
    expect(s.fitness.kalorien_gegessen).toBe(222);
  });

  it("Sensornamen stimmen mit der OpenAPI-Beschreibung überein", () => {
    const s = baueHomeAssistantSensoren({
      zeitpunkt: new Date("2026-10-10T08:00:00Z"),
      tag: tag(true),
      woche,
      gewicht: berechneGewichtsverlauf(gewichte, 78, "2026-10-10"),
      finanzen,
    });
    const schema = erzeugeOpenApiSpezifikation().components.schemas.HomeAssistantSensoren as {
      properties: Record<string, { properties?: Record<string, unknown> }>;
    };
    expect(Object.keys(s).sort()).toEqual(Object.keys(schema.properties).sort());
    expect(Object.keys(s.fitness).sort()).toEqual(Object.keys(schema.properties.fitness.properties ?? {}).sort());
    expect(Object.keys(s.finanzen).sort()).toEqual(Object.keys(schema.properties.finanzen.properties ?? {}).sort());
  });
});

describe("fitnessTagDto", () => {
  it("rundet und enthält Budget, Ziele und Einträge", () => {
    const d = fitnessTagDto(tag(true));
    expect(d.ziele).toMatchObject({ kalorien: 2120, wasserMl: 2900, schritte: 10000 });
    expect(d.budget).toEqual({ kcal: 2684, verbleibend: 2462, prozent: 8, ueberBudget: false });
    expect(d.training).toEqual({ anzahl: 1, minuten: 40, kcal: 564 });
    expect(d.mahlzeiten[0]).toMatchObject({ id: "m1", kcal: 222, kohlenhydrateG: 35.2 });
    expect(d.trainings[0]).toMatchObject({ kcal: 564, kcalMethode: "LAUFDISTANZ" });
  });

  it("ohne Profil: ziele und budget sind null", () => {
    const d = fitnessTagDto(tag(false));
    expect(d.ziele).toBeNull();
    expect(d.budget).toBeNull();
  });
});
