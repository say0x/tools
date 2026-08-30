"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { getActiveUserId } from "@/server/session";
import { szenarioSchema, type SzenarioAenderungFormValues, type SzenarioFormValues } from "./szenario-schema";
import { ausfuehren, type ActionResult } from "./result";

export type { SzenarioAenderungFormValues, SzenarioFormValues } from "./szenario-schema";

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
    alternativanlageRenditeProzent: a.alternativanlageRenditeProzent,
  };
}

export async function ladeSzenarien() {
  const userId = await getActiveUserId();
  return prisma.szenario.findMany({ where: { userId }, include: { aenderungen: true }, orderBy: { createdAt: "desc" } });
}

export async function ladeSzenario(id: string) {
  const userId = await getActiveUserId();
  return prisma.szenario.findFirst({ where: { id, userId }, include: { aenderungen: true } });
}

export async function erstelleSzenario(values: SzenarioFormValues): Promise<ActionResult> {
  return ausfuehren(async () => {
    const data = parseSzenarioFormValues(values);
    const userId = await getActiveUserId();
    const created = await prisma.szenario.create({
      data: {
        userId,
        name: data.name,
        startjahr: data.startjahr,
        notizen: data.notizen,
        aenderungen: { createMany: { data: data.aenderungen.map(zuAenderungData) } },
      },
    });
    revalidatePath("/szenarien");
    redirect(`/szenarien/${created.id}`);
  });
}

export async function aktualisiereSzenario(id: string, values: SzenarioFormValues): Promise<ActionResult> {
  return ausfuehren(async () => {
    const data = parseSzenarioFormValues(values);
    const userId = await getActiveUserId();

    await prisma.$transaction(async (tx) => {
      await tx.szenario.findFirstOrThrow({ where: { id, userId } });
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
  });
}

export async function loescheSzenario(id: string) {
  const userId = await getActiveUserId();
  const { count } = await prisma.szenario.deleteMany({ where: { id, userId } });
  if (count === 0) throw new Error("Szenario nicht gefunden.");
  revalidatePath("/szenarien");
}
