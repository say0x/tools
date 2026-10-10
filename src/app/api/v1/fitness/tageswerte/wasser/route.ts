import { apiRoute, jsonAntwort, leseJson, validiere } from "@/server/api/handler";
import { wasserHinzufuegenSchema } from "@/server/actions/fitness-schema";
import { addiereWasserFuerUser } from "@/server/data/fitness";

export const dynamic = "force-dynamic";

/** Wassermenge erhöhen (oder mit negativem ml korrigieren) — für "Glas getrunken"-Knöpfe. */
export const POST = apiRoute({ schreiben: true }, async (k, request) => {
  const body = (await leseJson(request)) as Record<string, unknown>;
  const { datum, ml } = validiere(wasserHinzufuegenSchema, { datum: k.heute, ...body });
  return jsonAntwort(await addiereWasserFuerUser(k.userId, datum, ml));
});
