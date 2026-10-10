/**
 * Domain-Typen des Fitness-Rechenkerns — framework-frei wie der Rest von
 * src/server/calc/ (ADR-0001). Spiegelt die Prisma-Enums als String-Unions,
 * damit Client-Komponenten den Kern direkt im Browser nutzen können.
 *
 * Referenz (Formeln, Quellen, Vereinfachungen): docs/tools/fitness.md
 */

export const GESCHLECHTER = ["MAENNLICH", "WEIBLICH"] as const;
export type Geschlecht = (typeof GESCHLECHTER)[number];

export const AKTIVITAETSLEVEL = ["SITZEND", "LEICHT", "MAESSIG", "AKTIV", "SEHR_AKTIV"] as const;
export type Aktivitaetslevel = (typeof AKTIVITAETSLEVEL)[number];

export const FITNESS_ZIELE = ["ABNEHMEN", "HALTEN", "ZUNEHMEN"] as const;
export type FitnessZiel = (typeof FITNESS_ZIELE)[number];

export const MAHLZEITEN = ["FRUEHSTUECK", "MITTAGESSEN", "ABENDESSEN", "SNACK"] as const;
export type Mahlzeit = (typeof MAHLZEITEN)[number];

export const SPORTARTEN = [
  "LAUFEN",
  "GEHEN",
  "WANDERN",
  "RADFAHREN",
  "SCHWIMMEN",
  "KRAFTTRAINING",
  "HIIT",
  "YOGA",
  "TEAMSPORT",
  "RUDERN",
  "SONSTIGES",
] as const;
export type Sportart = (typeof SPORTARTEN)[number];

export const INTENSITAETEN = ["LEICHT", "MITTEL", "HOCH"] as const;
export type Intensitaet = (typeof INTENSITAETEN)[number];

export const DATEN_QUELLEN = ["MANUELL", "LEBENSMITTEL_DB", "FOTO_KI", "API"] as const;
export type DatenQuelle = (typeof DATEN_QUELLEN)[number];

export const KI_KONFIDENZEN = ["HOCH", "MITTEL", "NIEDRIG"] as const;
export type KiKonfidenz = (typeof KI_KONFIDENZEN)[number];

/** Kalendertag als ISO-String "YYYY-MM-DD" — der Kern rechnet nie mit Uhrzeiten/Zeitzonen. */
export type IsoDatum = string;

export interface FitnessProfilInput {
  groesseCm: number;
  geburtsjahr: number;
  geschlecht: Geschlecht;
  aktivitaetslevel: Aktivitaetslevel;
  ziel: FitnessZiel;
  zielTempoKgProWoche: number;
  zielGewichtKg: number | null;
  kalorienzielKcal: number | null;
  kalorienzielOverride: boolean;
  proteinGProKg: number;
  fettAnteilProzent: number;
  wasserZielMl: number | null;
  schritteZiel: number;
  trainingskalorienAnrechnen: boolean;
}

export interface Naehrwerte {
  kcal: number;
  proteinG: number;
  kohlenhydrateG: number;
  fettG: number;
}

export interface MahlzeitEintragInput extends Naehrwerte {
  mahlzeit: Mahlzeit;
}

export interface TrainingEintragInput {
  sportart: Sportart;
  intensitaet: Intensitaet;
  dauerMin: number;
  distanzKm: number | null;
  kcalVerbrauch: number | null;
  kcalOverride: boolean;
}

export interface GewichtMesswert {
  datum: IsoDatum;
  gewichtKg: number;
}

export interface TagesAktivitaetInput {
  schritte: number | null;
  wasserMl: number | null;
  schlafStunden: number | null;
  ruhepuls: number | null;
}
