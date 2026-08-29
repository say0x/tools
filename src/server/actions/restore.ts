"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/server/db";
import { splitPropertyData } from "@/server/data/mappers";
import { validiereBackup, type ValidiertesBackup } from "./restore-schema";
import { ausfuehren, type ActionResult } from "./result";

/**
 * Wiedereinspiel-Mechanismus für den Daten-Backup-Export (Rang 3 der
 * Weiterentwicklung-Priorisierung, siehe PR-Beschreibung). Bewusst "voller
 * Ersatz" statt Merge: der komplette Datenbestand für Objekte, Profil,
 * Sparpositionen und Szenarien wird gelöscht und exakt aus dem Backup neu
 * angelegt (inkl. Original-IDs, damit SzenarioAenderung.assetId-Referenzen
 * ohne Remapping gültig bleiben und /immobilien/objekte/[id]- bzw.
 * /szenarien/[id]-Links stabil bleiben). Referenzdaten/Standardwerte
 * (/immobilien/referenzdaten) bleiben unangetastet — siehe restore-schema.ts.
 *
 * Zweistufig abgesichert, weil ein Restore potenziell destruktiv ist:
 * 1. vorschauBackup() validiert rein lesend und zeigt, was sich ändern würde.
 * 2. stelleBackupWieder() verlangt zusätzlich eine exakte Freitext-Bestätigung
 *    UND validiert das Backup ein zweites Mal frisch (nie der Vorschau eines
 *    vorherigen Aufrufs vertrauen), bevor irgendetwas gelöscht wird.
 *
 * Referenz: docs/tools/weitere-rechner.md
 */

const BESTAETIGUNGSWORT = "DATEN ERSETZEN";

export interface BackupVorschau {
  exportiertAm: string | null;
  backup: { objekte: number; sparpositionen: number; szenarien: number; profilVorhanden: boolean };
  aktuell: { objekte: number; sparpositionen: number; szenarien: number; profilVorhanden: boolean };
}

async function ladeAktuelleZahlen() {
  const [objekte, wertpapiere, tagesgeld, szenarien, profil] = await Promise.all([
    prisma.property.count(),
    prisma.wertpapierposition.count(),
    prisma.tagesgeldkonto.count(),
    prisma.szenario.count(),
    prisma.userProfile.findFirst({ select: { id: true } }),
  ]);
  return { objekte, sparpositionen: wertpapiere + tagesgeld, szenarien, profilVorhanden: profil !== null };
}

export async function vorschauBackup(json: unknown): Promise<ActionResult<BackupVorschau>> {
  return ausfuehren(async () => {
    const validiert = validiereBackup(json);
    if (!validiert.success) {
      throw new Error(validiert.error);
    }
    const aktuell = await ladeAktuelleZahlen();
    return {
      exportiertAm: validiert.data.exportiertAm,
      backup: {
        objekte: validiert.data.objekte.length,
        sparpositionen: validiert.data.sparpositionen.length,
        szenarien: validiert.data.szenarien.length,
        profilVorhanden: validiert.data.profil !== null,
      },
      aktuell,
    };
  });
}

