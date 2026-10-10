import { prisma } from "@/server/db";
import { isoZuUtcDate, utcDateZuIso, addiereTage, tageImBereich } from "@/server/calc/fitness/datum";
import { berechneEnergiebedarf, type Energiebedarf } from "@/server/calc/fitness/energiebedarf";
import { gewichtAmDatum, berechneGewichtsverlauf, type Gewichtsverlauf } from "@/server/calc/fitness/gewichtstrend";
import { berechneTagesbilanz, summiereNaehrwerte, type Tagesbilanz } from "@/server/calc/fitness/tagesbilanz";
import { effektiverTrainingsverbrauch, type TrainingsVerbrauch } from "@/server/calc/fitness/training";
import { berechneZeitraumstatistik, type TagesWerte, type Zeitraumstatistik } from "@/server/calc/fitness/wochenstatistik";
import type {
  DatenQuelle,
  FitnessProfilInput,
  GewichtMesswert,
  IsoDatum,
  KiKonfidenz,
  Mahlzeit,
  Naehrwerte,
  TagesAktivitaetInput,
  TrainingEintragInput,
} from "@/server/calc/fitness/types";
import type { z } from "zod";
import type {
  eigenesLebensmittelSchema,
  fitnessProfilSchema,
  gewichtSchema,
  mahlzeitSchema,
  tagesAktivitaetSchema,
  trainingSchema,
} from "@/server/actions/fitness-schema";

/**
 * Datenzugriff für Fitness & Ernährung. Jede Funktion nimmt die userId
 * explizit entgegen (statt getActiveUserId() selbst aufzurufen), damit
 * Server Actions (Cookie-Nutzer) und REST-API (Token-Nutzer) exakt dieselben
 * Lese-/Schreibwege nutzen. Referenz: docs/tools/fitness.md
 */

/** Platzhalter für Trainings-Schätzungen, solange noch nie gewogen wurde. */
export const REFERENZGEWICHT_KG = 70;

// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------

type FitnessProfilRow = NonNullable<Awaited<ReturnType<typeof prisma.fitnessProfil.findUnique>>>;

function toFitnessProfilInput(row: FitnessProfilRow): FitnessProfilInput {
  return {
    groesseCm: row.groesseCm,
    geburtsjahr: row.geburtsjahr,
    geschlecht: row.geschlecht,
    aktivitaetslevel: row.aktivitaetslevel,
    ziel: row.ziel,
    zielTempoKgProWoche: row.zielTempoKgProWoche,
    zielGewichtKg: row.zielGewichtKg,
    kalorienzielKcal: row.kalorienzielKcal,
    kalorienzielOverride: row.kalorienzielOverride,
    proteinGProKg: row.proteinGProKg,
    fettAnteilProzent: row.fettAnteilProzent,
    wasserZielMl: row.wasserZielMl,
    schritteZiel: row.schritteZiel,
    trainingskalorienAnrechnen: row.trainingskalorienAnrechnen,
  };
}

export interface GewichtZeile extends GewichtMesswert {
  id: string;
  koerperfettProzent: number | null;
  notiz: string;
  quelle: DatenQuelle;
}

export interface MahlzeitZeile extends Naehrwerte {
  id: string;
  datum: IsoDatum;
  mahlzeit: Mahlzeit;
  bezeichnung: string;
  mengeG: number | null;
  quelle: DatenQuelle;
  kiKonfidenz: KiKonfidenz | null;
  createdAt: string;
}

export interface TrainingZeile extends TrainingEintragInput {
  id: string;
  datum: IsoDatum;
  durchschnittsPuls: number | null;
  notiz: string;
  quelle: DatenQuelle;
  /** Effektiver Mehrverbrauch (Override oder Schätzung mit dem Gewicht des Tages). */
  verbrauch: TrainingsVerbrauch;
}

export interface TagesAktivitaetZeile extends TagesAktivitaetInput {
  datum: IsoDatum;
}

