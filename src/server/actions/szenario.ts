"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { szenarioSchema, type SzenarioAenderungFormValues, type SzenarioFormValues } from "./szenario-schema";

export type { SzenarioAenderungTyp, SzenarioAenderungFormValues, SzenarioFormValues } from "./szenario-schema";

function parseSzenarioFormValues(values: SzenarioFormValues): SzenarioFormValues {
  const result = szenarioSchema.safeParse(values);
  if (!result.success) {
    const meldung = result.error.issues.map((issue) => issue.message).join(" · ");
    throw new Error(`Ungültige Eingabe: ${meldung}`);
  }
  return result.data;
}

function zuAenderungData(a: SzenarioAenderungFormValues) {
  return {
    typ: a.typ,
    assetId: a.assetId,
    neueSparrateMonatlich: a.neueSparrateMonatlich,
    jahrAbHeute: a.jahrAbHeute,
    bezeichnung: a.bezeichnung,
    betrag: a.betrag,
  };
}

export async function ladeSzenarien() {
  return prisma.szenario.findMany({ include: { aenderungen: true }, orderBy: { createdAt: "desc" } });
}

export async function ladeSzenario(id: string) {
  return prisma.szenario.findUnique({ where: { id }, include: { aenderungen: true } });
}

export async function erstelleSzenario(values: SzenarioFormValues) {
  const data = parseSzenarioFormValues(values);
  const created = await prisma.szenario.create({
    data: {
      name: data.name,
      startjahr: data.startjahr,
      notizen: data.notizen,
      aenderungen: { createMany: { data: data.aenderungen.map(zuAenderungData) } },
    },
  });
  revalidatePath("/szenarien");
  redirect(`/szenarien/${created.id}`);
}

export async function aktualisiereSzenario(id: string, values: SzenarioFormValues) {
  const data = parseSzenarioFormValues(values);

  await prisma.$transaction(async (tx) => {
    await tx.szenario.update({ where: { id }, data: { name: data.name, startjahr: data.startjahr, notizen: data.notizen } });
    await tx.szenarioAenderung.deleteMany({ where: { szenarioId: id } });
    if (data.aenderungen.length > 0) {
      await tx.szenarioAenderung.createMany({
        data: data.aenderungen.map((a) => ({ ...zuAenderungData(a), szenarioId: id })),
      });
    }
  });

  revalidatePath("/szenarien");
  revalidatePath(`/szenarien/${id}`);
}

export async function loescheSzenario(id: string) {
  await prisma.szenario.delete({ where: { id } });
  revalidatePath("/szenarien");
}
