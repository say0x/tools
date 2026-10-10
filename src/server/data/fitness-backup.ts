import { z } from "zod";
import { prisma } from "@/server/db";
import { isoZuUtcDate, utcDateZuIso } from "@/server/calc/fitness/datum";
import { DATEN_QUELLEN } from "@/server/calc/fitness/types";
import {
  eigenesLebensmittelSchema,
  fitnessProfilSchema,
  gewichtSchema,
  mahlzeitSchema,
  tagesAktivitaetSchema,
  trainingSchema,
} from "@/server/actions/fitness-schema";

/**
 * Fitness-Teil des JSON-Backups (Profil → Daten-Backup). Bewusst ohne IDs —
 * zwischen den Fitness-Tabellen gibt es keine Fremdschlüssel, die beim
 * Wiedereinspielen stabil bleiben müssten (anders als SzenarioAenderung.assetId).
 * Validiert mit denselben Zod-Schemas wie Formulare und REST-API.
 *
 * Abwärtskompatibel: ältere Backups ohne "fitness"-Abschnitt lassen beim
 * Restore die vorhandenen Fitness-Daten unangetastet (siehe restore.ts).
 */

export const fitnessBackupSchema = z.object({
  profil: fitnessProfilSchema.omit({ aktuellesGewichtKg: true }).nullable(),
  gewichte: z.array(gewichtSchema.extend({ quelle: z.enum(DATEN_QUELLEN).optional().default("MANUELL") })),
  mahlzeiten: z.array(mahlzeitSchema),
  trainings: z.array(trainingSchema.extend({ quelle: z.enum(DATEN_QUELLEN).optional().default("MANUELL") })),
  tagesAktivitaeten: z.array(tagesAktivitaetSchema),
  eigeneLebensmittel: z.array(eigenesLebensmittelSchema),
});
export type FitnessBackup = z.output<typeof fitnessBackupSchema>;

export async function exportiereFitnessDaten(userId: string): Promise<z.input<typeof fitnessBackupSchema>> {
  const [profil, gewichte, mahlzeiten, trainings, aktivitaeten, eigene] = await Promise.all([
    prisma.fitnessProfil.findUnique({ where: { userId } }),
    prisma.gewichtEintrag.findMany({ where: { userId }, orderBy: { datum: "asc" } }),
    prisma.mahlzeitEintrag.findMany({ where: { userId }, orderBy: [{ datum: "asc" }, { createdAt: "asc" }] }),
    prisma.trainingEintrag.findMany({ where: { userId }, orderBy: [{ datum: "asc" }, { createdAt: "asc" }] }),
    prisma.tagesAktivitaet.findMany({ where: { userId }, orderBy: { datum: "asc" } }),
    prisma.eigenesLebensmittel.findMany({ where: { userId }, orderBy: { bezeichnung: "asc" } }),
  ]);

  return {
    profil: profil
      ? {
          groesseCm: profil.groesseCm,
          geburtsjahr: profil.geburtsjahr,
          geschlecht: profil.geschlecht,
          aktivitaetslevel: profil.aktivitaetslevel,
          ziel: profil.ziel,
          zielTempoKgProWoche: profil.zielTempoKgProWoche,
          zielGewichtKg: profil.zielGewichtKg,
          kalorienzielKcal: profil.kalorienzielKcal,
          kalorienzielOverride: profil.kalorienzielOverride,
          proteinGProKg: profil.proteinGProKg,
          fettAnteilProzent: profil.fettAnteilProzent,
          wasserZielMl: profil.wasserZielMl,
          schritteZiel: profil.schritteZiel,
          trainingskalorienAnrechnen: profil.trainingskalorienAnrechnen,
        }
      : null,
    gewichte: gewichte.map((g) => ({
      datum: utcDateZuIso(g.datum),
      gewichtKg: g.gewichtKg,
      koerperfettProzent: g.koerperfettProzent,
      notiz: g.notiz,
      quelle: g.quelle,
    })),
    mahlzeiten: mahlzeiten.map((m) => ({
      datum: utcDateZuIso(m.datum),
      mahlzeit: m.mahlzeit,
      bezeichnung: m.bezeichnung,
      mengeG: m.mengeG,
      kcal: m.kcal,
      proteinG: m.proteinG,
      kohlenhydrateG: m.kohlenhydrateG,
      fettG: m.fettG,
      quelle: m.quelle,
      kiKonfidenz: m.kiKonfidenz,
    })),
    trainings: trainings.map((t) => ({
      datum: utcDateZuIso(t.datum),
      sportart: t.sportart,
      intensitaet: t.intensitaet,
      dauerMin: t.dauerMin,
      distanzKm: t.distanzKm,
      kcalVerbrauch: t.kcalVerbrauch,
      kcalOverride: t.kcalOverride,
      durchschnittsPuls: t.durchschnittsPuls,
      notiz: t.notiz,
      quelle: t.quelle,
    })),
    tagesAktivitaeten: aktivitaeten.map((a) => ({
      datum: utcDateZuIso(a.datum),
      schritte: a.schritte,
      wasserMl: a.wasserMl,
      schlafStunden: a.schlafStunden,
      ruhepuls: a.ruhepuls,
    })),
    eigeneLebensmittel: eigene.map((e) => ({
      bezeichnung: e.bezeichnung,
      kcalPro100g: e.kcalPro100g,
      proteinPro100g: e.proteinPro100g,
      kohlenhydratePro100g: e.kohlenhydratePro100g,
      fettPro100g: e.fettPro100g,
      standardPortionG: e.standardPortionG,
    })),
  };
}

