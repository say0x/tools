-- CreateEnum
CREATE TYPE "Verglasungsart" AS ENUM ('EINFACH', 'DOPPEL', 'DREIFACH');

-- AlterTable
ALTER TABLE "PropertyGewerk" ADD COLUMN     "baujahr" INTEGER,
ADD COLUMN     "verglasung" "Verglasungsart";

-- CreateTable
CREATE TABLE "ReferenceNutzungsdauer" (
    "id" TEXT NOT NULL,
    "gewerk" "Gewerk" NOT NULL,
    "nutzungsdauerJahre" INTEGER NOT NULL,
    "aktualisiertAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceNutzungsdauer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceNutzungsdauer_gewerk_key" ON "ReferenceNutzungsdauer"("gewerk");

-- SeedData: Startwerte, grobe Richtwerte ohne Live-Anbindung, im UI unter /immobilien/referenzdaten editierbar.
INSERT INTO "ReferenceNutzungsdauer" ("id", "gewerk", "nutzungsdauerJahre") VALUES
    ('nutzdauer-dach', 'DACH', 35),
    ('nutzdauer-fenster', 'FENSTER', 30),
    ('nutzdauer-heizung', 'HEIZUNG', 20),
    ('nutzdauer-elektrik', 'ELEKTRIK', 40),
    ('nutzdauer-sanitaer', 'SANITAER_BAEDER', 25),
    ('nutzdauer-mauerwerk', 'MAUERWERK_FASSADE', 40),
    ('nutzdauer-boden', 'BODENBELAEGE', 20),
    ('nutzdauer-sonstiges', 'SONSTIGES', 25)
ON CONFLICT ("gewerk") DO NOTHING;
