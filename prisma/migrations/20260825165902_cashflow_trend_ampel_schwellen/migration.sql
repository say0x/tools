-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "cashflowStartverlustMaxProzentKaltmiete" DOUBLE PRECISION NOT NULL DEFAULT 30,
ADD COLUMN     "cashflowUmschlagjahr" INTEGER NOT NULL DEFAULT 10;
