-- AlterEnum
ALTER TYPE "SzenarioAenderungTyp" ADD VALUE 'IMMOBILIE_STATT_ALTERNATIVANLAGE';

-- AlterTable
ALTER TABLE "SzenarioAenderung" ADD COLUMN     "alternativanlageRenditeProzent" DECIMAL(7,4);
