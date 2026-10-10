"use server";

import { getActiveUserId } from "@/server/session";
import { analysiereMahlzeitBild, type MahlzeitAnalyse } from "@/server/ki/mahlzeit-analyse";
import { ausfuehren, type ActionResult } from "./result";

/**
 * Analysiert ein Mahlzeitenfoto per Claude API und liefert eine Schätzung zur
 * Kontrolle zurück — gespeichert wird hier NICHTS; der Nutzer übernimmt die
 * (ggf. korrigierten) Positionen anschließend über erstelleMahlzeiten().
 */
export async function analysiereMahlzeitFoto(eingabe: { dataUrl: string; hinweis?: string }): Promise<ActionResult<MahlzeitAnalyse>> {
  return ausfuehren(async () => {
    await getActiveUserId();
    if (typeof eingabe?.dataUrl !== "string") throw new Error("Kein Bild übergeben.");
    return analysiereMahlzeitBild({ dataUrl: eingabe.dataUrl, hinweis: typeof eingabe.hinweis === "string" ? eingabe.hinweis : undefined });
  });
}
