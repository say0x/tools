"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getActiveUserId } from "@/server/session";
import { erstelleApiTokenFuerUser, widerrufeApiTokenFuerUser } from "@/server/data/api-token";
import { ausfuehren, type ActionResult } from "./result";

const tokenSchema = z.object({
  name: z.string().trim().min(1, "Bitte einen Namen vergeben, z. B. „Home Assistant“").max(100, "Name ist zu lang (max. 100 Zeichen)"),
  schreibzugriff: z.boolean(),
});

/** Liefert den Klartext genau einmal zurück — danach ist er nicht mehr abrufbar. */
export async function erstelleApiToken(werte: unknown): Promise<ActionResult<{ klartext: string; praefix: string }>> {
  return ausfuehren(async () => {
    const result = tokenSchema.safeParse(werte);
    if (!result.success) throw new Error(result.error.issues.map((i) => i.message).join(" · "));
    const token = await erstelleApiTokenFuerUser(await getActiveUserId(), result.data.name, result.data.schreibzugriff);
    revalidatePath("/integrationen");
    return { klartext: token.klartext, praefix: token.praefix };
  });
}

export async function widerrufeApiToken(id: string): Promise<ActionResult> {
  return ausfuehren(async () => {
    if (typeof id !== "string" || !id) throw new Error("Ungültige Token-ID.");
    const ok = await widerrufeApiTokenFuerUser(await getActiveUserId(), id);
    if (!ok) throw new Error("Token nicht gefunden (bereits widerrufen?).");
    revalidatePath("/integrationen");
  });
}
