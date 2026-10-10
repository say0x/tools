import { prisma } from "@/server/db";
import { jsonAntwort } from "@/server/api/handler";
import { kiAnalyseKonfiguriert } from "@/server/ki/mahlzeit-analyse";
import { PLATTFORM_VERSION } from "@/lib/version";

export const dynamic = "force-dynamic";

/**
 * Öffentlicher Health-Check (ohne Token, ohne Nutzerdaten) — für Docker-
 * Healthcheck, Uptime-Monitoring und einen "tools online"-Sensor in Home
 * Assistant. 503, wenn die Datenbank nicht erreichbar ist.
 */
export async function GET() {
  let datenbank: "ok" | "nicht_erreichbar" = "ok";
  try {
    await prisma.user.findFirst({ select: { id: true } });
  } catch (error) {
    console.error("[api] status: Datenbank nicht erreichbar", error);
    datenbank = "nicht_erreichbar";
  }
  return jsonAntwort(
    {
      status: datenbank === "ok" ? "ok" : "gestoert",
      version: PLATTFORM_VERSION,
      apiVersion: "v1",
      zeit: new Date().toISOString(),
      datenbank,
      funktionen: { kiFotoAnalyse: kiAnalyseKonfiguriert() },
    },
    datenbank === "ok" ? 200 : 503
  );
}
