-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "mindestEigenkapitalrenditeProzent" DOUBLE PRECISION NOT NULL DEFAULT 4,
ADD COLUMN     "eigenkapitalPruefungAbEuro" DOUBLE PRECISION NOT NULL DEFAULT 5000;
