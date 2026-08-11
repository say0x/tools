-- AlterTable
ALTER TABLE "ReferenceKaufnebenkostenDefaults" ADD COLUMN     "standardBundesland" "Bundesland";

-- CreateTable
CREATE TABLE "ReferenceKaufpreisfaktor" (
    "id" TEXT NOT NULL,
    "objekttyp" "Objekttyp" NOT NULL,
    "lagetyp" "Lagetyp" NOT NULL,
    "kaufpreisfaktorReferenz" DOUBLE PRECISION NOT NULL,
    "aktualisiertAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceKaufpreisfaktor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceKaufpreisfaktor_objekttyp_lagetyp_key" ON "ReferenceKaufpreisfaktor"("objekttyp", "lagetyp");

-- SeedData: Startwerte, grobe Richtwerte ohne Live-Anbindung, im UI unter /immobilien/referenzdaten editierbar.
INSERT INTO "ReferenceKaufpreisfaktor" ("id", "objekttyp", "lagetyp", "kaufpreisfaktorReferenz") VALUES
    ('kpf-etw-grossstadt', 'ETW', 'GROSSSTADT', 28),
    ('kpf-etw-kleinstadt', 'ETW', 'KLEINSTADT', 20),
    ('kpf-etw-laendlich', 'ETW', 'LAENDLICH', 15),
    ('kpf-mfh-grossstadt', 'MEHRFAMILIENHAUS', 'GROSSSTADT', 24),
    ('kpf-mfh-kleinstadt', 'MEHRFAMILIENHAUS', 'KLEINSTADT', 18),
    ('kpf-mfh-laendlich', 'MEHRFAMILIENHAUS', 'LAENDLICH', 14),
    ('kpf-haus-grossstadt', 'HAUS', 'GROSSSTADT', 26),
    ('kpf-haus-kleinstadt', 'HAUS', 'KLEINSTADT', 19),
    ('kpf-haus-laendlich', 'HAUS', 'LAENDLICH', 15)
ON CONFLICT ("objekttyp", "lagetyp") DO NOTHING;