function toGewichtZeile(r: Awaited<ReturnType<typeof prisma.gewichtEintrag.findMany>>[number]): GewichtZeile {
  return {
    id: r.id,
    datum: utcDateZuIso(r.datum),
    gewichtKg: r.gewichtKg,
    koerperfettProzent: r.koerperfettProzent,
    notiz: r.notiz,
    quelle: r.quelle,
  };
}

function toMahlzeitZeile(r: Awaited<ReturnType<typeof prisma.mahlzeitEintrag.findMany>>[number]): MahlzeitZeile {
  return {
    id: r.id,
    datum: utcDateZuIso(r.datum),
    mahlzeit: r.mahlzeit,
    bezeichnung: r.bezeichnung,
    mengeG: r.mengeG,
    kcal: r.kcal,
    proteinG: r.proteinG,
    kohlenhydrateG: r.kohlenhydrateG,
    fettG: r.fettG,
    quelle: r.quelle,
    kiKonfidenz: r.kiKonfidenz,
    createdAt: r.createdAt.toISOString(),
  };
}

function toTrainingZeile(r: Awaited<ReturnType<typeof prisma.trainingEintrag.findMany>>[number], gewichtKg: number): TrainingZeile {
  const input: TrainingEintragInput = {
    sportart: r.sportart,
    intensitaet: r.intensitaet,
    dauerMin: r.dauerMin,
    distanzKm: r.distanzKm,
    kcalVerbrauch: r.kcalVerbrauch,
    kcalOverride: r.kcalOverride,
  };
  return {
    ...input,
    id: r.id,
    datum: utcDateZuIso(r.datum),
    durchschnittsPuls: r.durchschnittsPuls,
    notiz: r.notiz,
    quelle: r.quelle,
    verbrauch: effektiverTrainingsverbrauch(input, gewichtKg),
  };
}

function toAktivitaet(r: { schritte: number | null; wasserMl: number | null; schlafStunden: number | null; ruhepuls: number | null }): TagesAktivitaetInput {
  return { schritte: r.schritte, wasserMl: r.wasserMl, schlafStunden: r.schlafStunden, ruhepuls: r.ruhepuls };
}

const zeitraum = (von: IsoDatum, bis: IsoDatum) => ({ gte: isoZuUtcDate(von), lte: isoZuUtcDate(bis) });

// ---------------------------------------------------------------------------
// Lesen
// ---------------------------------------------------------------------------

export async function ladeFitnessProfil(userId: string): Promise<FitnessProfilInput | null> {
  const row = await prisma.fitnessProfil.findUnique({ where: { userId } });
  return row ? toFitnessProfilInput(row) : null;
}

export async function ladeGewichte(userId: string, bereich?: { von?: IsoDatum; bis?: IsoDatum }): Promise<GewichtZeile[]> {
  const rows = await prisma.gewichtEintrag.findMany({
    where: {
      userId,
      datum: {
        ...(bereich?.von ? { gte: isoZuUtcDate(bereich.von) } : {}),
        ...(bereich?.bis ? { lte: isoZuUtcDate(bereich.bis) } : {}),
      },
    },
    orderBy: { datum: "asc" },
  });
  return rows.map(toGewichtZeile);
}

export interface FitnessTag {
  datum: IsoDatum;
  profil: FitnessProfilInput | null;
  /** Letztes Gewicht am oder vor dem Tag. */
  gewichtKg: number | null;
  energiebedarf: Energiebedarf | null;
  /** Nur mit Profil + Gewicht sinnvoll (sonst gibt es kein Ziel). */
  bilanz: Tagesbilanz | null;
  zugefuehrt: Naehrwerte;
  mahlzeiten: MahlzeitZeile[];
  trainings: TrainingZeile[];
  aktivitaet: TagesAktivitaetInput | null;
  wasserZielMl: number | null;
  schritteZiel: number | null;
}

