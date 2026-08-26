"use server";

import { ladeObjekte } from "@/server/data/property";
import { ladeProfil } from "./profile";
import { ladeSparpositionen } from "./finanzuebersicht";
import { ladeSzenarien } from "./szenario";
import { ladeReferenceDataSnapshot, ladeStandardwerte } from "@/server/data/reference-data";

/**
 * Vollständiger, lesbarer JSON-Export aller selbst eingegebenen Daten — reine
 * Backup-/Sicherungskopie zum Download, kein Wiedereinspiel-Mechanismus (dafür
 * gibt es für Immobilien bereits den separaten Import-Weg über
 * data/import-objekte.json + `npm run import:objekte`). Nutzt bewusst dieselben
 * Loader wie die jeweiligen Seiten, statt eigene Prisma-Queries zu duplizieren.
 *
 * Referenz: docs/tools/weitere-rechner.md
 */
export async function exportiereAlleDaten() {
  const [objekte, profil, sparpositionen, szenarien, referenzdaten, standardwerte] = await Promise.all([
    ladeObjekte(),
    ladeProfil(),
    ladeSparpositionen(),
    ladeSzenarien(),
    ladeReferenceDataSnapshot(),
    // ladeReferenceDataSnapshot() liefert nur die für die Calc-Engine transformierten
    // Referenzwerte (Grunderwerbsteuer, Mietpreise, ...), nicht die separat über
    // /immobilien/referenzdaten editierbaren Standardwerte (Vorbelegung für neue
    // Objekte) — die fehlten hier bislang komplett im Backup.
    ladeStandardwerte(),
  ]);

  return {
    exportiertAm: new Date().toISOString(),
    objekte,
    profil,
    sparpositionen,
    szenarien,
    referenzdaten,
    standardwerte,
  };
}
