"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { getActiveUserId } from "@/server/session";
import { finanzuebersichtSchema, type FinanzuebersichtFormValues } from "./finanzuebersicht-schema";
import { ausfuehren, type ActionResult } from "./result";

export type { FinanzuebersichtFormValues, SparpositionFormValues } from "./finanzuebersicht-schema";

export async function ladeSparpositionen() {
  const userId = await getActiveUserId();
  const [wertpapiere, tagesgeld] = await Promise.all([
    prisma.wertpapierposition.findMany({ where: { asset: { userId } }, include: { asset: true }, orderBy: { createdAt: "asc" } }),
    prisma.tagesgeldkonto.findMany({ where: { asset: { userId } }, include: { asset: true }, orderBy: { createdAt: "asc" } }),
  ]);
  return { wertpapiere, tagesgeld };
}

/**
 * Speichert Gehalt/Inflation-Annahmen (Teil des UserProfile-Singletons) und
 * die komplette Liste der Sparpositionen in einem Rutsch. Positionen mit
 * bekannter assetId werden aktualisiert, neue (ohne assetId) angelegt, im
 * Formular entfernte gelöscht — kein Löschen+Neuanlegen aller Positionen bei
 * jedem Speichern mehr. Das war früher bewusst einfach gehalten, hat aber
 * unbeabsichtigt Szenario-Änderungen mitgerissen: SzenarioAenderung.assetId
 * (Cascade-Delete) verweist bei SPARRATE_AENDERN auf genau diese Assets, die
 * bei jedem Finanzübersicht-Speichern — auch nur für eine Gehaltsänderung —
 * neu angelegt wurden und damit ihre alte ID verloren haben.
 */
export async function speichereFinanzuebersicht(values: FinanzuebersichtFormValues): Promise<ActionResult> {
  return ausfuehren(async () => {
    const result = finanzuebersichtSchema.safeParse(values);
    if (!result.success) {
      const meldung = result.error.issues.map((issue) => issue.message).join(" · ");
      throw new Error(`Ungültige Eingabe: ${meldung}`);
    }
    const data = result.data;
    const userId = await getActiveUserId();

    await prisma.$transaction(async (tx) => {
      const bestehend = await tx.userProfile.findFirst({ where: { userId } });
      const profileData = {
        bruttoEinkommenMonatlich: data.bruttoEinkommenMonatlich,
        gehaltssteigerungProzentJaehrlich: data.gehaltssteigerungProzentJaehrlich,
        inflationProzentJaehrlich: data.inflationProzentJaehrlich,
      };
      if (bestehend) {
        await tx.userProfile.update({ where: { id: bestehend.id }, data: profileData });
      } else {
        await tx.userProfile.create({ data: { ...profileData, userId } });
      }

      const bestehendeAssets = await tx.asset.findMany({
        where: { userId, type: { in: ["WERTPAPIERDEPOT", "TAGESGELD"] } },
        select: { id: true, type: true },
      });
      const bestehendeAssetsById = new Map(bestehendeAssets.map((a) => [a.id, a]));
      const uebernommeneIds = new Set<string>();

      for (const position of data.sparpositionen) {
        const vorhandenesAsset = position.assetId ? bestehendeAssetsById.get(position.assetId) : undefined;

        if (!vorhandenesAsset) {
          if (position.art === "WERTPAPIERDEPOT") {
            await tx.wertpapierposition.create({
              data: {
                betrag: position.betrag,
                renditeProzentJaehrlich: position.renditeProzentJaehrlich,
                sparplanBetragMonatlich: position.sparplanBetragMonatlich,
                sparplanSteigerungProzentJaehrlich: position.sparplanSteigerungProzentJaehrlich,
                asset: { create: { type: "WERTPAPIERDEPOT", name: position.name, besitzstatus: position.besitzstatus, userId } },
              },
            });
          } else {
            await tx.tagesgeldkonto.create({
              data: {
                betrag: position.betrag,
                zinsProzentJaehrlich: position.renditeProzentJaehrlich,
                sparplanBetragMonatlich: position.sparplanBetragMonatlich,
                sparplanSteigerungProzentJaehrlich: position.sparplanSteigerungProzentJaehrlich,
                asset: { create: { type: "TAGESGELD", name: position.name, besitzstatus: position.besitzstatus, userId } },
              },
            });
          }
          continue;
        }

        uebernommeneIds.add(vorhandenesAsset.id);
        await tx.asset.update({
          where: { id: vorhandenesAsset.id },
          data: { name: position.name, besitzstatus: position.besitzstatus, type: position.art },
        });

        // Art gewechselt (z. B. Wertpapierdepot -> Tagesgeld): alte Detailzeile entfernen, unten neu anlegen.
        if (vorhandenesAsset.type !== position.art) {
          if (vorhandenesAsset.type === "WERTPAPIERDEPOT") {
            await tx.wertpapierposition.delete({ where: { assetId: vorhandenesAsset.id } });
          } else {
            await tx.tagesgeldkonto.delete({ where: { assetId: vorhandenesAsset.id } });
          }
        }

        if (position.art === "WERTPAPIERDEPOT") {
          await tx.wertpapierposition.upsert({
            where: { assetId: vorhandenesAsset.id },
            create: {
              assetId: vorhandenesAsset.id,
              betrag: position.betrag,
              renditeProzentJaehrlich: position.renditeProzentJaehrlich,
              sparplanBetragMonatlich: position.sparplanBetragMonatlich,
              sparplanSteigerungProzentJaehrlich: position.sparplanSteigerungProzentJaehrlich,
            },
            update: {
              betrag: position.betrag,
              renditeProzentJaehrlich: position.renditeProzentJaehrlich,
              sparplanBetragMonatlich: position.sparplanBetragMonatlich,
              sparplanSteigerungProzentJaehrlich: position.sparplanSteigerungProzentJaehrlich,
            },
          });
        } else {
          await tx.tagesgeldkonto.upsert({
            where: { assetId: vorhandenesAsset.id },
            create: {
              assetId: vorhandenesAsset.id,
              betrag: position.betrag,
              zinsProzentJaehrlich: position.renditeProzentJaehrlich,
              sparplanBetragMonatlich: position.sparplanBetragMonatlich,
              sparplanSteigerungProzentJaehrlich: position.sparplanSteigerungProzentJaehrlich,
            },
            update: {
              betrag: position.betrag,
              zinsProzentJaehrlich: position.renditeProzentJaehrlich,
              sparplanBetragMonatlich: position.sparplanBetragMonatlich,
              sparplanSteigerungProzentJaehrlich: position.sparplanSteigerungProzentJaehrlich,
            },
          });
        }
      }

      // Im Formular entfernte Positionen löschen (kaskadiert auf evtl. verweisende SzenarioAenderung).
      const zuLoeschendeIds = bestehendeAssets.map((a) => a.id).filter((id) => !uebernommeneIds.has(id));
      if (zuLoeschendeIds.length > 0) {
        await tx.asset.deleteMany({ where: { id: { in: zuLoeschendeIds }, userId } });
      }
    });

    revalidatePath("/finanzuebersicht");
  });
}