export async function ladeFitnessTag(userId: string, datum: IsoDatum): Promise<FitnessTag> {
  const tag = isoZuUtcDate(datum);
  const [profilRow, letztesGewicht, mahlzeitRows, trainingRows, aktivitaetRow] = await Promise.all([
    prisma.fitnessProfil.findUnique({ where: { userId } }),
    prisma.gewichtEintrag.findFirst({ where: { userId, datum: { lte: tag } }, orderBy: { datum: "desc" } }),
    prisma.mahlzeitEintrag.findMany({ where: { userId, datum: tag }, orderBy: { createdAt: "asc" } }),
    prisma.trainingEintrag.findMany({ where: { userId, datum: tag }, orderBy: { createdAt: "asc" } }),
    prisma.tagesAktivitaet.findUnique({ where: { userId_datum: { userId, datum: tag } } }),
  ]);

  const profil = profilRow ? toFitnessProfilInput(profilRow) : null;
  const gewichtKg = letztesGewicht?.gewichtKg ?? null;
  const mahlzeiten = mahlzeitRows.map(toMahlzeitZeile);
  const trainings = trainingRows.map((r) => toTrainingZeile(r, gewichtKg ?? REFERENZGEWICHT_KG));
  const energiebedarf = profil && gewichtKg != null ? berechneEnergiebedarf(profil, gewichtKg, Number(datum.slice(0, 4))) : null;

  return {
    datum,
    profil,
    gewichtKg,
    energiebedarf,
    bilanz:
      profil && energiebedarf && gewichtKg != null
        ? berechneTagesbilanz({
            mahlzeiten,
            trainings,
            gewichtKg,
            kalorienziel: energiebedarf.kalorienziel,
            makroziele: energiebedarf.makros,
            trainingskalorienAnrechnen: profil.trainingskalorienAnrechnen,
          })
        : null,
    zugefuehrt: summiereNaehrwerte(mahlzeiten),
    mahlzeiten,
    trainings,
    aktivitaet: aktivitaetRow ? toAktivitaet(aktivitaetRow) : null,
    wasserZielMl: energiebedarf?.wasserZielMl ?? profil?.wasserZielMl ?? null,
    schritteZiel: profil?.schritteZiel ?? null,
  };
}

export interface FitnessZeitraum {
  tage: TagesWerte[];
  statistik: Zeitraumstatistik;
}

export async function ladeFitnessZeitraum(userId: string, bis: IsoDatum, anzahlTage: number): Promise<FitnessZeitraum> {
  const von = addiereTage(bis, -(anzahlTage - 1));
  const [profilRow, gewichtRows, mahlzeitRows, trainingRows, aktivitaetRows] = await Promise.all([
    prisma.fitnessProfil.findUnique({ where: { userId } }),
    prisma.gewichtEintrag.findMany({ where: { userId, datum: { lte: isoZuUtcDate(bis) } }, orderBy: { datum: "asc" } }),
    prisma.mahlzeitEintrag.findMany({ where: { userId, datum: zeitraum(von, bis) } }),
    prisma.trainingEintrag.findMany({ where: { userId, datum: zeitraum(von, bis) } }),
    prisma.tagesAktivitaet.findMany({ where: { userId, datum: zeitraum(von, bis) } }),
  ]);

  const profil = profilRow ? toFitnessProfilInput(profilRow) : null;
  const gewichte = gewichtRows.map(toGewichtZeile);

  const tage: TagesWerte[] = tageImBereich(von, bis).map((datum) => {
    const gewicht = gewichtAmDatum(gewichte, datum);
    const gewichtFuerTraining = gewicht ?? REFERENZGEWICHT_KG;
    const mahlzeiten = mahlzeitRows.filter((m) => utcDateZuIso(m.datum) === datum);
    const trainings = trainingRows.filter((t) => utcDateZuIso(t.datum) === datum).map((t) => toTrainingZeile(t, gewichtFuerTraining));
    const aktivitaet = aktivitaetRows.find((a) => utcDateZuIso(a.datum) === datum);
    const trainingKcal = trainings.reduce((s, t) => s + t.verbrauch.kcal, 0);
    const ziel = profil && gewicht != null ? berechneEnergiebedarf(profil, gewicht, Number(datum.slice(0, 4))).kalorienziel : 0;

    return {
      datum,
      zugefuehrt: mahlzeiten.length > 0 ? summiereNaehrwerte(mahlzeiten) : null,
      budget: ziel > 0 ? ziel + (profil!.trainingskalorienAnrechnen ? trainingKcal : 0) : 0,
      trainingMinuten: trainings.reduce((s, t) => s + t.dauerMin, 0),
      trainingKcal,
      trainingAnzahl: trainings.length,
      aktivitaet: aktivitaet ? toAktivitaet(aktivitaet) : null,
    };
  });

  return { tage, statistik: berechneZeitraumstatistik(tage) };
}

