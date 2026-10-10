import { ApiFehler, apiRoute, datumParameter, jsonAntwort, leseJson, validiere } from "@/server/api/handler";
import { trainingDto } from "@/server/api/dto";
import { trainingSchema } from "@/server/actions/fitness-schema";
import { addiereTage, tageZwischen } from "@/server/calc/fitness/datum";
import { erstelleTrainingFuerUser, ladeTrainings } from "@/server/data/fitness";

export const dynamic = "force-dynamic";

/** Trainings im Zeitraum (?von&bis, Default letzte 30 Tage), neueste zuerst. */
export const GET = apiRoute({}, async (k, request) => {
  const bis = datumParameter(request, "bis", k.heute);
  const von = datumParameter(request, "von", addiereTage(bis, -29));
  if (von > bis || tageZwischen(von, bis) > 365) throw new ApiFehler(400, "UNGUELTIGE_ANFRAGE", "Zeitraum ungültig (von ≤ bis, max. 366 Tage).");
  return jsonAntwort({ von, bis, eintraege: (await ladeTrainings(k.userId, von, bis)).map(trainingDto) });
});

/** Training anlegen; ohne kcalOverride wird der Mehrverbrauch aus MET/Distanz geschätzt. */
export const POST = apiRoute({ schreiben: true }, async (k, request) => {
  const body = (await leseJson(request)) as Record<string, unknown>;
  const daten = validiere(trainingSchema, { datum: k.heute, ...body });
  return jsonAntwort(trainingDto(await erstelleTrainingFuerUser(k.userId, daten, "API")), 201);
});
