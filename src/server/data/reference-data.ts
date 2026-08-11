import { prisma } from "@/server/db";
import type { Bundesland, Finanzierungsart } from "@/generated/prisma/client";
import type { ReferenceDataSnapshot } from "@/server/calc/types";
import { BUNDESLAENDER, GEWERKE } from "@/server/calc/types";

/** Lädt alle Referenztabellen und formt sie in das Format, das die Calc-Engine erwartet. */
export async function ladeReferenceDataSnapshot(): Promise<ReferenceDataSnapshot> {
  const [
    grunderwerbsteuer,
    mietpreise,
    gewerkKostenRows,
    instandhaltungssaetze,
    kaufnebenkostenDefaults,
    kaufpreisfaktoren,
    nutzungsdauerRows,
  ] = await Promise.all([
    prisma.referenceGrunderwerbsteuer.findMany(),
    prisma.referenceMietpreis.findMany(),
    prisma.referenceGewerkKosten.findMany(),
    prisma.referenceInstandhaltungssatz.findMany({ orderBy: { altersklasseVonJahren: "asc" } }),
    prisma.referenceKaufnebenkostenDefaults.findFirst(),
    prisma.referenceKaufpreisfaktor.findMany(),
    prisma.referenceNutzungsdauer.findMany(),
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

  const nutzungsdauerJahreByGewerk = Object.fromEntries(
    GEWERKE.map((g) => [g, nutzungsdauerRows.find((r) => r.gewerk === g)?.nutzungsdauerJahre ?? 30])
  ) as ReferenceDataSnapshot["nutzungsdauerJahreByGewerk"];

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
    nutzungsdauerJahreByGewerk,
  };
}

export interface Standardwerte {
  bundesland: Bundesland | null;
  zinssatzProzent: number | null;
  tilgungProzent: number | null;
  zinsbindungJahre: number | null;
  finanzierungsart: Finanzierungsart | null;
  mietsteigerungProzent: number | null;
  wertsteigerungProzent: number | null;
  kostensteigerungProzent: number | null;
  leerstandsquoteProzent: number | null;
}

/** Werte, mit denen neue Objekte vorausgefüllt werden sollen — jedes Feld null, wenn kein Standard gesetzt ist. */
export async function ladeStandardwerte(): Promise<Standardwerte> {
  const row = await prisma.referenceKaufnebenkostenDefaults.findFirst();
  return {
    bundesland: row?.standardBundesland ?? null,
    zinssatzProzent: row?.standardZinssatzProzent ?? null,
    tilgungProzent: row?.standardTilgungProzent ?? null,
    zinsbindungJahre: row?.standardZinsbindungJahre ?? null,
    finanzierungsart: row?.standardFinanzierungsart ?? null,
    mietsteigerungProzent: row?.standardMietsteigerungProzent ?? null,
    wertsteigerungProzent: row?.standardWertsteigerungProzent ?? null,
    kostensteigerungProzent: row?.standardKostensteigerungProzent ?? null,
    leerstandsquoteProzent: row?.standardLeerstandsquoteProzent ?? null,
  };
}
