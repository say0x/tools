/**
 * Löscht ALLE Nutzer-Daten (Objekte, Profil, Sparpositionen, Szenarien) —
 * Referenzdaten/Standardwerte bleiben unangetastet. Dieselbe Löschreihenfolge
 * wie stelleBackupWieder() in src/server/actions/restore.ts (unabhängig von
 * Kaskaden korrekt: Szenario zuerst, dann Asset, dann UserProfile).
 *
 * Gilt für ALLE Test-User gemeinsam (nicht nur den aktiven) — das Skript hat
 * keinen Cookie/Request-Kontext, aus dem sich ein einzelner User ableiten
 * ließe. Die User-Zeilen selbst (Namen/Labels unter /nutzer) bleiben
 * erhalten, wie Referenzdaten — nur ihre Daten werden geleert.
 *
 * Nicht für den interaktiven Einsatz gedacht — nur über den env-gesteuerten
 * Opt-in in docker-entrypoint.sh (RESET_USER_DATA_ON_DEPLOY=true) oder
 * manuell via `npm run db:reset-user-data`. Kein Bestätigungs-Dialog wie beim
 * App-seitigen Restore — wer das aufruft, hat den Schritt bereits bewusst
 * gewählt. Vor dem Einsatz gegen echte Daten: `npm run db:backup`.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.szenario.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.userProfile.deleteMany({});
  console.log("Nutzer-Daten gelöscht (Objekte, Profil, Sparpositionen, Szenarien). Referenzdaten unangetastet.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
