import { apiRoute, jsonAntwort } from "@/server/api/handler";
import { baueHomeAssistantSensoren } from "@/server/api/home-assistant";
import { ladeDashboardKennzahlen } from "@/server/data/dashboard-kennzahlen";
import { ladeFitnessTag, ladeFitnessZeitraum, ladeGewichtsverlauf } from "@/server/data/fitness";

export const dynamic = "force-dynamic";

/** Alle Sensorwerte für Home Assistant in einer Antwort — siehe docs/integrations/home-assistant.md. */
export const GET = apiRoute({}, async (k) => {
  const [tag, woche, gewicht, finanzen] = await Promise.all([
    ladeFitnessTag(k.userId, k.heute),
    ladeFitnessZeitraum(k.userId, k.heute, 7),
    ladeGewichtsverlauf(k.userId, k.heute),
    ladeDashboardKennzahlen(k.userId),
  ]);
  return jsonAntwort(baueHomeAssistantSensoren({ zeitpunkt: new Date(), tag, woche, gewicht, finanzen }));
});
