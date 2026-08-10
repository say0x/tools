/*
  Warnings:

  - You are about to drop the column `notarGrundbuchOverride` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `notarGrundbuchProzent` on the `Property` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Property" DROP COLUMN "notarGrundbuchOverride",
DROP COLUMN "notarGrundbuchProzent",
ADD COLUMN     "grundbuchOverride" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "grundbuchProzent" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "notarOverride" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notarProzent" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- CreateTable
CREATE TABLE "ReferenceKaufnebenkostenDefaults" (
    "id" TEXT NOT NULL,
    "notarProzent" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "grundbuchProzent" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceKaufnebenkostenDefaults_pkey" PRIMARY KEY ("id")
);
