-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('IMMOBILIE');

-- CreateEnum
CREATE TYPE "Bundesland" AS ENUM ('BADEN_WUERTTEMBERG', 'BAYERN', 'BERLIN', 'BRANDENBURG', 'BREMEN', 'HAMBURG', 'HESSEN', 'MECKLENBURG_VORPOMMERN', 'NIEDERSACHSEN', 'NORDRHEIN_WESTFALEN', 'RHEINLAND_PFALZ', 'SAARLAND', 'SACHSEN', 'SACHSEN_ANHALT', 'SCHLESWIG_HOLSTEIN', 'THUERINGEN');

-- CreateEnum
CREATE TYPE "Lagetyp" AS ENUM ('LAENDLICH', 'KLEINSTADT', 'GROSSSTADT');

-- CreateEnum
CREATE TYPE "Objekttyp" AS ENUM ('ETW', 'MEHRFAMILIENHAUS', 'HAUS');

-- CreateEnum
CREATE TYPE "Sanierungsmodus" AS ENUM ('PAUSCHAL', 'GRANULAR');

-- CreateEnum
CREATE TYPE "Finanzierungsart" AS ENUM ('FINANZIERUNG_100', 'FINANZIERUNG_110', 'MANUELL');

-- CreateEnum
CREATE TYPE "Gewerk" AS ENUM ('DACH', 'FENSTER', 'HEIZUNG', 'ELEKTRIK', 'SANITAER_BAEDER', 'MAUERWERK_FASSADE', 'BODENBELAEGE', 'SONSTIGES');

-- CreateEnum
CREATE TYPE "EigentumsTyp" AS ENUM ('SONDEREIGENTUM', 'GEMEINSCHAFTSEIGENTUM');

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "nettoEinkommenMonatlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zuVersteuerndesEinkommenJaehrlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fixkostenMonatlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vorhandenesEigenkapital" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxSchuldendienstquoteProzent" DOUBLE PRECISION NOT NULL DEFAULT 35,
    "mindestLiquiditaetsreserveEuro" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLiability" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "bezeichnung" TEXT NOT NULL,
    "monatlicheRate" DOUBLE PRECISION NOT NULL,
    "restschuld" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLiability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kaufpreis" DOUBLE PRECISION NOT NULL,
    "kaufdatum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "wohnflaeche" DOUBLE PRECISION NOT NULL,
    "bundesland" "Bundesland" NOT NULL,
    "lagetyp" "Lagetyp" NOT NULL,
    "objekttyp" "Objekttyp" NOT NULL,
    "baujahr" INTEGER NOT NULL,
    "anzahlEinheiten" INTEGER NOT NULL DEFAULT 1,
    "grunderwerbsteuerProzent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grunderwerbsteuerOverride" BOOLEAN NOT NULL DEFAULT false,
    "notarGrundbuchProzent" DOUBLE PRECISION NOT NULL DEFAULT 1.75,
    "notarGrundbuchOverride" BOOLEAN NOT NULL DEFAULT false,
    "maklerprovisionProzent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maklerprovisionOverride" BOOLEAN NOT NULL DEFAULT false,
    "sanierungsmodus" "Sanierungsmodus" NOT NULL DEFAULT 'PAUSCHAL',
    "sofortinvestitionPauschal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "kaltmieteMonatlich" DOUBLE PRECISION NOT NULL,
    "mietsteigerungProzentJaehrlich" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "hausgeldUmlagefaehigMonatlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hausgeldNichtUmlagefaehigMonatlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "instandhaltungsruecklageMonatlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "instandhaltungsruecklageOverride" BOOLEAN NOT NULL DEFAULT false,
    "verwaltungskostenMonatlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leerstandsquoteProzent" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "versicherungJaehrlich" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "afaSatzProzent" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "afaSonderabschreibung" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyFinancing" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "eigenkapital" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "zinssatzProzent" DOUBLE PRECISION NOT NULL DEFAULT 3.5,
    "anfaenglicheTilgungProzent" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "zinsbindungJahre" INTEGER NOT NULL DEFAULT 10,
    "finanzierungsart" "Finanzierungsart" NOT NULL DEFAULT 'FINANZIERUNG_110',
    "eigenkapitalquoteManuellProzent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyFinancing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyGewerk" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "gewerk" "Gewerk" NOT NULL,
    "zustand" INTEGER NOT NULL DEFAULT 3,
    "eigentumsTyp" "EigentumsTyp" NOT NULL DEFAULT 'SONDEREIGENTUM',
    "geschaetzteKostenOverride" DOUBLE PRECISION,
    "kommentar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyGewerk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyExit" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "geplant" BOOLEAN NOT NULL DEFAULT false,
    "wertsteigerungProzentJaehrlich" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
    "haltedauerJahre" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyExit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceGrunderwerbsteuer" (
    "id" TEXT NOT NULL,
    "bundesland" "Bundesland" NOT NULL,
    "satzProzent" DOUBLE PRECISION NOT NULL,
    "gueltigAb" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quelle" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceGrunderwerbsteuer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceMietpreis" (
    "id" TEXT NOT NULL,
    "bundesland" "Bundesland" NOT NULL,
    "lagetyp" "Lagetyp" NOT NULL,
    "mietpreisProM2" DOUBLE PRECISION NOT NULL,
    "aktualisiertAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceMietpreis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceGewerkKosten" (
    "id" TEXT NOT NULL,
    "gewerk" "Gewerk" NOT NULL,
    "kostenProM2Min" DOUBLE PRECISION NOT NULL,
    "kostenProM2Max" DOUBLE PRECISION NOT NULL,
    "aktualisiertAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceGewerkKosten_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceInstandhaltungssatz" (
    "id" TEXT NOT NULL,
    "altersklasseVonJahren" INTEGER NOT NULL,
    "altersklasseBisJahren" INTEGER,
    "satzProM2ProJahr" DOUBLE PRECISION NOT NULL,
    "aktualisiertAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceInstandhaltungssatz_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_assetId_key" ON "Property"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyFinancing_propertyId_key" ON "PropertyFinancing"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyGewerk_propertyId_idx" ON "PropertyGewerk"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyExit_propertyId_key" ON "PropertyExit"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceGrunderwerbsteuer_bundesland_key" ON "ReferenceGrunderwerbsteuer"("bundesland");

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceMietpreis_bundesland_lagetyp_key" ON "ReferenceMietpreis"("bundesland", "lagetyp");

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceGewerkKosten_gewerk_key" ON "ReferenceGewerkKosten"("gewerk");

-- AddForeignKey
ALTER TABLE "UserLiability" ADD CONSTRAINT "UserLiability_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyFinancing" ADD CONSTRAINT "PropertyFinancing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyGewerk" ADD CONSTRAINT "PropertyGewerk_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyExit" ADD CONSTRAINT "PropertyExit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
