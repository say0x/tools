"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";
import { BUNDESLAENDER, FINANZIERUNGSARTEN } from "@/server/calc/types";

const grunderwerbsteuerUpdateSchema = z.array(z.object({ id: z.string(), satzProzent: z.coerce.number().min(0).max(20) }));
const mietpreisUpdateSchema = z.array(z.object({ id: z.string(), mietpreisProM2: z.coerce.number().min(0).max(1000) }));
const gewerkKostenUpdateSchema = z.array(
  z.object({ id: z.string(), kostenProM2Min: z.coerce.number().min(0).max(10_000), kostenProM2Max: z.coerce.number().min(0).max(10_000) })
);
const kaufnebenkostenDefaultsSchema = z.object({
  notarProzent: z.coerce.number().min(0).max(10),
  grundbuchProzent: z.coerce.number().min(0).max(10),
});
const kaufpreisfaktorUpdateSchema = z.array(z.object({ id: z.string(), kaufpreisfaktorReferenz: z.coerce.number().min(0).max(200) }));
const nutzungsdauerUpdateSchema = z.array(z.object({ id: z.string(), nutzungsdauerJahre: z.coerce.number().int().min(1).max(200) }));
const standardwerteSchema = z.object({
  standardBundesland: z.enum(BUNDESLAENDER).nullable(),
  standardZinssatzProzent: z.coerce.number().min(0).max(20).nullable(),
  standardTilgungProzent: z.coerce.number().min(0).max(20).nullable(),
  standardZinsbindungJahre: z.coerce.number().int().min(1).max(50).nullable(),
  standardFinanzierungsart: z.enum(FINANZIERUNGSARTEN).nullable(),
  standardMietsteigerungProzent: z.coerce.number().min(-20).max(50).nullable(),
  standardWertsteigerungProzent: z.coerce.number().min(-20).max(50).nullable(),
  standardKostensteigerungProzent: z.coerce.number().min(-20).max(50).nullable(),
  standardLeerstandsquoteProzent: z.coerce.number().min(0).max(100).nullable(),
  standardAnschlusszinsAufschlagProzent: z.coerce.number().min(-10).max(10).nullable(),
});

export async function aktualisiereGrunderwerbsteuer(updates: z.infer<typeof grunderwerbsteuerUpdateSchema>) {
  const data = grunderwerbsteuerUpdateSchema.parse(updates);
  await prisma.$transaction(
    data.map((u) => prisma.referenceGrunderwerbsteuer.update({ where: { id: u.id }, data: { satzProzent: u.satzProzent } }))
  );
  revalidatePath("/immobilien/referenzdaten");
}

export async function aktualisiereMietpreise(updates: z.infer<typeof mietpreisUpdateSchema>) {
  const data = mietpreisUpdateSchema.parse(updates);
  await prisma.$transaction(
    data.map((u) => prisma.referenceMietpreis.update({ where: { id: u.id }, data: { mietpreisProM2: u.mietpreisProM2 } }))
  );
  revalidatePath("/immobilien/referenzdaten");
}

export async function aktualisiereGewerkKosten(updates: z.infer<typeof gewerkKostenUpdateSchema>) {
  const data = gewerkKostenUpdateSchema.parse(updates);
  await prisma.$transaction(
    data.map((u) =>
      prisma.referenceGewerkKosten.update({
        where: { id: u.id },
        data: { kostenProM2Min: u.kostenProM2Min, kostenProM2Max: u.kostenProM2Max },
      })
    )
  );
  revalidatePath("/immobilien/referenzdaten");
}

export async function aktualisiereKaufnebenkostenDefaults(values: z.infer<typeof kaufnebenkostenDefaultsSchema>) {
  const data = kaufnebenkostenDefaultsSchema.parse(values);
  const bestehend = await prisma.referenceKaufnebenkostenDefaults.findFirst();
  if (bestehend) {
    await prisma.referenceKaufnebenkostenDefaults.update({ where: { id: bestehend.id }, data });
  } else {
    await prisma.referenceKaufnebenkostenDefaults.create({ data });
  }
  revalidatePath("/immobilien/referenzdaten");
}

export async function aktualisiereKaufpreisfaktoren(updates: z.infer<typeof kaufpreisfaktorUpdateSchema>) {
  const data = kaufpreisfaktorUpdateSchema.parse(updates);
  await prisma.$transaction(
    data.map((u) =>
      prisma.referenceKaufpreisfaktor.update({ where: { id: u.id }, data: { kaufpreisfaktorReferenz: u.kaufpreisfaktorReferenz } })
    )
  );
  revalidatePath("/immobilien/referenzdaten");
}

export async function aktualisiereNutzungsdauer(updates: z.infer<typeof nutzungsdauerUpdateSchema>) {
  const data = nutzungsdauerUpdateSchema.parse(updates);
  await prisma.$transaction(
    data.map((u) => prisma.referenceNutzungsdauer.update({ where: { id: u.id }, data: { nutzungsdauerJahre: u.nutzungsdauerJahre } }))
  );
  revalidatePath("/immobilien/referenzdaten");
}

export async function aktualisiereStandardwerte(values: z.infer<typeof standardwerteSchema>) {
  const data = standardwerteSchema.parse(values);
  const bestehend = await prisma.referenceKaufnebenkostenDefaults.findFirst();
  if (bestehend) {
    await prisma.referenceKaufnebenkostenDefaults.update({ where: { id: bestehend.id }, data });
  } else {
    await prisma.referenceKaufnebenkostenDefaults.create({ data: { notarProzent: 1.0, grundbuchProzent: 0.5, ...data } });
  }
  revalidatePath("/immobilien/referenzdaten");
  revalidatePath("/immobilien/objekte/neu");
}
