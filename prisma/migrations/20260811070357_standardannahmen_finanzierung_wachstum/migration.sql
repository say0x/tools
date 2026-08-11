-- AlterTable
ALTER TABLE "ReferenceKaufnebenkostenDefaults" ADD COLUMN     "standardFinanzierungsart" "Finanzierungsart",
ADD COLUMN     "standardKostensteigerungProzent" DOUBLE PRECISION,
ADD COLUMN     "standardLeerstandsquoteProzent" DOUBLE PRECISION,
ADD COLUMN     "standardMietsteigerungProzent" DOUBLE PRECISION,
ADD COLUMN     "standardTilgungProzent" DOUBLE PRECISION,
ADD COLUMN     "standardWertsteigerungProzent" DOUBLE PRECISION,
ADD COLUMN     "standardZinsbindungJahre" INTEGER,
ADD COLUMN     "standardZinssatzProzent" DOUBLE PRECISION;
