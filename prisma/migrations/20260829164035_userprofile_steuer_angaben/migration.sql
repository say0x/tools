-- CreateEnum
CREATE TYPE "Beschaeftigungsstatus" AS ENUM ('ANGESTELLT', 'SELBSTSTAENDIG');

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "beschaeftigungsstatus" "Beschaeftigungsstatus" NOT NULL DEFAULT 'ANGESTELLT',
ADD COLUMN     "bundesland" "Bundesland" NOT NULL DEFAULT 'NORDRHEIN_WESTFALEN',
ADD COLUMN     "gesetzlichKrankenversichert" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "kinderlos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kirchensteuerpflichtig" BOOLEAN NOT NULL DEFAULT false;
