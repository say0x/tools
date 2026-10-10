import type { FitnessTag, MahlzeitZeile, TrainingZeile } from "@/server/data/fitness";

/**
 * Antwortformate der REST-API — bewusst gerundet und stabil benannt, damit
 * Clients (Home Assistant, Kurzbefehle) nicht von internen Typen abhängen.
 * Kalorien als ganze Zahlen, Gramm/kg mit einer Nachkommastelle.
 */

export const ganz = (n: number) => Math.round(n);
export const eineStelle = (n: number) => Math.round(n * 10) / 10;
const optional = <T, R>(wert: T | null | undefined, f: (w: T) => R): R | null => (wert == null ? null : f(wert));

export function mahlzeitDto(m: MahlzeitZeile) {
  return {
    id: m.id,
    datum: m.datum,
    mahlzeit: m.mahlzeit,
    bezeichnung: m.bezeichnung,
    mengeG: optional(m.mengeG, eineStelle),
    kcal: ganz(m.kcal),
    proteinG: eineStelle(m.proteinG),
    kohlenhydrateG: eineStelle(m.kohlenhydrateG),
    fettG: eineStelle(m.fettG),
    quelle: m.quelle,
    kiKonfidenz: m.kiKonfidenz,
  };
}

export function trainingDto(t: TrainingZeile) {
  return {
    id: t.id,
    datum: t.datum,
    sportart: t.sportart,
    intensitaet: t.intensitaet,
    dauerMin: t.dauerMin,
    distanzKm: optional(t.distanzKm, eineStelle),
    kcal: ganz(t.verbrauch.kcal),
    kcalMethode: t.verbrauch.methode,
    durchschnittsPuls: t.durchschnittsPuls,
    notiz: t.notiz,
    quelle: t.quelle,
  };
}

export function fitnessTagDto(tag: FitnessTag) {
  const e = tag.energiebedarf;
  const b = tag.bilanz;
  const trainingKcal = tag.trainings.reduce((s, t) => s + t.verbrauch.kcal, 0);
  return {
    datum: tag.datum,
    profilVorhanden: tag.profil != null,
    gewichtKg: optional(tag.gewichtKg, eineStelle),
    ziele: e
      ? {
          kalorien: e.kalorienziel,
          proteinG: ganz(e.makros.proteinG),
          kohlenhydrateG: ganz(e.makros.kohlenhydrateG),
          fettG: ganz(e.makros.fettG),
          wasserMl: e.wasserZielMl,
          schritte: tag.schritteZiel,
          grundumsatz: ganz(e.grundumsatz),
          gesamtumsatzOhneSport: ganz(e.gesamtumsatz),
        }
      : null,
    zugefuehrt: {
      kcal: ganz(tag.zugefuehrt.kcal),
      proteinG: eineStelle(tag.zugefuehrt.proteinG),
      kohlenhydrateG: eineStelle(tag.zugefuehrt.kohlenhydrateG),
      fettG: eineStelle(tag.zugefuehrt.fettG),
    },
    training: { anzahl: tag.trainings.length, minuten: tag.trainings.reduce((s, t) => s + t.dauerMin, 0), kcal: ganz(trainingKcal) },
    budget: b ? { kcal: ganz(b.budget), verbleibend: ganz(b.verbleibend), prozent: ganz(b.budgetProzent), ueberBudget: b.ueberBudget } : null,
    aktivitaet: {
      schritte: tag.aktivitaet?.schritte ?? null,
      wasserMl: tag.aktivitaet?.wasserMl ?? null,
      schlafStunden: tag.aktivitaet?.schlafStunden ?? null,
      ruhepuls: tag.aktivitaet?.ruhepuls ?? null,
    },
    mahlzeiten: tag.mahlzeiten.map(mahlzeitDto),
    trainings: tag.trainings.map(trainingDto),
  };
}
