import { apiRoute, datumParameter, jsonAntwort, leseJson, validiere } from "@/server/api/handler";
import { tagesAktivitaetSchema } from "@/server/actions/fitness-schema";
import { aktualisiereTagesAktivitaetFuerUser, ladeFitnessTag } from "@/server/data/fitness";

export const dynamic = "force-dynamic";

/** Schritte, Wasser, Schlaf, Ruhepuls eines Tages (?datum, Default heute). */
export const GET = apiRoute({}, async (k, request) => {
  const datum = datumParameter(request, "datum", k.heute);
  const tag = await ladeFitnessTag(k.userId, datum);
  return jsonAntwort({
    datum,
    schritte: tag.aktivitaet?.schritte ?? null,
    wasserMl: tag.aktivitaet?.wasserMl ?? null,
    schlafStunden: tag.aktivitaet?.schlafStunden ?? null,
    ruhepuls: tag.aktivitaet?.ruhepuls ?? null,
  });
});

/** Teil-Update: nur gesendete Felder ändern sich, null löscht einen Wert. datum optional (Default heute). */
export const PUT = apiRoute({ schreiben: true }, async (k, request) => {
  const body = (await leseJson(request)) as Record<string, unknown>;
  const daten = validiere(tagesAktivitaetSchema, { datum: k.heute, ...body });
  return jsonAntwort(await aktualisiereTagesAktivitaetFuerUser(k.userId, daten));
});
