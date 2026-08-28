-- AlterTable
ALTER TABLE "UserProfile" ALTER COLUMN "nettoEinkommenMonatlich" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "bruttoEinkommenMonatlich" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "zuVersteuerndesEinkommenJaehrlich" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "fixkostenMonatlich" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "vorhandenesEigenkapital" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "maxSchuldendienstquoteProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "mindestLiquiditaetsreserveEuro" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "mietanrechnungProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "mindestEigenkapitalrenditeProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "eigenkapitalPruefungAbEuro" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "cashflowStartverlustMaxProzentKaltmiete" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "gehaltssteigerungProzentJaehrlich" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "inflationProzentJaehrlich" SET DATA TYPE DECIMAL(7,4);

-- AlterTable
ALTER TABLE "UserLiability" ALTER COLUMN "monatlicheRate" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "restschuld" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "Property" ALTER COLUMN "kaufpreis" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "grunderwerbsteuerProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "notarProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "grundbuchProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "maklerprovisionProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "sofortinvestitionPauschal" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "miteigentumsanteilProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "kaltmieteMonatlich" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "mietsteigerungProzentJaehrlich" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "wertsteigerungProzentJaehrlich" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "kostensteigerungProzentJaehrlich" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "hausgeldUmlagefaehigMonatlich" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "hausgeldNichtUmlagefaehigMonatlich" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "grundsteuerJaehrlich" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "instandhaltungsruecklageMonatlich" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "verwaltungskostenMonatlich" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "leerstandsquoteProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "versicherungJaehrlich" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "afaSatzProzent" SET DATA TYPE DECIMAL(7,4);

-- AlterTable
ALTER TABLE "PropertyFinancing" ALTER COLUMN "eigenkapital" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "zinssatzProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "anfaenglicheTilgungProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "eigenkapitalquoteManuellProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "anschlusszinsAufschlagProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "sondertilgungProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "sondertilgungMaxProzent" SET DATA TYPE DECIMAL(7,4);

-- AlterTable
ALTER TABLE "PropertyGewerk" ALTER COLUMN "geschaetzteKostenOverride" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "Wertpapierposition" ALTER COLUMN "betrag" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "renditeProzentJaehrlich" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "sparplanBetragMonatlich" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "sparplanSteigerungProzentJaehrlich" SET DATA TYPE DECIMAL(7,4);

-- AlterTable
ALTER TABLE "Tagesgeldkonto" ALTER COLUMN "betrag" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "zinsProzentJaehrlich" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "sparplanBetragMonatlich" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "sparplanSteigerungProzentJaehrlich" SET DATA TYPE DECIMAL(7,4);

-- AlterTable
ALTER TABLE "ReferenceGrunderwerbsteuer" ALTER COLUMN "satzProzent" SET DATA TYPE DECIMAL(7,4);

-- AlterTable
ALTER TABLE "ReferenceMietpreis" ALTER COLUMN "mietpreisProM2" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "ReferenceGewerkKosten" ALTER COLUMN "kostenProM2Min" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "kostenProM2Max" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "ReferenceInstandhaltungssatz" ALTER COLUMN "satzProM2ProJahr" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "ReferenceKaufnebenkostenDefaults" ALTER COLUMN "notarProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "grundbuchProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "standardZinssatzProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "standardTilgungProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "standardMietsteigerungProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "standardWertsteigerungProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "standardKostensteigerungProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "standardLeerstandsquoteProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "standardAnschlusszinsAufschlagProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "standardSondertilgungProzent" SET DATA TYPE DECIMAL(7,4),
ALTER COLUMN "standardSondertilgungMaxProzent" SET DATA TYPE DECIMAL(7,4);

-- AlterTable
ALTER TABLE "ReferenceKaufpreisfaktor" ALTER COLUMN "kaufpreisfaktorReferenz" SET DATA TYPE DECIMAL(7,4);

-- AlterTable
ALTER TABLE "SzenarioAenderung" ALTER COLUMN "neueSparrateMonatlich" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "betrag" SET DATA TYPE DECIMAL(14,2);

