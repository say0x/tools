import type { Aktivitaetslevel, FitnessProfilInput, Geschlecht } from "./types";

/**
 * PAL-Werte für die Alltagsaktivität OHNE gezieltes Training (angelehnt an die
 * DGE-Referenzwerte: 1,4–1,5 überwiegend sitzend, 1,6–1,7 teils gehend,
 * 1,8–1,9 überwiegend stehend/gehend, ≥2,0 körperlich schwer). Training wird
 * separat als Mehrverbrauch erfasst (training.ts) — die klassischen
 * Harris-Benedict-Faktoren (1,2–1,9) enthalten Sport bereits und würden ihn
 * hier doppelt zählen.
 */
export const PAL_FAKTOR: Record<Aktivitaetslevel, number> = {
  SITZEND: 1.4,
  LEICHT: 1.5,
  MAESSIG: 1.65,
  AKTIV: 1.85,
  SEHR_AKTIV: 2.1,
};

/** Energiegehalt von 1 kg Körpergewicht (Faustregel, gemischtes Gewebe). */
export const KCAL_PRO_KG_KOERPERGEWICHT = 7700;

/** Untergrenze, unter die ein abgeleitetes Kalorienziel nie fallen soll (übliche ärztliche Faustregel). */
export const KALORIEN_UNTERGRENZE: Record<Geschlecht, number> = {
  MAENNLICH: 1500,
  WEIBLICH: 1200,
};

export const WASSER_ML_PRO_KG = 35;
export const WASSER_MINIMUM_ML = 1500;

export function berechneAlter(geburtsjahr: number, bezugsjahr: number): number {
  return Math.max(0, bezugsjahr - geburtsjahr);
}

/** Grundumsatz nach Mifflin-St Jeor (1990): 10·kg + 6,25·cm − 5·Jahre + 5 (m) bzw. − 161 (w). */
export function berechneGrundumsatz(gewichtKg: number, groesseCm: number, alter: number, geschlecht: Geschlecht): number {
  const basis = 10 * gewichtKg + 6.25 * groesseCm - 5 * alter;
  return basis + (geschlecht === "MAENNLICH" ? 5 : -161);
}

export type BmiKategorie = "UNTERGEWICHT" | "NORMALGEWICHT" | "UEBERGEWICHT" | "ADIPOSITAS";

export function berechneBmi(gewichtKg: number, groesseCm: number): { bmi: number; kategorie: BmiKategorie } {
  const meter = groesseCm / 100;
  const bmi = gewichtKg / (meter * meter);
  const kategorie: BmiKategorie = bmi < 18.5 ? "UNTERGEWICHT" : bmi < 25 ? "NORMALGEWICHT" : bmi < 30 ? "UEBERGEWICHT" : "ADIPOSITAS";
  return { bmi, kategorie };
}

export interface Makroziele {
  proteinG: number;
  fettG: number;
  kohlenhydrateG: number;
  /** true, wenn Protein + Fett das Kalorienziel bereits ausschöpfen und für Kohlenhydrate nichts übrig bleibt. */
  kohlenhydrateAufNullBegrenzt: boolean;
}

/**
 * Protein über g/kg Körpergewicht, Fett als Anteil der Kalorien, Kohlenhydrate
 * füllen den Rest (4/9/4 kcal je g).
 */
export function berechneMakroziele(kalorienziel: number, gewichtKg: number, proteinGProKg: number, fettAnteilProzent: number): Makroziele {
  const proteinG = proteinGProKg * gewichtKg;
  const fettG = (kalorienziel * (fettAnteilProzent / 100)) / 9;
  const restKcal = kalorienziel - proteinG * 4 - fettG * 9;
  return {
    proteinG,
    fettG,
    kohlenhydrateG: Math.max(0, restKcal / 4),
    kohlenhydrateAufNullBegrenzt: restKcal < 0,
  };
}

export interface Energiebedarf {
  alter: number;
  grundumsatz: number;
  palFaktor: number;
  /** Gesamtumsatz ohne Training = Grundumsatz × PAL. */
  gesamtumsatz: number;
  /** Tägliche Zu-/Abschlagsmenge aus Ziel + Tempo (negativ beim Abnehmen); 0 bei HALTEN. */
  zielAnpassungKcal: number;
  /** Automatisch hergeleitetes Ziel (vor Override). */
  kalorienzielBerechnet: number;
  /** Tatsächlich geltendes Ziel (Override gewinnt, sofern gesetzt). */
  kalorienziel: number;
  /** Das berechnete Ziel wurde auf die Untergrenze angehoben (Defizit wäre zu groß). */
  defizitBegrenzt: boolean;
  /** Das geltende Ziel liegt unter der empfohlenen Untergrenze (nur bei manuellem Override möglich). */
  unterUntergrenze: boolean;
  untergrenze: number;
  makros: Makroziele;
  wasserZielMl: number;
  bmi: number;
  bmiKategorie: BmiKategorie;
}

export function berechneEnergiebedarf(profil: FitnessProfilInput, gewichtKg: number, bezugsjahr: number): Energiebedarf {
  const alter = berechneAlter(profil.geburtsjahr, bezugsjahr);
  const grundumsatz = berechneGrundumsatz(gewichtKg, profil.groesseCm, alter, profil.geschlecht);
  const palFaktor = PAL_FAKTOR[profil.aktivitaetslevel];
  const gesamtumsatz = grundumsatz * palFaktor;

  const tagesAnpassung = (profil.zielTempoKgProWoche * KCAL_PRO_KG_KOERPERGEWICHT) / 7;
  const zielAnpassungKcal = profil.ziel === "ABNEHMEN" ? -tagesAnpassung : profil.ziel === "ZUNEHMEN" ? tagesAnpassung : 0;

  // Nie unter den Grundumsatz bzw. die geschlechtsspezifische Faustregel-Untergrenze.
  const untergrenze = Math.max(grundumsatz, KALORIEN_UNTERGRENZE[profil.geschlecht]);
  const roh = gesamtumsatz + zielAnpassungKcal;
  const defizitBegrenzt = profil.ziel === "ABNEHMEN" && roh < untergrenze;
  const kalorienzielBerechnet = Math.round(defizitBegrenzt ? untergrenze : roh);

  const kalorienziel =
    profil.kalorienzielOverride && profil.kalorienzielKcal != null && profil.kalorienzielKcal > 0
      ? profil.kalorienzielKcal
      : kalorienzielBerechnet;

  const wasserBerechnet = Math.max(WASSER_MINIMUM_ML, Math.round((gewichtKg * WASSER_ML_PRO_KG) / 50) * 50);
  const { bmi, kategorie } = berechneBmi(gewichtKg, profil.groesseCm);

  return {
    alter,
    grundumsatz,
    palFaktor,
    gesamtumsatz,
    zielAnpassungKcal,
    kalorienzielBerechnet,
    kalorienziel,
    defizitBegrenzt,
    unterUntergrenze: kalorienziel < untergrenze,
    untergrenze,
    makros: berechneMakroziele(kalorienziel, gewichtKg, profil.proteinGProKg, profil.fettAnteilProzent),
    wasserZielMl: profil.wasserZielMl ?? wasserBerechnet,
    bmi,
    bmiKategorie: kategorie,
  };
}
