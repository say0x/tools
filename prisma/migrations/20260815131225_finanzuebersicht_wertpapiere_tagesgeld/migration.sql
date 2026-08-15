-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AssetType" ADD VALUE 'WERTPAPIERDEPOT';
ALTER TYPE "AssetType" ADD VALUE 'TAGESGELD';

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "gehaltssteigerungProzentJaehrlich" DOUBLE PRECISION NOT NULL DEFAULT 2,
ADD COLUMN     "inflationProzentJaehrlich" DOUBLE PRECISION NOT NULL DEFAULT 2;

-- CreateTable
CREATE TABLE "Wertpapierposition" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "betrag" DOUBLE PRECISION NOT NULL,
    "renditeProzentJaehrlich" DOUBLE PRECISION NOT NULL DEFAULT 7,
    "sparplanBetragMonatlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sparplanSteigerungProzentJaehrlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wertpapierposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tagesgeldkonto" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "betrag" DOUBLE PRECISION NOT NULL,
    "zinsProzentJaehrlich" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "sparplanBetragMonatlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sparplanSteigerungProzentJaehrlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tagesgeldkonto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wertpapierposition_assetId_key" ON "Wertpapierposition"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "Tagesgeldkonto_assetId_key" ON "Tagesgeldkonto"("assetId");

-- AddForeignKey
ALTER TABLE "Wertpapierposition" ADD CONSTRAINT "Wertpapierposition_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tagesgeldkonto" ADD CONSTRAINT "Tagesgeldkonto_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
