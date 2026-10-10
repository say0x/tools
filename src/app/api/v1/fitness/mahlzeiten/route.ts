import { ApiFehler, apiRoute, datumParameter, jsonAntwort, leseJson, validiere } from "@/server/api/handler";
import { mahlzeitDto } from "@/server/api/dto";
import { mahlzeitSchema } from "@/server/actions/fitness-schema";
import { tageZwischen } from "@/server/calc/fitness/datum";
import { erstelleMahlzeitenFuerUser, ladeMahlzeiten } from "@/server/data/fitness";

export const dynamic = "force-dynamic";

/** Einträge eines Tages (?datum) oder Zeitraums (?von&bis, max. 366 Tage). */
export const GET = apiRoute({}, async (k, request) => {
  const datum = datumParameter(request, "datum", k.heute);
  const von = datumParameter(request, "von", datum);
  const bis = datumParameter(request, "bis", request.nextUrl.searchParams.has("von") ? k.heute : datum);
  if (von > bis || tageZwischen(von, bis) > 365) throw new ApiFehler(400, "UNGUELTIGE_ANFRAGE", "Zeitraum ungültig (von ≤ bis, max. 366 Tage).");
  const eintraege = await ladeMahlzeiten(k.userId, von, bis);
  return jsonAntwort({ von, bis, eintraege: eintraege.map(mahlzeitDto) });
});

/** Ein Eintrag (Objekt) oder mehrere (Array, max. 50). datum optional (Default heute), quelle Default "API". */
export const POST = apiRoute({ schreiben: true }, async (k, request) => {
  const body = await leseJson(request, 256 * 1024);
  const liste = Array.isArray(body) ? body : [body];
  if (liste.length === 0 || liste.length > 50) throw new ApiFehler(400, "UNGUELTIGE_ANFRAGE", "1 bis 50 Einträge pro Anfrage.");
  const daten = liste.map((e, i) => {
    try {
      return validiere(mahlzeitSchema, { datum: k.heute, quelle: "API", ...(e as Record<string, unknown>) });
    } catch (fehler) {
      if (fehler instanceof ApiFehler && Array.isArray(body)) {
        throw new ApiFehler(422, "VALIDIERUNG", "Eingabe ungültig.", fehler.details?.map((d) => ({ ...d, feld: `[${i}].${d.feld}` })));
      }
      throw fehler;
    }
  });
  const angelegt = await erstelleMahlzeitenFuerUser(k.userId, daten);
  return jsonAntwort({ eintraege: angelegt.map(mahlzeitDto) }, 201);
});
