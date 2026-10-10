import type {
  Aktivitaetslevel,
  DatenQuelle,
  FitnessZiel,
  Geschlecht,
  Intensitaet,
  KiKonfidenz,
  Mahlzeit,
  Sportart,
} from "@/server/calc/fitness/types";
import type { BmiKategorie } from "@/server/calc/fitness/energiebedarf";
import type { PrognoseStatus } from "@/server/calc/fitness/gewichtstrend";

export const GESCHLECHT_LABELS: Record<Geschlecht, string> = {
  MAENNLICH: "Männlich",
  WEIBLICH: "Weiblich",
};

export const AKTIVITAETSLEVEL_LABELS: Record<Aktivitaetslevel, string> = {
  SITZEND: "Sitzend — Büro/Homeoffice, kaum Wege zu Fuß",
  LEICHT: "Leicht — Büro, aber tägliche Wege zu Fuß/Rad",
  MAESSIG: "Mäßig — teils sitzend, teils stehend/gehend",
  AKTIV: "Aktiv — überwiegend stehend/gehend (z. B. Verkauf, Pflege)",
  SEHR_AKTIV: "Sehr aktiv — körperlich schwere Arbeit",
};

export const FITNESS_ZIEL_LABELS: Record<FitnessZiel, string> = {
  ABNEHMEN: "Abnehmen",
  HALTEN: "Gewicht halten",
  ZUNEHMEN: "Zunehmen / Muskelaufbau",
};

export const MAHLZEIT_LABELS: Record<Mahlzeit, string> = {
  FRUEHSTUECK: "Frühstück",
  MITTAGESSEN: "Mittagessen",
  ABENDESSEN: "Abendessen",
  SNACK: "Snacks",
};

export const SPORTART_LABELS: Record<Sportart, string> = {
  LAUFEN: "Laufen",
  GEHEN: "Gehen / Spazieren",
  WANDERN: "Wandern",
  RADFAHREN: "Radfahren",
  SCHWIMMEN: "Schwimmen",
  KRAFTTRAINING: "Krafttraining",
  HIIT: "HIIT / Zirkeltraining",
  YOGA: "Yoga / Mobility",
  TEAMSPORT: "Teamsport (Fußball, Basketball, …)",
  RUDERN: "Rudern / Ergometer",
  SONSTIGES: "Sonstiges",
};

export const INTENSITAET_LABELS: Record<Intensitaet, string> = {
  LEICHT: "Leicht",
  MITTEL: "Mittel",
  HOCH: "Hoch",
};

export const DATEN_QUELLE_LABELS: Record<DatenQuelle, string> = {
  MANUELL: "Manuell",
  LEBENSMITTEL_DB: "Lebensmittel-DB",
  FOTO_KI: "Foto-KI",
  API: "API",
};

export const KI_KONFIDENZ_LABELS: Record<KiKonfidenz, string> = {
  HOCH: "hohe Sicherheit",
  MITTEL: "mittlere Sicherheit",
  NIEDRIG: "geringe Sicherheit",
};

export const BMI_KATEGORIE_LABELS: Record<BmiKategorie, string> = {
  UNTERGEWICHT: "Untergewicht",
  NORMALGEWICHT: "Normalgewicht",
  UEBERGEWICHT: "Übergewicht",
  ADIPOSITAS: "Adipositas",
};

export const PROGNOSE_LABELS: Record<PrognoseStatus, string> = {
  KEIN_ZIEL: "Kein Zielgewicht hinterlegt",
  ZU_WENIG_DATEN: "Noch zu wenige Messungen für einen Trend (mind. 3 über 7 Tage)",
  ERREICHT: "Zielgewicht erreicht",
  IN_RICHTUNG: "Auf Kurs",
  FALSCHE_RICHTUNG: "Trend läuft vom Ziel weg",
  STAGNATION: "Gewicht stagniert",
};

const ganzzahl = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 0 });
const einDezimal = new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatKcal(n: number): string {
  return `${ganzzahl.format(Math.round(n))} kcal`;
}

export function formatGramm(n: number): string {
  return `${ganzzahl.format(Math.round(n))} g`;
}

export function formatKg(n: number): string {
  return `${einDezimal.format(n)} kg`;
}

/** "+0,4 kg" / "−1,2 kg" — für Veränderungen. */
export function formatKgDifferenz(n: number): string {
  const vorzeichen = n > 0.05 ? "+" : n < -0.05 ? "−" : "±";
  return `${vorzeichen}${einDezimal.format(Math.abs(n))} kg`;
}

export function formatLiter(ml: number): string {
  return `${einDezimal.format(ml / 1000)} l`;
}

/** "Mo., 14.07.2026" aus einem ISO-Kalendertag (ohne Zeitzonen-Verschiebung). */
export function formatDatumLang(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T00:00:00.000Z`)
  );
}

export function formatDatumKurz(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00.000Z`));
}
