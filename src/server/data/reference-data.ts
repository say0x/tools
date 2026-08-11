import { prisma } from "@/server/db";
import type { Bundesland } from "@/generated/prisma/client";
import type { ReferenceDataSnapshot } from "@/server/calc/types";
import { BUNDESLAENDER, GEWERKE } from "@/server/calc/types";

/** Lädt alle Referenztabellen und formt sie in das Format, das die Calc-Engine erwartet. */
export async function ladeReferenceDataSnapshot(): Promise<ReferenceDataSnapshot> {
  const [grunderwerbsteuer, mietpreise, gewerkKostenRows, instandhaltungssaetze, kaufnebenkostenDefaults, kaufpreisfaktoren] =
    await Promise.all([
      prisma.referenceGrunderwerbsteuer.findMany(),
      prisma.referenceMietpreis.findMany(),
      prisma.referenceGewerkKosten.findMany(),
      prisma.referenceInstandhaltungssatz.findMany({ orderBy: { altersklasseVonJahren: "asc" } }),
      prisma.referenceKaufnebenkostenDefaults.findFirst(),
      prisma.referenceKaufpreisfaktor.findMany(),
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

  const kaufpreisfaktorReferenzByObjekttypLagetyp: Record<string, number> = {};
  for (const row of kaufpreisfaktoren) {
    kaufpreisfaktorReferenzByObjekttypLagetyp[`${row.objekttyp}:${row.lagetyp}`] = row.kaufpreisfaktorReferenz;
  }

  return {
    grunderwerbsteuerByBundesland,
    mietpreisByBundeslandLagetyp,
    gewerkKosten,
    instandhaltungssaetze: instandhaltungssaetze.map((s) => ({
      von: s.altersklasseVonJahren,
      bis: s.altersklasseBisJahren,
      satz: s.satzProM2ProJahr,
    })),
    notarProzentDefault: kaufnebenkostenDefaults?.notarProzent ?? 1.0,
    grundbuchProzentDefault: kaufnebenkostenDefaults?.grundbuchProzent ?? 0.5,
    kaufpreisfaktorReferenzByObjekttypLagetyp,
  };
}

/** Bundesland, mit dem neue Objekte vorausgefüllt werden sollen — null, wenn kein Standard gesetzt ist. */
export async function ladeStandardBundesland(): Promise<Bundesland | null> {
  const row = await prisma.referenceKaufnebenkostenDefaults.findFirst();
  return row?.standardBundesland ?? null;
}
