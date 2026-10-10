import { jsonAntwort } from "@/server/api/handler";
import { erzeugeOpenApiSpezifikation } from "@/server/api/openapi";

export const dynamic = "force-dynamic";

/** Öffentlich: enthält nur die Schnittstellenbeschreibung, keine Daten. */
export function GET() {
  return jsonAntwort(erzeugeOpenApiSpezifikation());
}
