-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "grundsteuerJaehrlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "versicherungUmlagefaehig" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "bruttoEinkommenMonatlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "zvEOverride" BOOLEAN NOT NULL DEFAULT false;
