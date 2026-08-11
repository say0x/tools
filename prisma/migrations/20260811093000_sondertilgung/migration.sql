-- AlterTable
ALTER TABLE "PropertyFinancing" ADD COLUMN     "sondertilgungProzent" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "sondertilgungMaxProzent" DOUBLE PRECISION NOT NULL DEFAULT 5;

-- AlterTable
ALTER TABLE "ReferenceKaufnebenkostenDefaults" ADD COLUMN     "standardSondertilgungProzent" DOUBLE PRECISION,
ADD COLUMN     "standardSondertilgungMaxProzent" DOUBLE PRECISION;
