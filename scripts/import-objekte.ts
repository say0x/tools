/**
 * Importiert recherchierte Objekte aus data/import-objekte.json in die
 * Datenbank. Idempotent: Objekte werden über `quelleUrl` (falls vorhanden)
 * oder sonst über den Namen dedupliziert — ein erneuter Lauf legt keine
 * Duplikate an, sondern überspringt bereits importierte Einträge.
 *
 * Aufruf: npm run import:objekte
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { propertySchema } from "../src/server/actions/property-schema";
import { defaultPropertyFormValues } from "../src/lib/property-form-defaults";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DATEI_PFAD = path.join(__dirname, "../data/import-objekte.json");

async function main() {
  if (!fs.existsSync(DATEI_PFAD)) {
    console.log(`Keine Import-Datei gefunden unter ${DATEI_PFAD} — nichts zu tun.`);
    return;
  }

  const rohEintraege: Record<string, unknown>[] = JSON.parse(fs.readFileSync(DATEI_PFAD, "utf-8"));
  console.log(`${rohEintraege.length} Einträge in der Import-Datei gefunden.`);

  let importiert = 0;
  let uebersprungen = 0;
  let fehlgeschlagen = 0;

  for (const roh of rohEintraege) {
    const name = String(roh.name ?? "(ohne Namen)");
    const quelleUrl = typeof roh.quelleUrl === "string" ? roh.quelleUrl : "";

    const bereitsVorhanden = quelleUrl
      ? await prisma.property.findFirst({ where: { quelleUrl }, include: { asset: true } })
      : await prisma.property.findFirst({ where: { asset: { name } }, include: { asset: true } });

    if (bereitsVorhanden) {
      console.log(`⏭  Übersprungen (bereits vorhanden): ${name}`);
      uebersprungen++;
      continue;
    }

    const werte = { ...defaultPropertyFormValues(), ...roh };
    const ergebnis = propertySchema.safeParse(werte);
    if (!ergebnis.success) {
      console.error(`✗ Fehlgeschlagen: ${name}`);
      console.error(`  ${ergebnis.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(" · ")}`);
      fehlgeschlagen++;
      continue;
    }

    const { name: assetName, financing, gewerke, exit, ...property } = ergebnis.data;
    await prisma.property.create({
      data: {
        ...property,
        asset: { create: { type: "IMMOBILIE", name: assetName } },
        financing: { create: financing },
        exit: { create: exit },
        gewerke: { createMany: { data: gewerke } },
      },
    });
    console.log(`✓ Importiert: ${name}`);
    importiert++;
  }

  console.log(`\nFertig: ${importiert} importiert, ${uebersprungen} übersprungen, ${fehlgeschlagen} fehlgeschlagen.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
