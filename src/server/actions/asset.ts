"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { getActiveUserId } from "@/server/session";
import { BESITZSTAENDE, type Besitzstatus } from "@/lib/asset";
import { ausfuehren, type ActionResult } from "./result";

/**
 * Setzt den Besitzstatus eines Assets — funktioniert für JEDEN Asset-Typ
 * (Immobilie, Wertpapierdepot, Tagesgeld, künftig weitere), da der Status auf
 * der gemeinsamen Asset-Tabelle liegt statt in jeder Detailtabelle einzeln
 * gepflegt zu werden. Bewusst als eigene, schlanke Action getrennt von den
 * größeren Formular-Speicherfunktionen, damit ein einzelner Klick (z. B. der
 * Auswahl-Schalter in der Finanzübersicht) keine komplette Formular-Validierung
 * durchläuft.
 */
export async function setAssetBesitzstatus(assetId: string, besitzstatus: Besitzstatus): Promise<ActionResult> {
  return ausfuehren(async () => {
    if (!BESITZSTAENDE.includes(besitzstatus)) {
      throw new Error(`Ungültiger Besitzstatus: ${besitzstatus}`);
    }
    const userId = await getActiveUserId();
    const { count } = await prisma.asset.updateMany({ where: { id: assetId, userId }, data: { besitzstatus } });
    if (count === 0) throw new Error("Asset nicht gefunden.");
    revalidatePath("/finanzuebersicht");
    revalidatePath("/immobilien/objekte");
  });
}
