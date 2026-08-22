"use server";

import { ladeObjekte } from "@/server/data/property";
import { ladeProfil } from "./profile";
import { ladeSparpositionen } from "./finanzuebersicht";
import { ladeSzenarien } from "./szenario";
import { ladeReferenceDataSnapshot } from "@/server/data/reference-data";

/**
 * Vollständiger, lesbarer JSON-Export aller selbst eingegebenen Daten — reine
 * Backup-/Sicherungskopie zum Download, kein Wiedereinspiel-Mechanismus (dafür
 * gibt es für Immobilien bereits den separaten Import-Weg über
 * data/import-objekte.json + `npm run import:objekte`). Nutzt bewusst dieselben
 * Loader wie die jeweiligen Seiten, statt eigene Prisma-Queries zu duplizieren.
 */
export async function exportiereAlleDaten() {
  const [objekte, profil, sparpositionen, szenarien, referenzdaten] = await Promise.all([
    ladeObjekte(),
    ladeProfil(),
    ladeSparpositionen(),
    ladeSzenarien(),
    ladeReferenceDataSnapshot(),
  ]);

  return {
    exportiertAm: new Date().toISOString(),
    objekte,
    profil,
    sparpositionen,
    szenarien,
    referenzdaten,
  };
}
