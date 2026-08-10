import { prisma } from "@/server/db";
import type { ReferenceDataSnapshot } from "@/server/calc/types";
import { BUNDESLAENDER, GEWERKE } from "@/server/calc/types";

/** Lädt alle Referenztabellen und formt sie in das Format, das die Calc-Engine erwartet. */
export async function ladeReferenceDataSnapshot(): Promise<ReferenceDataSnapshot> {
  const [grunderwerbsteuer, mietpreise, gewerkKostenRows, instandhaltungssaetze] = await Promise.all([
    prisma.referenceGrunderwerbsteuer.findMany(),
    prisma.referenceMietpreis.findMany(),
    prisma.referenceGewerkKosten.findMany(),
    prisma.referenceInstandhaltungssatz.findMany({ orderBy: { altersklasseVonJahren: "asc" } }),
  ]);

  const grunderwerbsteuerByBundesland = Object.fromEntries(
    BUNDESLAENDER.map((b) => [b, grunderwerbsteuer.find((r) => r.bundesland === b)?.satzProzent ?? 0])
  ) as ReferenceDataSnapshot["grunderwerbsteuerByBundesland"];

  const mietpreisByBundeslandLagetyp: Record<string, number> = {};
  for (const row of mietpreise) {
    mietpreisByBundeslandLagetyp[`${row.bundesland}:${row.lagetyp}`] = row.mietpreisProM2;
  }

  const gewerkKosten = Object.fromEntries(
    GEWERKE.map((g) => {
      const row = gewerkKostenRows.find((r) => r.gewerk === g);
      return [g, { min: row?.kostenProM2Min ?? 0, max: row?.kostenProM2Max ?? 0 }];
    })
  ) as ReferenceDataSnapshot["gewerkKosten"];

  return {
    grunderwerbsteuerByBundesland,
    mietpreisByBundeslandLagetyp,
    gewerkKosten,
    instandhaltungssaetze: instandhaltungssaetze.map((s) => ({
      von: s.altersklasseVonJahren,
      bis: s.altersklasseBisJahren,
      satz: s.satzProM2ProJahr,
    })),
  };
}
