-- CreateEnum
CREATE TYPE "Geschlecht" AS ENUM ('MAENNLICH', 'WEIBLICH');

-- CreateEnum
CREATE TYPE "Aktivitaetslevel" AS ENUM ('SITZEND', 'LEICHT', 'MAESSIG', 'AKTIV', 'SEHR_AKTIV');

-- CreateEnum
CREATE TYPE "FitnessZiel" AS ENUM ('ABNEHMEN', 'HALTEN', 'ZUNEHMEN');

-- CreateEnum
CREATE TYPE "DatenQuelle" AS ENUM ('MANUELL', 'LEBENSMITTEL_DB', 'FOTO_KI', 'API');

-- CreateEnum
CREATE TYPE "Mahlzeit" AS ENUM ('FRUEHSTUECK', 'MITTAGESSEN', 'ABENDESSEN', 'SNACK');

-- CreateEnum
CREATE TYPE "Sportart" AS ENUM ('LAUFEN', 'GEHEN', 'WANDERN', 'RADFAHREN', 'SCHWIMMEN', 'KRAFTTRAINING', 'HIIT', 'YOGA', 'TEAMSPORT', 'RUDERN', 'SONSTIGES');

-- CreateEnum
CREATE TYPE "Intensitaet" AS ENUM ('LEICHT', 'MITTEL', 'HOCH');

-- CreateEnum
CREATE TYPE "KiKonfidenz" AS ENUM ('HOCH', 'MITTEL', 'NIEDRIG');

-- CreateTable
CREATE TABLE "FitnessProfil" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groesseCm" INTEGER NOT NULL,
    "geburtsjahr" INTEGER NOT NULL,
    "geschlecht" "Geschlecht" NOT NULL,
    "aktivitaetslevel" "Aktivitaetslevel" NOT NULL DEFAULT 'LEICHT',
    "ziel" "FitnessZiel" NOT NULL DEFAULT 'HALTEN',
    "zielTempoKgProWoche" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "zielGewichtKg" DOUBLE PRECISION,
    "kalorienzielKcal" INTEGER,
    "kalorienzielOverride" BOOLEAN NOT NULL DEFAULT false,
    "proteinGProKg" DOUBLE PRECISION NOT NULL DEFAULT 1.8,
    "fettAnteilProzent" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "wasserZielMl" INTEGER,
    "schritteZiel" INTEGER NOT NULL DEFAULT 10000,
    "trainingskalorienAnrechnen" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FitnessProfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GewichtEintrag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "datum" DATE NOT NULL,
    "gewichtKg" DOUBLE PRECISION NOT NULL,
    "koerperfettProzent" DOUBLE PRECISION,
    "notiz" TEXT NOT NULL DEFAULT '',
    "quelle" "DatenQuelle" NOT NULL DEFAULT 'MANUELL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GewichtEintrag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MahlzeitEintrag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "datum" DATE NOT NULL,
    "mahlzeit" "Mahlzeit" NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "mengeG" DOUBLE PRECISION,
    "kcal" DOUBLE PRECISION NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kohlenhydrateG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fettG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quelle" "DatenQuelle" NOT NULL DEFAULT 'MANUELL',
    "kiKonfidenz" "KiKonfidenz",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MahlzeitEintrag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingEintrag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "datum" DATE NOT NULL,
    "sportart" "Sportart" NOT NULL,
    "intensitaet" "Intensitaet" NOT NULL DEFAULT 'MITTEL',
    "dauerMin" INTEGER NOT NULL,
    "distanzKm" DOUBLE PRECISION,
    "kcalVerbrauch" DOUBLE PRECISION,
    "kcalOverride" BOOLEAN NOT NULL DEFAULT false,
    "durchschnittsPuls" INTEGER,
    "notiz" TEXT NOT NULL DEFAULT '',
    "quelle" "DatenQuelle" NOT NULL DEFAULT 'MANUELL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingEintrag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagesAktivitaet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "datum" DATE NOT NULL,
    "schritte" INTEGER,
    "wasserMl" INTEGER,
    "schlafStunden" DOUBLE PRECISION,
    "ruhepuls" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TagesAktivitaet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EigenesLebensmittel" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "kcalPro100g" DOUBLE PRECISION NOT NULL,
    "proteinPro100g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kohlenhydratePro100g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fettPro100g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "standardPortionG" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EigenesLebensmittel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceLebensmittel" (
    "id" TEXT NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "kategorie" TEXT NOT NULL,
    "kcalPro100g" DOUBLE PRECISION NOT NULL,
    "proteinPro100g" DOUBLE PRECISION NOT NULL,
    "kohlenhydratePro100g" DOUBLE PRECISION NOT NULL,
    "fettPro100g" DOUBLE PRECISION NOT NULL,
    "standardPortionG" DOUBLE PRECISION NOT NULL DEFAULT 100,

    CONSTRAINT "ReferenceLebensmittel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FitnessProfil_userId_key" ON "FitnessProfil"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GewichtEintrag_userId_datum_key" ON "GewichtEintrag"("userId", "datum");

-- CreateIndex
CREATE INDEX "MahlzeitEintrag_userId_datum_idx" ON "MahlzeitEintrag"("userId", "datum");

-- CreateIndex
CREATE INDEX "TrainingEintrag_userId_datum_idx" ON "TrainingEintrag"("userId", "datum");

-- CreateIndex
CREATE UNIQUE INDEX "TagesAktivitaet_userId_datum_key" ON "TagesAktivitaet"("userId", "datum");

-- CreateIndex
CREATE INDEX "EigenesLebensmittel_userId_idx" ON "EigenesLebensmittel"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceLebensmittel_bezeichnung_key" ON "ReferenceLebensmittel"("bezeichnung");

-- AddForeignKey
ALTER TABLE "FitnessProfil" ADD CONSTRAINT "FitnessProfil_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GewichtEintrag" ADD CONSTRAINT "GewichtEintrag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MahlzeitEintrag" ADD CONSTRAINT "MahlzeitEintrag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingEintrag" ADD CONSTRAINT "TrainingEintrag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagesAktivitaet" ADD CONSTRAINT "TagesAktivitaet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EigenesLebensmittel" ADD CONSTRAINT "EigenesLebensmittel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

