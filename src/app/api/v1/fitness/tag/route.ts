import { apiRoute, datumParameter, jsonAntwort } from "@/server/api/handler";
import { fitnessTagDto } from "@/server/api/dto";
import { ladeFitnessTag } from "@/server/data/fitness";

export const dynamic = "force-dynamic";

/** Tagesübersicht: Ziele, Zufuhr, Training, Budget, Tageswerte, Einträge. ?datum=JJJJ-MM-TT (Default heute). */
export const GET = apiRoute({}, async (k, request) => {
  const datum = datumParameter(request, "datum", k.heute);
  return jsonAntwort(fitnessTagDto(await ladeFitnessTag(k.userId, datum)));
});
