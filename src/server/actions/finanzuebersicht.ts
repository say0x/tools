"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { finanzuebersichtSchema, type FinanzuebersichtFormValues } from "./finanzuebersicht-schema";

export type { FinanzuebersichtFormValues, SparpositionArt, SparpositionFormValues } from "./finanzuebersicht-schema";

export async function ladeSparpositionen() {
  const [wertpapiere, tagesgeld] = await Promise.all([
    prisma.wertpapierposition.findMany({ include: { asset: true }, orderBy: { createdAt: "asc" } }),
    prisma.tagesgeldkonto.findMany({ include: { asset: true }, orderBy: { createdAt: "asc" } }),
  ]);
  return { wertpapiere, tagesgeld };
}

/**
 * Speichert Gehalt/Inflation-Annahmen (Teil des UserProfile-Singletons) und
 * die komplette Liste der Sparpositionen in einem Rutsch. Die Positionen
 * werden dabei komplett ersetzt (löschen + neu anlegen) statt einzeln
 * diffed — bewusst einfach gehalten wie schon beim "Bestehende Kredite"-Feld
 * im Profil, weil außer dieser Seite nichts auf einzelne Positions-IDs
 * verweist.
 */
export async function speichereFinanzuebersicht(values: FinanzuebersichtFormValues) {
  const result = finanzuebersichtSchema.safeParse(values);
  if (!result.success) {
    const meldung = result.error.issues.map((issue) => issue.message).join(" · ");
    throw new Error(`Ungültige Eingabe: ${meldung}`);
  }
  const data = result.data;

  await prisma.$transaction(async (tx) => {
    const bestehend = await tx.userProfile.findFirst();
    const profileData = {
      bruttoEinkommenMonatlich: data.bruttoEinkommenMonatlich,
      gehaltssteigerungProzentJaehrlich: data.gehaltssteigerungProzentJaehrlich,
      inflationProzentJaehrlich: data.inflationProzentJaehrlich,
    };
    if (bestehend) {
      await tx.userProfile.update({ where: { id: bestehend.id }, data: profileData });
    } else {
      await tx.userProfile.create({ data: profileData });
    }

    await tx.asset.deleteMany({ where: { type: { in: ["WERTPAPIERDEPOT", "TAGESGELD"] } } });
    for (const position of data.sparpositionen) {
      if (position.art === "WERTPAPIERDEPOT") {
        await tx.wertpapierposition.create({
          data: {
            betrag: position.betrag,
            renditeProzentJaehrlich: position.renditeProzentJaehrlich,
            sparplanBetragMonatlich: position.sparplanBetragMonatlich,
            sparplanSteigerungProzentJaehrlich: position.sparplanSteigerungProzentJaehrlich,
            asset: { create: { type: "WERTPAPIERDEPOT", name: position.name } },
          },
        });
      } else {
        await tx.tagesgeldkonto.create({
          data: {
            betrag: position.betrag,
            zinsProzentJaehrlich: position.renditeProzentJaehrlich,
            sparplanBetragMonatlich: position.sparplanBetragMonatlich,
            sparplanSteigerungProzentJaehrlich: position.sparplanSteigerungProzentJaehrlich,
            asset: { create: { type: "TAGESGELD", name: position.name } },
          },
        });
      }
    }
  });

  revalidatePath("/finanzuebersicht");
}
