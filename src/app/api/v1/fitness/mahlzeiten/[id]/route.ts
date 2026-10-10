import { ApiFehler, apiRoute } from "@/server/api/handler";
import { loescheFitnessEintrag } from "@/server/data/fitness";

export const dynamic = "force-dynamic";

export const DELETE = apiRoute({ schreiben: true }, async (k, _request, params) => {
  if (!(await loescheFitnessEintrag(k.userId, "mahlzeit", params.id))) throw new ApiFehler(404, "NICHT_GEFUNDEN", "Eintrag nicht gefunden.");
  return new Response(null, { status: 204 });
});
