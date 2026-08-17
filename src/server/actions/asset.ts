"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { BESITZSTAENDE, type Besitzstatus } from "@/lib/asset";

/**
 * Setzt den Besitzstatus eines Assets — funktioniert für JEDEN Asset-Typ
 * (Immobilie, Wertpapierdepot, Tagesgeld, künftig weitere), da der Status auf
 * der gemeinsamen Asset-Tabelle liegt statt in jeder Detailtabelle einzeln
 * gepflegt zu werden. Bewusst als eigene, schlanke Action getrennt von den
 * größeren Formular-Speicherfunktionen, damit ein einzelner Klick (z. B. der
 * Auswahl-Schalter in der Finanzübersicht) keine komplette Formular-Validierung
 * durchläuft.
 */
export async function setAssetBesitzstatus(assetId: string, besitzstatus: Besitzstatus) {
  if (!BESITZSTAENDE.includes(besitzstatus)) {
    throw new Error(`Ungültiger Besitzstatus: ${besitzstatus}`);
  }
  await prisma.asset.update({ where: { id: assetId }, data: { besitzstatus } });
  revalidatePath("/finanzuebersicht");
  revalidatePath("/immobilien/objekte");
}