export function zaehleFitnessDaten(daten: Pick<FitnessBackup, "gewichte" | "mahlzeiten" | "trainings">) {
  return daten.gewichte.length + daten.mahlzeiten.length + daten.trainings.length;
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Ersetzt alle Fitness-Daten des Users durch den Backup-Stand (innerhalb der Restore-Transaktion). */
export async function stelleFitnessDatenWieder(tx: Tx, userId: string, daten: FitnessBackup) {
  await loescheFitnessDatenVonUser(tx, userId);

  if (daten.profil) await tx.fitnessProfil.create({ data: { ...daten.profil, userId } });
  if (daten.gewichte.length > 0) {
    await tx.gewichtEintrag.createMany({ data: daten.gewichte.map((g) => ({ ...g, userId, datum: isoZuUtcDate(g.datum) })) });
  }
  if (daten.mahlzeiten.length > 0) {
    await tx.mahlzeitEintrag.createMany({ data: daten.mahlzeiten.map((m) => ({ ...m, userId, datum: isoZuUtcDate(m.datum) })) });
  }
  if (daten.trainings.length > 0) {
    await tx.trainingEintrag.createMany({ data: daten.trainings.map((t) => ({ ...t, userId, datum: isoZuUtcDate(t.datum) })) });
  }
  if (daten.tagesAktivitaeten.length > 0) {
    await tx.tagesAktivitaet.createMany({
      data: daten.tagesAktivitaeten.map((a) => ({
        userId,
        datum: isoZuUtcDate(a.datum),
        schritte: a.schritte ?? null,
        wasserMl: a.wasserMl ?? null,
        schlafStunden: a.schlafStunden ?? null,
        ruhepuls: a.ruhepuls ?? null,
      })),
    });
  }
  if (daten.eigeneLebensmittel.length > 0) {
    await tx.eigenesLebensmittel.createMany({ data: daten.eigeneLebensmittel.map((e) => ({ ...e, userId })) });
  }
}

async function loescheFitnessDatenVonUser(tx: Tx, userId: string) {
  await tx.fitnessProfil.deleteMany({ where: { userId } });
  await tx.gewichtEintrag.deleteMany({ where: { userId } });
  await tx.mahlzeitEintrag.deleteMany({ where: { userId } });
  await tx.trainingEintrag.deleteMany({ where: { userId } });
  await tx.tagesAktivitaet.deleteMany({ where: { userId } });
  await tx.eigenesLebensmittel.deleteMany({ where: { userId } });
}
