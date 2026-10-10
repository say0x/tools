import type { Intensitaet, Sportart, TrainingEintragInput } from "./types";

/**
 * MET-Werte (Vielfache des Ruheumsatzes) je Sportart und Intensität,
 * gerundet nach dem Compendium of Physical Activities (Ainsworth et al.).
 * Grobe Richtwerte — Technik, Gelände und Fitnesszustand verschieben den
 * echten Verbrauch deutlich.
 */
export const MET_WERTE: Record<Sportart, Record<Intensitaet, number>> = {
  LAUFEN: { LEICHT: 7.0, MITTEL: 9.8, HOCH: 11.5 },
  GEHEN: { LEICHT: 3.5, MITTEL: 4.3, HOCH: 5.0 },
  WANDERN: { LEICHT: 5.3, MITTEL: 6.0, HOCH: 7.8 },
  RADFAHREN: { LEICHT: 5.5, MITTEL: 8.0, HOCH: 10.0 },
  SCHWIMMEN: { LEICHT: 5.0, MITTEL: 7.0, HOCH: 9.8 },
  KRAFTTRAINING: { LEICHT: 3.5, MITTEL: 5.0, HOCH: 6.0 },
  HIIT: { LEICHT: 5.5, MITTEL: 7.5, HOCH: 9.0 },
  YOGA: { LEICHT: 2.5, MITTEL: 3.3, HOCH: 4.0 },
  TEAMSPORT: { LEICHT: 5.0, MITTEL: 7.0, HOCH: 10.0 },
  RUDERN: { LEICHT: 4.8, MITTEL: 7.0, HOCH: 8.5 },
  SONSTIGES: { LEICHT: 3.0, MITTEL: 5.0, HOCH: 7.0 },
};

/** Compendium-Werte für Radfahren nach Geschwindigkeit (km/h, Obergrenze exklusiv). */
const RAD_MET_NACH_TEMPO: { bisKmh: number; met: number }[] = [
  { bisKmh: 16, met: 4.0 },
  { bisKmh: 19, met: 6.8 },
  { bisKmh: 22, met: 8.0 },
  { bisKmh: 25.5, met: 10.0 },
  { bisKmh: 30.5, met: 12.0 },
  { bisKmh: Infinity, met: 15.8 },
];

/** Laufen: Bruttoverbrauch ≈ 1 kcal je kg Körpergewicht und km — tempounabhängige Faustregel. */
const LAUF_KCAL_PRO_KG_KM = 1.0;

export type Schaetzmethode = "MET" | "LAUFDISTANZ" | "RADTEMPO" | "MANUELL";

export interface TrainingsVerbrauch {
  /** Mehrverbrauch gegenüber Ruhe (kcal) — das, was auf das Tagesbudget aufgeschlagen wird. */
  kcal: number;
  methode: Schaetzmethode;
  met: number | null;
}

/**
 * Netto-Mehrverbrauch = (MET − 1) × kg × Stunden. Bewusst netto: die eine
 * MET Ruheumsatz während der Trainingszeit steckt schon im Gesamtumsatz
 * (Grundumsatz × PAL) — brutto würde sie doppelt aufs Budget kommen.
 */
export function schaetzeTrainingsverbrauch(
  training: Pick<TrainingEintragInput, "sportart" | "intensitaet" | "dauerMin" | "distanzKm">,
  gewichtKg: number
): TrainingsVerbrauch {
  const stunden = Math.max(0, training.dauerMin) / 60;
  const ruheAnteil = gewichtKg * stunden;

  if (training.sportart === "LAUFEN" && training.distanzKm != null && training.distanzKm > 0) {
    const brutto = LAUF_KCAL_PRO_KG_KM * gewichtKg * training.distanzKm;
    return { kcal: Math.max(0, Math.round(brutto - ruheAnteil)), methode: "LAUFDISTANZ", met: null };
  }

  if (training.sportart === "RADFAHREN" && training.distanzKm != null && training.distanzKm > 0 && stunden > 0) {
    const kmh = training.distanzKm / stunden;
    const met = RAD_MET_NACH_TEMPO.find((b) => kmh < b.bisKmh)!.met;
    return { kcal: Math.round((met - 1) * gewichtKg * stunden), methode: "RADTEMPO", met };
  }

  const met = MET_WERTE[training.sportart][training.intensitaet];
  return { kcal: Math.round((met - 1) * gewichtKg * stunden), methode: "MET", met };
}

/** computed-with-override: manuell eingetragener Wert (z. B. aus der Sportuhr) gewinnt. */
export function effektiverTrainingsverbrauch(training: TrainingEintragInput, gewichtKg: number): TrainingsVerbrauch {
  if (training.kcalOverride && training.kcalVerbrauch != null && training.kcalVerbrauch >= 0) {
    return { kcal: training.kcalVerbrauch, methode: "MANUELL", met: null };
  }
  return schaetzeTrainingsverbrauch(training, gewichtKg);
}
