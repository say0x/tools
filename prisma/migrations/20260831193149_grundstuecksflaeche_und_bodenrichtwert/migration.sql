-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "grundstuecksflaecheQm" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "ReferenceBodenrichtwert" (
    "id" TEXT NOT NULL,
    "bundesland" "Bundesland" NOT NULL,
    "lagetyp" "Lagetyp" NOT NULL,
    "bodenrichtwertProM2" DECIMAL(10,2) NOT NULL,
    "aktualisiertAm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferenceBodenrichtwert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceBodenrichtwert_bundesland_lagetyp_key" ON "ReferenceBodenrichtwert"("bundesland", "lagetyp");