async function fuehreRestoreAus(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], daten: ValidiertesBackup) {
  // Löschen in dieser Reihenfolge unabhängig von Kaskaden korrekt: Szenario
  // zuerst (nimmt alle SzenarioAenderung mit), dann Asset (nimmt Property +
  // Financing/Gewerke/Exit sowie Wertpapierposition/Tagesgeldkonto mit).
  await tx.szenario.deleteMany({});
  await tx.asset.deleteMany({});
  await tx.userProfile.deleteMany({});

  if (daten.profil) {
    const { values, gehaltInflation } = daten.profil;
    await tx.userProfile.create({
      data: {
        id: daten.profil.id,
        nettoEinkommenMonatlich: values.nettoEinkommenMonatlich,
        bruttoEinkommenMonatlich: values.bruttoEinkommenMonatlich,
        zuVersteuerndesEinkommenJaehrlich: values.zuVersteuerndesEinkommenJaehrlich,
        zvEOverride: values.zvEOverride,
        fixkostenMonatlich: values.fixkostenMonatlich,
        vorhandenesEigenkapital: values.vorhandenesEigenkapital,
        maxSchuldendienstquoteProzent: values.maxSchuldendienstquoteProzent,
        mindestLiquiditaetsreserveEuro: values.mindestLiquiditaetsreserveEuro,
        mietanrechnungProzent: values.mietanrechnungProzent,
        mindestEigenkapitalrenditeProzent: values.mindestEigenkapitalrenditeProzent,
        eigenkapitalPruefungAbEuro: values.eigenkapitalPruefungAbEuro,
        cashflowStartverlustMaxProzentKaltmiete: values.cashflowStartverlustMaxProzentKaltmiete,
        cashflowUmschlagjahr: values.cashflowUmschlagjahr,
        gehaltssteigerungProzentJaehrlich: gehaltInflation.gehaltssteigerungProzentJaehrlich,
        inflationProzentJaehrlich: gehaltInflation.inflationProzentJaehrlich,
        bundesland: values.bundesland,
        kirchensteuerpflichtig: values.kirchensteuerpflichtig,
        beschaeftigungsstatus: values.beschaeftigungsstatus,
        gesetzlichKrankenversichert: values.gesetzlichKrankenversichert,
        kinderlos: values.kinderlos,
      },
    });
    if (values.liabilities.length > 0) {
      await tx.userLiability.createMany({
        data: values.liabilities.map((l, i) => ({
          id: daten.profil!.liabilityIds[i],
          profileId: daten.profil!.id,
          bezeichnung: l.bezeichnung,
          monatlicheRate: l.monatlicheRate,
          restschuld: l.restschuld,
        })),
      });
    }
  }

  for (const objekt of daten.objekte) {
    const { name, besitzstatus, property, financing, gewerke, exit } = splitPropertyData(objekt.values);

    await tx.asset.create({ data: { id: objekt.assetId, type: "IMMOBILIE", name, besitzstatus } });
    await tx.property.create({ data: { id: objekt.id, assetId: objekt.assetId, createdAt: objekt.createdAt, ...property } });
    if (objekt.financingId) {
      await tx.propertyFinancing.create({ data: { id: objekt.financingId, propertyId: objekt.id, ...financing } });
    }
    if (objekt.exitId) {
      await tx.propertyExit.create({ data: { id: objekt.exitId, propertyId: objekt.id, ...exit } });
    }
    if (gewerke.length > 0) {
      await tx.propertyGewerk.createMany({
        data: gewerke.map((g, i) => ({ id: objekt.gewerkeIds[i], propertyId: objekt.id, ...g })),
      });
    }
  }

  for (const position of daten.sparpositionen) {
    await tx.asset.create({
      data: { id: position.assetId, type: position.values.art, name: position.values.name, besitzstatus: position.values.besitzstatus },
    });
    const positionData = {
      assetId: position.assetId,
      createdAt: position.createdAt,
      betrag: position.values.betrag,
      sparplanBetragMonatlich: position.values.sparplanBetragMonatlich,
      sparplanSteigerungProzentJaehrlich: position.values.sparplanSteigerungProzentJaehrlich,
    };
    if (position.values.art === "WERTPAPIERDEPOT") {
      await tx.wertpapierposition.create({ data: { ...positionData, renditeProzentJaehrlich: position.values.renditeProzentJaehrlich } });
    } else {
      await tx.tagesgeldkonto.create({ data: { ...positionData, zinsProzentJaehrlich: position.values.renditeProzentJaehrlich } });
    }
  }

  for (const szenario of daten.szenarien) {
    await tx.szenario.create({
      data: { id: szenario.id, createdAt: szenario.createdAt, name: szenario.values.name, startjahr: szenario.values.startjahr, notizen: szenario.values.notizen },
    });
    if (szenario.values.aenderungen.length > 0) {
      await tx.szenarioAenderung.createMany({
        data: szenario.values.aenderungen.map((a, i) => ({
          id: szenario.aenderungenIds[i],
          szenarioId: szenario.id,
          typ: a.typ,
          assetId: a.assetId,
          neueSparrateMonatlich: a.neueSparrateMonatlich,
          jahrAbHeute: a.jahrAbHeute,
          bezeichnung: a.bezeichnung,
          betrag: a.betrag,
        })),
      });
    }
  }
}

export async function stelleBackupWieder(json: unknown, bestaetigung: string): Promise<ActionResult> {
  return ausfuehren(async () => {
    if (bestaetigung !== BESTAETIGUNGSWORT) {
      throw new Error(`Bestätigung stimmt nicht überein. Bitte exakt "${BESTAETIGUNGSWORT}" eingeben.`);
    }

    const validiert = validiereBackup(json);
    if (!validiert.success) {
      throw new Error(validiert.error);
    }

    await prisma.$transaction((tx) => fuehreRestoreAus(tx, validiert.data), { timeout: 30_000 });

    // Die eigentliche (destruktive) Arbeit ist an dieser Stelle bereits committet —
    // ein Fehler beim Cache-Invalidieren darf dem Aufrufer nicht fälschlich
    // "Restore fehlgeschlagen" melden, während die Daten tatsächlich schon ersetzt sind.
    try {
      revalidatePath("/", "layout");
    } catch (error) {
      console.error("[restore] revalidatePath fehlgeschlagen, Restore selbst war aber erfolgreich", error);
    }
  });
}