export async function ladeGewichtsverlauf(userId: string, heute: IsoDatum): Promise<Gewichtsverlauf & { eintraege: GewichtZeile[] }> {
  const [profil, eintraege] = await Promise.all([ladeFitnessProfil(userId), ladeGewichte(userId)]);
  return { ...berechneGewichtsverlauf(eintraege, profil?.zielGewichtKg ?? null, heute), eintraege };
}


export async function ladeTrainings(userId: string, von: IsoDatum, bis: IsoDatum): Promise<TrainingZeile[]> {
  const [rows, gewichte] = await Promise.all([
    prisma.trainingEintrag.findMany({ where: { userId, datum: zeitraum(von, bis) }, orderBy: [{ datum: "desc" }, { createdAt: "desc" }] }),
    ladeGewichte(userId, { bis }),
  ]);
  return rows.map((r) => toTrainingZeile(r, gewichtAmDatum(gewichte, utcDateZuIso(r.datum)) ?? REFERENZGEWICHT_KG));
}

export interface LebensmittelOption {
  id: string;
  bezeichnung: string;
  kategorie: string;
  kcalPro100g: number;
  proteinPro100g: number;
  kohlenhydratePro100g: number;
  fettPro100g: number;
  standardPortionG: number;
  eigenes: boolean;
}

export async function ladeLebensmittelKatalog(userId: string): Promise<LebensmittelOption[]> {
  const [referenz, eigene] = await Promise.all([
    prisma.referenceLebensmittel.findMany({ orderBy: [{ kategorie: "asc" }, { bezeichnung: "asc" }] }),
    prisma.eigenesLebensmittel.findMany({ where: { userId }, orderBy: { bezeichnung: "asc" } }),
  ]);
  return [
    ...eigene.map((e) => ({ ...e, kategorie: "Eigene Lebensmittel", eigenes: true })),
    ...referenz.map((r) => ({ ...r, eigenes: false })),
  ].map((l) => ({
    id: l.id,
    bezeichnung: l.bezeichnung,
    kategorie: l.kategorie,
    kcalPro100g: l.kcalPro100g,
    proteinPro100g: l.proteinPro100g,
    kohlenhydratePro100g: l.kohlenhydratePro100g,
    fettPro100g: l.fettPro100g,
    standardPortionG: l.standardPortionG,
    eigenes: l.eigenes,
  }));
}

// ---------------------------------------------------------------------------
// Schreiben (Eingaben sind bereits per fitness-schema.ts validiert)
// ---------------------------------------------------------------------------

export async function speichereFitnessProfilFuerUser(userId: string, daten: z.output<typeof fitnessProfilSchema>, heute: IsoDatum) {
  const { aktuellesGewichtKg, ...profilDaten } = daten;
  await prisma.$transaction(async (tx) => {
    await tx.fitnessProfil.upsert({ where: { userId }, update: profilDaten, create: { ...profilDaten, userId } });
    if (aktuellesGewichtKg != null) {
      const datum = isoZuUtcDate(heute);
      await tx.gewichtEintrag.upsert({
        where: { userId_datum: { userId, datum } },
        update: { gewichtKg: aktuellesGewichtKg },
        create: { userId, datum, gewichtKg: aktuellesGewichtKg },
      });
    }
  });
}

