-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Bootstrap-User für bereits bestehende Daten aus der Zeit vor dem
-- Mehrbenutzer-Datenmodell (ADR-0009) — nimmt Altdaten auf, die es sonst
-- unmöglich machen würden, userId unten als NOT NULL zu erzwingen. Auf einer
-- leeren Datenbank ist das schlicht ein ungenutzter Default-User (identisch
-- zu dem, was getActiveUserId()s eigener Bootstrap-Fallback zur Laufzeit tun
-- würde), auf einer befüllten Datenbank bewahrt es die bestehenden Zeilen.
INSERT INTO "User" ("id", "name") VALUES ('legacy-standard-user', 'Standard');

-- AlterTable: Spalte zunächst NULLABLE anlegen, bestehende Zeilen befüllen,
-- erst danach NOT NULL erzwingen — funktioniert damit sowohl auf leeren als
-- auch auf bereits befüllten Tabellen, ohne Annahmen über den DB-Zustand.
ALTER TABLE "Asset" ADD COLUMN "userId" TEXT;
UPDATE "Asset" SET "userId" = 'legacy-standard-user' WHERE "userId" IS NULL;
ALTER TABLE "Asset" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "Szenario" ADD COLUMN "userId" TEXT;
UPDATE "Szenario" SET "userId" = 'legacy-standard-user' WHERE "userId" IS NULL;
ALTER TABLE "Szenario" ALTER COLUMN "userId" SET NOT NULL;

ALTER TABLE "UserProfile" ADD COLUMN "userId" TEXT;
UPDATE "UserProfile" SET "userId" = 'legacy-standard-user' WHERE "userId" IS NULL;
ALTER TABLE "UserProfile" ALTER COLUMN "userId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Asset_userId_idx" ON "Asset"("userId");

-- CreateIndex
CREATE INDEX "Szenario_userId_idx" ON "Szenario"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Szenario" ADD CONSTRAINT "Szenario_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
