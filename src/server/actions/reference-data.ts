"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/server/db";

const grunderwerbsteuerUpdateSchema = z.array(z.object({ id: z.string(), satzProzent: z.coerce.number().min(0).max(100) }));
const mietpreisUpdateSchema = z.array(z.object({ id: z.string(), mietpreisProM2: z.coerce.number().min(0) }));
const gewerkKostenUpdateSchema = z.array(
  z.object({ id: z.string(), kostenProM2Min: z.coerce.number().min(0), kostenProM2Max: z.coerce.number().min(0) })
);

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