export async function speichereGewichtFuerUser(userId: string, daten: z.output<typeof gewichtSchema>, quelle: DatenQuelle = "MANUELL") {
  const datum = isoZuUtcDate(daten.datum);
  const werte = { gewichtKg: daten.gewichtKg, koerperfettProzent: daten.koerperfettProzent, notiz: daten.notiz, quelle };
  const row = await prisma.gewichtEintrag.upsert({
    where: { userId_datum: { userId, datum } },
    update: werte,
    create: { ...werte, userId, datum },
  });
  return toGewichtZeile(row);
}


export async function erstelleMahlzeitenFuerUser(userId: string, eintraege: z.output<typeof mahlzeitSchema>[]) {
  const rows = await prisma.$transaction(
    eintraege.map((daten) => prisma.mahlzeitEintrag.create({ data: { ...daten, userId, datum: isoZuUtcDate(daten.datum) } }))
  );
  return rows.map(toMahlzeitZeile);
}

export async function erstelleTrainingFuerUser(userId: string, daten: z.output<typeof trainingSchema>) {
  const datum = isoZuUtcDate(daten.datum);
  const [row, letztesGewicht] = await Promise.all([
    prisma.trainingEintrag.create({
      data: { ...daten, kcalVerbrauch: daten.kcalOverride ? daten.kcalVerbrauch : null, userId, datum },
    }),
    prisma.gewichtEintrag.findFirst({ where: { userId, datum: { lte: datum } }, orderBy: { datum: "desc" } }),
  ]);
  return toTrainingZeile(row, letztesGewicht?.gewichtKg ?? REFERENZGEWICHT_KG);
}

export async function aktualisiereTagesAktivitaetFuerUser(userId: string, daten: z.output<typeof tagesAktivitaetSchema>): Promise<TagesAktivitaetZeile> {
  const { datum: datumIso, ...felder } = daten;
  const datum = isoZuUtcDate(datumIso);
  // undefined-Felder lässt Prisma beim Update automatisch unverändert.
  const row = await prisma.tagesAktivitaet.upsert({
    where: { userId_datum: { userId, datum } },
    update: felder,
    create: { userId, datum, ...felder },
  });
  return { datum: datumIso, ...toAktivitaet(row) };
}

/** Erhöht (oder verringert) die Wassermenge des Tages atomar — für "Glas getrunken"-Buttons. */
export async function addiereWasserFuerUser(userId: string, datumIso: IsoDatum, ml: number): Promise<TagesAktivitaetZeile> {
  const datum = isoZuUtcDate(datumIso);
  const row = await prisma.$transaction(async (tx) => {
    const bestehend = await tx.tagesAktivitaet.findUnique({ where: { userId_datum: { userId, datum } } });
    const neu = Math.max(0, (bestehend?.wasserMl ?? 0) + ml);
    return tx.tagesAktivitaet.upsert({
      where: { userId_datum: { userId, datum } },
      update: { wasserMl: neu },
      create: { userId, datum, wasserMl: neu },
    });
  });
  return { datum: datumIso, ...toAktivitaet(row) };
}

export async function erstelleEigenesLebensmittelFuerUser(userId: string, daten: z.output<typeof eigenesLebensmittelSchema>) {
  return prisma.eigenesLebensmittel.create({ data: { ...daten, userId } });
}

/**
 * Löschen immer per (id, userId) — ein fremder oder erfundener Eintrag
 * liefert false statt ihn zu löschen.
 */
export async function loescheFitnessEintrag(
  userId: string,
  art: "gewicht" | "mahlzeit" | "training" | "lebensmittel",
  id: string
): Promise<boolean> {
  const where = { id, userId };
  const { count } =
    art === "gewicht"
      ? await prisma.gewichtEintrag.deleteMany({ where })
      : art === "mahlzeit"
        ? await prisma.mahlzeitEintrag.deleteMany({ where })
        : art === "training"
          ? await prisma.trainingEintrag.deleteMany({ where })
          : await prisma.eigenesLebensmittel.deleteMany({ where });
  return count > 0;
}
