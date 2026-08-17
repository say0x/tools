-- CreateEnum
CREATE TYPE "Besitzstatus" AS ENUM ('BESITZE_ICH', 'POTENZIELLE_ANSCHAFFUNG', 'SPEKULATION', 'VERKAUFT', 'ARCHIVIERT');

-- AlterTable
ALTER TABLE "Asset" ADD COLUMN     "besitzstatus" "Besitzstatus" NOT NULL DEFAULT 'POTENZIELLE_ANSCHAFFUNG';

-- DataMigration: bestehendes Property.inFinanzuebersicht=true auf Asset.besitzstatus=BESITZE_ICH übertragen,
-- bevor die Spalte gelöscht wird (false entspricht bereits dem neuen Default POTENZIELLE_ANSCHAFFUNG).
UPDATE "Asset"
SET "besitzstatus" = 'BESITZE_ICH'
FROM "Property"
WHERE "Property"."assetId" = "Asset"."id" AND "Property"."inFinanzuebersicht" = true;

-- DataMigration: Wertpapier-/Tagesgeld-Positionen hatten bisher GAR KEINEN Auswahl-Schalter und
-- zählten immer automatisch mit. Damit sich das Verhalten für bestehende Daten nicht unbemerkt
-- ändert (Positionen dürfen nicht plötzlich aus der Finanzübersicht verschwinden), bekommen alle
-- zum Migrationszeitpunkt bereits vorhandenen Wertpapier-/Tagesgeld-Assets BESITZE_ICH. Der neue
-- Spaltendefault (POTENZIELLE_ANSCHAFFUNG) gilt damit erst für künftig neu angelegte Assets, für die
-- die Server Action ohnehin explizit BESITZE_ICH setzt (siehe speichereFinanzuebersicht).
UPDATE "Asset"
SET "besitzstatus" = 'BESITZE_ICH'
WHERE "type" IN ('WERTPAPIERDEPOT', 'TAGESGELD');

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "inFinanzuebersicht";
