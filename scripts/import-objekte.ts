/**
 * Importiert recherchierte Objekte aus data/import-objekte.json in die
 * Datenbank. Idempotent: Objekte werden über `quelleUrl` (falls vorhanden)
 * oder sonst über den Namen dedupliziert — ein erneuter Lauf legt keine
 * Duplikate an, sondern überspringt bereits importierte Einträge.
 *
 * Aufruf: IMPORT_USER_ID=<id> npm run import:objekte
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { propertySchema } from "../src/server/actions/property-schema";
import { defaultPropertyFormValues } from "../src/lib/property-form-defaults";
import { splitPropertyData } from "../src/server/data/mappers";
import { ermittleDedupKriterium } from "../src/server/data/import-dedup";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DATEI_PFAD = path.join(__dirname, "../data/import-objekte.json");

async function main() {
  // Kein Request/Cookie-Kontext in einem CLI-Skript vorhanden, aus dem sich
  // (wie bei den Server Actions über getActiveUserId()) ein User ableiten
  // ließe — deshalb hier eine Pflicht-Env-Var statt eines automatischen Fallbacks.
  const userId = process.env.IMPORT_USER_ID;
  if (!userId) {
    const nutzer = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
    console.error("IMPORT_USER_ID ist nicht gesetzt. Verfügbare Test-User:");
    for (const u of nutzer) console.error(`  ${u.id}  ${u.name}`);
    console.error("Aufruf: IMPORT_USER_ID=<id> npm run import:objekte");
    process.exitCode = 1;
    return;
  }

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
    const dedupKriterium = ermittleDedupKriterium(roh);

    const bereitsVorhanden =
      "quelleUrl" in dedupKriterium
        ? await prisma.property.findFirst({
            where: { quelleUrl: dedupKriterium.quelleUrl, asset: { userId } },
            include: { asset: true },
          })
        : await prisma.property.findFirst({
            where: { asset: { name: dedupKriterium.name, userId } },
            include: { asset: true },
          });

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

    const { name: assetName, besitzstatus, property, financing, gewerke, exit } = splitPropertyData(ergebnis.data);
    await prisma.property.create({
      data: {
        ...property,
        asset: { create: { type: "IMMOBILIE", name: assetName, besitzstatus, userId } },
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
