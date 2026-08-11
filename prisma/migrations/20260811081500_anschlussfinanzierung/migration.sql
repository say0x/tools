-- AlterTable
ALTER TABLE "PropertyFinancing" ADD COLUMN     "anschlusszinsAufschlagProzent" DOUBLE PRECISION NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "ReferenceKaufnebenkostenDefaults" ADD COLUMN     "standardAnschlusszinsAufschlagProzent" DOUBLE PRECISION;
