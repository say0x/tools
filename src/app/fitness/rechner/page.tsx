import { prisma } from "@/server/db";
import { getActiveUserId } from "@/server/session";
import { ladeFitnessProfil } from "@/server/data/fitness";
import { heuteIso } from "@/server/calc/fitness/datum";
import { berechneAlter } from "@/server/calc/fitness/energiebedarf";
import { SportRechnerClient } from "./SportRechnerClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fitness — Sport-Rechner" };

export default async function SportRechnerPage() {
  const userId = await getActiveUserId();
  const [profil, letzterRuhepuls] = await Promise.all([
    ladeFitnessProfil(userId),
    prisma.tagesAktivitaet.findFirst({ where: { userId, ruhepuls: { not: null } }, orderBy: { datum: "desc" }, select: { ruhepuls: true } }),
  ]);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Sport-Rechner</h1>
        <p className="mt-1 text-slate-400">Pace & Zielzeiten, Herzfrequenzzonen und Maximalkraft — nichts wird gespeichert.</p>
      </div>
      <SportRechnerClient
        alterInitial={profil ? berechneAlter(profil.geburtsjahr, Number(heuteIso().slice(0, 4))) : null}
        ruhepulsInitial={letzterRuhepuls?.ruhepuls ?? null}
      />
    </>
  );
}
