-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "ansprechpartnerEmail" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ansprechpartnerName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ansprechpartnerNotizen" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ansprechpartnerTelefon" TEXT NOT NULL DEFAULT '';
