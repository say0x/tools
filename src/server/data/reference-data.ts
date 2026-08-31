import { cache } from "react";
import { prisma } from "@/server/db";
import type { Bundesland, Finanzierungsart } from "@/generated/prisma/client";
import type { ReferenceDataSnapshot } from "@/server/calc/types";
import { BUNDESLAENDER, GEWERKE } from "@/server/calc/types";

// ladeReferenceDataSnapshot() und ladeStandardwerte() lesen beide dieselbe (einzige)
// Zeile aus ReferenceKaufnebenkostenDefaults — auf Seiten, die beide Loader parallel
// aufrufen (z.B. /immobilien/objekte/neu), dedupliziert cache() das zu einer Anfrage.
export const ladeKaufnebenkostenDefaultsRow = cache(() => prisma.referenceKaufnebenkostenDefaults.findFirst());

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
    bodenrichtwerte,
  ] = await Promise.all([
    prisma.referenceGrunderwerbsteuer.findMany(),
    prisma.referenceMietpreis.findMany(),
    prisma.referenceGewerkKosten.findMany(),
    prisma.referenceInstandhaltungssatz.findMany({ orderBy: { altersklasseVonJahren: "asc" } }),
    ladeKaufnebenkostenDefaultsRow(),
    prisma.referenceKaufpreisfaktor.findMany(),
    prisma.referenceNutzungsdauer.findMany(),
    prisma.referenceBodenrichtwert.findMany(),
  ]);

  const grunderwerbsteuerByBundesland = Object.fromEntries(
    BUNDESLAENDER.map((b) => [b, grunderwerbsteuer.find((r) => r.bundesland === b)?.satzProzent.toNumber() ?? 0])
  ) as ReferenceDataSnapshot["grunderwerbsteuerByBundesland"];

  const mietpreisByBundeslandLagetyp: Record<string, number> = {};
  for (const row of mietpreise) {
    mietpreisByBundeslandLagetyp[`${row.bundesland}:${row.lagetyp}`] = row.mietpreisProM2.toNumber();
  }

  const gewerkKosten = Object.fromEntries(
    GEWERKE.map((g) => {
      const row = gewerkKostenRows.find((r) => r.gewerk === g);
      return [g, { min: row?.kostenProM2Min.toNumber() ?? 0, max: row?.kostenProM2Max.toNumber() ?? 0 }];
    })
  ) as ReferenceDataSnapshot["gewerkKosten"];

  const kaufpreisfaktorReferenzByObjekttypLagetyp: Record<string, number> = {};
  for (const row of kaufpreisfaktoren) {
    kaufpreisfaktorReferenzByObjekttypLagetyp[`${row.objekttyp}:${row.lagetyp}`] = row.kaufpreisfaktorReferenz.toNumber();
  }

  const nutzungsdauerJahreByGewerk = Object.fromEntries(
    GEWERKE.map((g) => [g, nutzungsdauerRows.find((r) => r.gewerk === g)?.nutzungsdauerJahre ?? 30])
  ) as ReferenceDataSnapshot["nutzungsdauerJahreByGewerk"];

  const bodenrichtwertByBundeslandLagetyp: Record<string, number> = {};
  for (const row of bodenrichtwerte) {
    bodenrichtwertByBundeslandLagetyp[`${row.bundesland}:${row.lagetyp}`] = row.bodenrichtwertProM2.toNumber();
  }

  return {
    grunderwerbsteuerByBundesland,
    mietpreisByBundeslandLagetyp,
    gewerkKosten,
    instandhaltungssaetze: instandhaltungssaetze.map((s) => ({
      von: s.altersklasseVonJahren,
      bis: s.altersklasseBisJahren,
      satz: s.satzProM2ProJahr.toNumber(),
    })),
    notarProzentDefault: kaufnebenkostenDefaults?.notarProzent.toNumber() ?? 1.0,
    grundbuchProzentDefault: kaufnebenkostenDefaults?.grundbuchProzent.toNumber() ?? 0.5,
    kaufpreisfaktorReferenzByObjekttypLagetyp,
    nutzungsdauerJahreByGewerk,
    bodenrichtwertByBundeslandLagetyp,
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
  anschlusszinsAufschlagProzent: number | null;
  sondertilgungProzent: number | null;
  sondertilgungMaxProzent: number | null;
}

/** Werte, mit denen neue Objekte vorausgefüllt werden sollen — jedes Feld null, wenn kein Standard gesetzt ist. */
export async function ladeStandardwerte(): Promise<Standardwerte> {
  const row = await ladeKaufnebenkostenDefaultsRow();
  return {
    bundesland: row?.standardBundesland ?? null,
    zinssatzProzent: row?.standardZinssatzProzent?.toNumber() ?? null,
    tilgungProzent: row?.standardTilgungProzent?.toNumber() ?? null,
    zinsbindungJahre: row?.standardZinsbindungJahre ?? null,
    finanzierungsart: row?.standardFinanzierungsart ?? null,
    mietsteigerungProzent: row?.standardMietsteigerungProzent?.toNumber() ?? null,
    wertsteigerungProzent: row?.standardWertsteigerungProzent?.toNumber() ?? null,
    kostensteigerungProzent: row?.standardKostensteigerungProzent?.toNumber() ?? null,
    leerstandsquoteProzent: row?.standardLeerstandsquoteProzent?.toNumber() ?? null,
    anschlusszinsAufschlagProzent: row?.standardAnschlusszinsAufschlagProzent?.toNumber() ?? null,
    sondertilgungProzent: row?.standardSondertilgungProzent?.toNumber() ?? null,
    sondertilgungMaxProzent: row?.standardSondertilgungMaxProzent?.toNumber() ?? null,
  };
}
