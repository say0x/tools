-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "gebaeudeWohnflaecheGesamt" DOUBLE PRECISION,
ADD COLUMN     "miteigentumsanteilOverride" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "miteigentumsanteilProzent" DOUBLE PRECISION NOT NULL DEFAULT 100;

-- AlterTable
ALTER TABLE "PropertyGewerk" ADD COLUMN     "sofortSanieren" BOOLEAN NOT NULL DEFAULT true;
