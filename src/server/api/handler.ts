import type { NextRequest } from "next/server";
import type { z } from "zod";
import { heuteIso, istIsoDatum } from "@/server/calc/fitness/datum";
import { loeseApiTokenAuf, type TokenKontext } from "@/server/data/api-token";
import { extrahiereBearerToken } from "./token";

/**
 * Gemeinsamer Rahmen aller /api/v1-Routen (ADR-0011): Token-Auth,
 * Schreibrecht-Prüfung, JSON-Parsing, Zod-Validierung und ein einheitliches
 * Fehlerformat `{ fehler: { code, nachricht, details? } }`. Antworten werden
 * nie gecacht. Referenz: docs/api/README.md
 */

export const FEHLER_CODES = [
  "NICHT_AUTHENTIFIZIERT",
  "KEIN_SCHREIBZUGRIFF",
  "NICHT_GEFUNDEN",
  "UNGUELTIGE_ANFRAGE",
  "VALIDIERUNG",
  "ZU_GROSS",
  "NICHT_KONFIGURIERT",
  "LIMIT_ERREICHT",
  "EXTERNER_DIENST",
  "SERVERFEHLER",
] as const;
export type FehlerCode = (typeof FEHLER_CODES)[number];

export class ApiFehler extends Error {
  constructor(
    readonly status: number,
    readonly code: FehlerCode,
    nachricht: string,
    readonly details?: { feld: string; nachricht: string }[]
  ) {
    super(nachricht);
  }
}

const KEIN_CACHE = { "Cache-Control": "no-store" };

export function jsonAntwort(daten: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return Response.json(daten, { status, headers: { ...KEIN_CACHE, ...extraHeaders } });
}

function fehlerAntwort(fehler: ApiFehler): Response {
  const headers: Record<string, string> = fehler.status === 401 ? { "WWW-Authenticate": 'Bearer realm="tools"' } : {};
  return jsonAntwort({ fehler: { code: fehler.code, nachricht: fehler.message, ...(fehler.details ? { details: fehler.details } : {}) } }, fehler.status, headers);
}

export interface ApiKontext extends TokenKontext {
  /** Heutiges Datum in Europe/Berlin — Default für datum-Parameter. */
  heute: string;
}

type RouteKontext = { params: Promise<Record<string, string>> };

/**
 * Umhüllt einen Route-Handler. `schreiben: true` verlangt ein Token mit
 * Schreibzugriff (für POST/PUT/DELETE).
 */
export function apiRoute(
  optionen: { schreiben?: boolean },
  handler: (kontext: ApiKontext, request: NextRequest, params: Record<string, string>) => Promise<Response>
) {
  return async (request: NextRequest, routeKontext: RouteKontext): Promise<Response> => {
    try {
      const klartext = extrahiereBearerToken(request.headers.get("authorization"));
      if (!klartext) throw new ApiFehler(401, "NICHT_AUTHENTIFIZIERT", "Header 'Authorization: Bearer <Token>' fehlt oder ist ungültig. Token unter /integrationen erstellen.");
      const token = await loeseApiTokenAuf(klartext);
      if (!token) throw new ApiFehler(401, "NICHT_AUTHENTIFIZIERT", "Unbekanntes oder widerrufenes Token.");
      if (optionen.schreiben && !token.schreibzugriff) {
        throw new ApiFehler(403, "KEIN_SCHREIBZUGRIFF", "Dieses Token ist nur zum Lesen berechtigt.");
      }
      const params = (await routeKontext?.params) ?? {};
      return await handler({ ...token, heute: heuteIso() }, request, params);
    } catch (error) {
      if (error instanceof ApiFehler) return fehlerAntwort(error);
      console.error("[api]", request.method, request.nextUrl.pathname, error);
      return fehlerAntwort(new ApiFehler(500, "SERVERFEHLER", "Interner Fehler — Details im Server-Log."));
    }
  };
}

/** Liest einen JSON-Body mit Größenlimit (Default 64 KB, Foto-Upload setzt mehr). */
export async function leseJson(request: NextRequest, maxBytes = 64 * 1024): Promise<unknown> {
  const laenge = Number(request.headers.get("content-length") ?? 0);
  if (laenge > maxBytes) throw new ApiFehler(413, "ZU_GROSS", `Anfrage zu groß (max. ${Math.round(maxBytes / 1024)} KB).`);
  const typ = request.headers.get("content-type") ?? "";
  if (!typ.toLowerCase().includes("application/json")) {
    throw new ApiFehler(400, "UNGUELTIGE_ANFRAGE", "Content-Type muss application/json sein.");
  }
  const text = await request.text();
  if (text.length > maxBytes) throw new ApiFehler(413, "ZU_GROSS", `Anfrage zu groß (max. ${Math.round(maxBytes / 1024)} KB).`);
  try {
    return text.trim() === "" ? {} : JSON.parse(text);
  } catch {
    throw new ApiFehler(400, "UNGUELTIGE_ANFRAGE", "Body ist kein gültiges JSON.");
  }
}

export function validiere<S extends z.ZodType>(schema: S, daten: unknown): z.output<S> {
  const result = schema.safeParse(daten);
  if (!result.success) {
    throw new ApiFehler(
      422,
      "VALIDIERUNG",
      "Eingabe ungültig.",
      result.error.issues.map((i) => ({ feld: i.path.join(".") || "(body)", nachricht: i.message }))
    );
  }
  return result.data;
}

/** Datums-Query-Parameter (JJJJ-MM-TT) mit Default; ungültige Werte → 400. */
export function datumParameter(request: NextRequest, name: string, standard: string): string {
  const wert = request.nextUrl.searchParams.get(name);
  if (wert == null || wert === "") return standard;
  if (!istIsoDatum(wert)) throw new ApiFehler(400, "UNGUELTIGE_ANFRAGE", `Parameter '${name}' muss ein Datum JJJJ-MM-TT sein.`);
  return wert;
}

export function ganzzahlParameter(request: NextRequest, name: string, standard: number, min: number, max: number): number {
  const wert = request.nextUrl.searchParams.get(name);
  if (wert == null || wert === "") return standard;
  const n = Number(wert);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new ApiFehler(400, "UNGUELTIGE_ANFRAGE", `Parameter '${name}' muss eine ganze Zahl zwischen ${min} und ${max} sein.`);
  }
  return n;
}
