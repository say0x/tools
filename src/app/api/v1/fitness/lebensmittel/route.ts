import { apiRoute, ganzzahlParameter, jsonAntwort } from "@/server/api/handler";
import { ladeLebensmittelKatalog } from "@/server/data/fitness";

export const dynamic = "force-dynamic";

/** Lebensmittel-Datenbank inkl. eigener Lebensmittel durchsuchen (?suche, ?limit 1–200, Default 50). Werte je 100 g. */
export const GET = apiRoute({}, async (k, request) => {
  const suche = (request.nextUrl.searchParams.get("suche") ?? "").trim().toLowerCase();
  const limit = ganzzahlParameter(request, "limit", 50, 1, 200);
  const katalog = await ladeLebensmittelKatalog(k.userId);
  const treffer = (suche ? katalog.filter((l) => l.bezeichnung.toLowerCase().includes(suche) || l.kategorie.toLowerCase().includes(suche)) : katalog).slice(0, limit);
  return jsonAntwort({ suche, anzahl: treffer.length, eintraege: treffer });
});
