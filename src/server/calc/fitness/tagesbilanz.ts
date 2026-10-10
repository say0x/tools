import type { Makroziele } from "./energiebedarf";
import { effektiverTrainingsverbrauch } from "./training";
import { MAHLZEITEN, type Mahlzeit, type MahlzeitEintragInput, type Naehrwerte, type TrainingEintragInput } from "./types";

export interface MakroFortschritt {
  ist: number;
  ziel: number;
  /** ist / ziel in Prozent; null bei Ziel 0 (z. B. Kohlenhydrate auf 0 begrenzt). */
  prozent: number | null;
}

export interface Tagesbilanz {
  zugefuehrt: Naehrwerte;
  proMahlzeit: Record<Mahlzeit, Naehrwerte>;
  trainingsverbrauchKcal: number;
  kalorienziel: number;
  /** Ziel + Trainingsverbrauch (sofern angerechnet). */
  budget: number;
  verbleibend: number;
  /** zugeführt / budget in Prozent. */
  budgetProzent: number;
  ueberBudget: boolean;
  makros: { protein: MakroFortschritt; kohlenhydrate: MakroFortschritt; fett: MakroFortschritt };
}

const leer = (): Naehrwerte => ({ kcal: 0, proteinG: 0, kohlenhydrateG: 0, fettG: 0 });

export function summiereNaehrwerte(eintraege: Naehrwerte[]): Naehrwerte {
  return eintraege.reduce(
    (summe, e) => ({
      kcal: summe.kcal + e.kcal,
      proteinG: summe.proteinG + e.proteinG,
      kohlenhydrateG: summe.kohlenhydrateG + e.kohlenhydrateG,
      fettG: summe.fettG + e.fettG,
    }),
    leer()
  );
}

/** Nährwerte einer Menge aus Werten je 100 g (Lebensmittel-Datenbank). */
export function naehrwerteFuerMenge(
  pro100g: { kcalPro100g: number; proteinPro100g: number; kohlenhydratePro100g: number; fettPro100g: number },
  mengeG: number
): Naehrwerte {
  const faktor = mengeG / 100;
  return {
    kcal: pro100g.kcalPro100g * faktor,
    proteinG: pro100g.proteinPro100g * faktor,
    kohlenhydrateG: pro100g.kohlenhydratePro100g * faktor,
    fettG: pro100g.fettPro100g * faktor,
  };
}

function fortschritt(ist: number, ziel: number): MakroFortschritt {
  return { ist, ziel, prozent: ziel > 0 ? (ist / ziel) * 100 : null };
}

export function berechneTagesbilanz(input: {
  mahlzeiten: MahlzeitEintragInput[];
  trainings: TrainingEintragInput[];
  gewichtKg: number;
  kalorienziel: number;
  makroziele: Makroziele;
  trainingskalorienAnrechnen: boolean;
}): Tagesbilanz {
  const zugefuehrt = summiereNaehrwerte(input.mahlzeiten);
  const proMahlzeit = Object.fromEntries(
    MAHLZEITEN.map((m) => [m, summiereNaehrwerte(input.mahlzeiten.filter((e) => e.mahlzeit === m))])
  ) as Record<Mahlzeit, Naehrwerte>;

  const trainingsverbrauchKcal = input.trainings.reduce(
    (summe, t) => summe + effektiverTrainingsverbrauch(t, input.gewichtKg).kcal,
    0
  );
  const budget = input.kalorienziel + (input.trainingskalorienAnrechnen ? trainingsverbrauchKcal : 0);
  const verbleibend = budget - zugefuehrt.kcal;

  return {
    zugefuehrt,
    proMahlzeit,
    trainingsverbrauchKcal,
    kalorienziel: input.kalorienziel,
    budget,
    verbleibend,
    budgetProzent: budget > 0 ? (zugefuehrt.kcal / budget) * 100 : 0,
    ueberBudget: verbleibend < 0,
    makros: {
      protein: fortschritt(zugefuehrt.proteinG, input.makroziele.proteinG),
      kohlenhydrate: fortschritt(zugefuehrt.kohlenhydrateG, input.makroziele.kohlenhydrateG),
      fett: fortschritt(zugefuehrt.fettG, input.makroziele.fettG),
    },
  };
}
