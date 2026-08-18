-- CreateEnum
CREATE TYPE "SzenarioAenderungTyp" AS ENUM ('IMMOBILIE_AUFNEHMEN', 'IMMOBILIE_VERKAUFEN', 'SPARRATE_AENDERN', 'EINMALIGE_ANSCHAFFUNG');

-- CreateTable
CREATE TABLE "Szenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startjahr" INTEGER NOT NULL,
    "notizen" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Szenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SzenarioAenderung" (
    "id" TEXT NOT NULL,
    "szenarioId" TEXT NOT NULL,
    "typ" "SzenarioAenderungTyp" NOT NULL,
    "assetId" TEXT,
    "neueSparrateMonatlich" DOUBLE PRECISION,
    "jahrAbHeute" INTEGER,
    "bezeichnung" TEXT,
    "betrag" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SzenarioAenderung_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SzenarioAenderung_szenarioId_idx" ON "SzenarioAenderung"("szenarioId");

-- AddForeignKey
ALTER TABLE "SzenarioAenderung" ADD CONSTRAINT "SzenarioAenderung_szenarioId_fkey" FOREIGN KEY ("szenarioId") REFERENCES "Szenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SzenarioAenderung" ADD CONSTRAINT "SzenarioAenderung_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
