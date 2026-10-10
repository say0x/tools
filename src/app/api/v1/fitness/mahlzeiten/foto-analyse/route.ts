import { ApiFehler, apiRoute, jsonAntwort, leseJson, validiere } from "@/server/api/handler";
import { mahlzeitDto } from "@/server/api/dto";
import { fotoAnalyseSchema } from "@/server/api/schemas";
import { mahlzeitSchema } from "@/server/actions/fitness-schema";
import { erstelleMahlzeitenFuerUser } from "@/server/data/fitness";
import { analysiereMahlzeitBild, KiAnalyseFehler } from "@/server/ki/mahlzeit-analyse";

export const dynamic = "force-dynamic";

const STATUS_JE_ART = { NICHT_KONFIGURIERT: 503, BILD_UNGUELTIG: 422, LIMIT: 429, API: 502 } as const;
const CODE_JE_ART = { NICHT_KONFIGURIERT: "NICHT_KONFIGURIERT", BILD_UNGUELTIG: "VALIDIERUNG", LIMIT: "LIMIT_ERREICHT", API: "EXTERNER_DIENST" } as const;

/**
 * Foto einer Mahlzeit analysieren (Claude Vision, ADR-0010) — z. B. aus einem
 * iOS-Kurzbefehl. Mit speichern=true werden alle erkannten Positionen sofort
 * als Einträge (quelle FOTO_KI) angelegt; sonst nur die Schätzung zurückgegeben.
 */
export const POST = apiRoute({ schreiben: true }, async (k, request) => {
  const eingabe = validiere(fotoAnalyseSchema,await leseJson(request, 8 * 1024 * 1024));
  const dataUrl = eingabe.bild.startsWith("data:") ? eingabe.bild : `data:${eingabe.mediaType ?? "image/jpeg"};base64,${eingabe.bild}`;

  let analyse;
  try {
    analyse = await analysiereMahlzeitBild({ dataUrl, hinweis: eingabe.hinweis });
  } catch (fehler) {
    if (fehler instanceof KiAnalyseFehler) throw new ApiFehler(STATUS_JE_ART[fehler.art], CODE_JE_ART[fehler.art], fehler.message);
    throw fehler;
  }

  let eintraege: ReturnType<typeof mahlzeitDto>[] = [];
  if (eingabe.speichern && analyse.erkannt && analyse.positionen.length > 0) {
    const datum = eingabe.datum ?? k.heute;
    const daten = analyse.positionen.map((p) =>
      validiere(mahlzeitSchema, { ...p, datum, mahlzeit: eingabe.mahlzeit, quelle: "FOTO_KI", kiKonfidenz: analyse.konfidenz })
    );
    eintraege = (await erstelleMahlzeitenFuerUser(k.userId, daten)).map(mahlzeitDto);
  }

  return jsonAntwort({ analyse, gespeichert: eintraege.length > 0, eintraege }, eintraege.length > 0 ? 201 : 200);
});
