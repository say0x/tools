/**
 * Importiert amtliche Bodenrichtwerte (BORIS-D/BORIS-SH) für Schleswig-
 * Holstein in ReferenceBodenrichtwert. Manuell auszuführen, NICHT Teil von
 * docker-entrypoint.sh — Bodenrichtwerte ändern sich nur alle 2 Jahre, wie
 * die übrigen Referenzdaten in prisma/seed.ts (siehe docs/deployment/docker.md).
 *
 * Aufruf: npm run import:bodenrichtwerte
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { aggregateToLagetyp, type RawBodenrichtwertRow } from "../src/server/data/bodenrichtwert-aggregation";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * PLATZHALTER — UNVERIFIZIERT. Diese Sandbox konnte geodaten.schleswig-
 * holstein.de/opendata.schleswig-holstein.de/danord.gdi-sh.de nicht per
 * WebFetch erreichen (Egress-Proxy blockiert Regierungs-Geoportale) — der
 * tatsächliche maschinenlesbare Zugriff ist NICHT verifiziert. Vor dem
 * ersten echten Einsatz (z. B. auf ct-tools mit vollem Internetzugriff)
 * MUSS geklärt werden:
 *   - konkrete Endpoint-URL (WFS? GeoJSON-Download? CSV?) unter
 *     danord.gdi-sh.de/view/VBORIS bzw. dem Schleswig-Holstein-
 *     Downloadportal (geodaten.schleswig-holstein.de)
 *   - exaktes Antwortschema/Feldnamen (Zonen-Geometrie, Wertfeld ("BRW" o.
 *     ä.), Nutzungsart-Filter, Stichtag)
 *   - wie eine Zone auf Lagetyp abgebildet wird (siehe RawBodenrichtwertRow
 *     in src/server/data/bodenrichtwert-aggregation.ts)
 *   - Attribution laut "Datenlizenz Deutschland – Namensnennung 2.0"
 * Bis dahin: NICHT für einen echten Produktionslauf verwenden. Diese
 * Funktion wirft absichtlich statt zu raten.
 */
async function fetchBorisSH(): Promise<RawBodenrichtwertRow[]> {
  throw new Error(
    "fetchBorisSH() ist unverifiziert — siehe PLATZHALTER-Kommentar in scripts/import-bodenrichtwerte.ts. " +
      "Erst gegen die echte BORIS-SH-API implementieren/verifizieren, dann diesen Fehler entfernen."
  );
}

async function main() {
  const rows = await fetchBorisSH();
  const aggregiert = aggregateToLagetyp(rows);

  for (const { lagetyp, bodenrichtwertProM2 } of aggregiert) {
    await prisma.referenceBodenrichtwert.upsert({
      where: { bundesland_lagetyp: { bundesland: "SCHLESWIG_HOLSTEIN", lagetyp } },
      update: { bodenrichtwertProM2 },
      create: { bundesland: "SCHLESWIG_HOLSTEIN", lagetyp, bodenrichtwertProM2 },
    });
    console.log(`✓ SCHLESWIG_HOLSTEIN:${lagetyp} = ${bodenrichtwertProM2} €/m²`);
  }

  console.log(`\nFertig: ${aggregiert.length} Lagetyp(en) aktualisiert.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
