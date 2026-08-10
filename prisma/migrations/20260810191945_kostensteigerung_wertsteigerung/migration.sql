-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "kostensteigerungProzentJaehrlich" DOUBLE PRECISION NOT NULL DEFAULT 2,
ADD COLUMN     "wertsteigerungProzentJaehrlich" DOUBLE PRECISION NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "PropertyExit" DROP COLUMN "wertsteigerungProzentJaehrlich";
