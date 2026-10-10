import { apiRoute, datumParameter, jsonAntwort, leseJson, validiere } from "@/server/api/handler";
import { eineStelle } from "@/server/api/dto";
import { gewichtSchema } from "@/server/actions/fitness-schema";
import { addiereTage } from "@/server/calc/fitness/datum";
import { ladeGewichtsverlauf, speichereGewichtFuerUser } from "@/server/data/fitness";

export const dynamic = "force-dynamic";

/** Messungen im Zeitraum (?von, ?bis; Default letzte 90 Tage) plus Trend/Prognose über alle Messungen. */
export const GET = apiRoute({}, async (k, request) => {
  const bis = datumParameter(request, "bis", k.heute);
  const von = datumParameter(request, "von", addiereTage(bis, -89));
  const v = await ladeGewichtsverlauf(k.userId, bis);
  return jsonAntwort({
    von,
    bis,
    eintraege: v.eintraege
      .filter((e) => e.datum >= von && e.datum <= bis)
      .map((e) => ({ id: e.id, datum: e.datum, gewichtKg: e.gewichtKg, koerperfettProzent: e.koerperfettProzent, notiz: e.notiz, quelle: e.quelle })),
    statistik: {
      aktuellKg: v.aktuellKg,
      geglaettet7TageKg: v.aktuellGeglaettetKg == null ? null : eineStelle(v.aktuellGeglaettetKg),
      veraenderung7TageKg: v.veraenderung7TageKg == null ? null : eineStelle(v.veraenderung7TageKg),
      veraenderung30TageKg: v.veraenderung30TageKg == null ? null : eineStelle(v.veraenderung30TageKg),
      trendKgProWoche: v.trendKgProWoche == null ? null : Math.round(v.trendKgProWoche * 100) / 100,
      prognose: v.prognose,
    },
  });
});

/** Gewicht für einen Tag speichern (Upsert je Tag, z. B. von einer Smart-Waage). datum optional (Default heute). */
export const POST = apiRoute({ schreiben: true }, async (k, request) => {
  const body = (await leseJson(request)) as Record<string, unknown>;
  const daten = validiere(gewichtSchema, { datum: k.heute, ...body });
  return jsonAntwort(await speichereGewichtFuerUser(k.userId, daten, "API"), 201);
});
