"use server";

import { revalidatePath } from "next/cache";
import { getActiveUserId } from "@/server/session";
import { heuteIso } from "@/server/calc/fitness/datum";
import {
  addiereWasserFuerUser,
  aktualisiereTagesAktivitaetFuerUser,
  erstelleEigenesLebensmittelFuerUser,
  erstelleMahlzeitenFuerUser,
  erstelleTrainingFuerUser,
  loescheFitnessEintrag,
  speichereFitnessProfilFuerUser,
  speichereGewichtFuerUser,
} from "@/server/data/fitness";
import {
  eigenesLebensmittelSchema,
  fitnessProfilSchema,
  gewichtSchema,
  mahlzeitSchema,
  tagesAktivitaetSchema,
  trainingSchema,
  wasserHinzufuegenSchema,
  zodFehlertext,
} from "./fitness-schema";
import { ausfuehren, type ActionResult } from "./result";
import type { z } from "zod";

function parse<S extends z.ZodType>(schema: S, werte: unknown): z.output<S> {
  const result = schema.safeParse(werte);
  if (!result.success) throw new Error(`Ungültige Eingabe: ${zodFehlertext(result.error)}`);
  return result.data;
}

function aktualisiereSeiten() {
  revalidatePath("/fitness", "layout");
  revalidatePath("/");
}

export async function speichereFitnessProfil(werte: unknown): Promise<ActionResult> {
  return ausfuehren(async () => {
    const daten = parse(fitnessProfilSchema, werte);
    await speichereFitnessProfilFuerUser(await getActiveUserId(), daten, heuteIso());
    aktualisiereSeiten();
  });
}

export async function speichereGewicht(werte: unknown): Promise<ActionResult> {
  return ausfuehren(async () => {
    await speichereGewichtFuerUser(await getActiveUserId(), parse(gewichtSchema, werte));
    aktualisiereSeiten();
  });
}

/** Eine oder mehrere Mahlzeiten auf einmal (z. B. alle Positionen einer Foto-Analyse). */
export async function erstelleMahlzeiten(werte: unknown[]): Promise<ActionResult<{ anzahl: number }>> {
  return ausfuehren(async () => {
    if (!Array.isArray(werte) || werte.length === 0) throw new Error("Keine Einträge übergeben.");
    if (werte.length > 50) throw new Error("Maximal 50 Einträge auf einmal.");
    const daten = werte.map((w) => parse(mahlzeitSchema, w));
    const angelegt = await erstelleMahlzeitenFuerUser(await getActiveUserId(), daten);
    aktualisiereSeiten();
    return { anzahl: angelegt.length };
  });
}

export async function erstelleTraining(werte: unknown): Promise<ActionResult> {
  return ausfuehren(async () => {
    await erstelleTrainingFuerUser(await getActiveUserId(), parse(trainingSchema, werte));
    aktualisiereSeiten();
  });
}

export async function aktualisiereTagesAktivitaet(werte: unknown): Promise<ActionResult> {
  return ausfuehren(async () => {
    await aktualisiereTagesAktivitaetFuerUser(await getActiveUserId(), parse(tagesAktivitaetSchema, werte));
    aktualisiereSeiten();
  });
}

export async function addiereWasser(werte: unknown): Promise<ActionResult<{ wasserMl: number }>> {
  return ausfuehren(async () => {
    const { datum, ml } = parse(wasserHinzufuegenSchema, werte);
    const zeile = await addiereWasserFuerUser(await getActiveUserId(), datum, ml);
    aktualisiereSeiten();
    return { wasserMl: zeile.wasserMl ?? 0 };
  });
}

export async function erstelleEigenesLebensmittel(werte: unknown): Promise<ActionResult> {
  return ausfuehren(async () => {
    await erstelleEigenesLebensmittelFuerUser(await getActiveUserId(), parse(eigenesLebensmittelSchema, werte));
    aktualisiereSeiten();
  });
}

export async function loescheFitnessEintragAction(art: "gewicht" | "mahlzeit" | "training" | "lebensmittel", id: string): Promise<ActionResult> {
  return ausfuehren(async () => {
    if (!["gewicht", "mahlzeit", "training", "lebensmittel"].includes(art)) throw new Error("Unbekannte Eintragsart.");
    const geloescht = await loescheFitnessEintrag(await getActiveUserId(), art, id);
    if (!geloescht) throw new Error("Eintrag nicht gefunden (bereits gelöscht?).");
    aktualisiereSeiten();
  });
}
