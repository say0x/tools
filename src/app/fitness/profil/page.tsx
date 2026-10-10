import { getActiveUserId } from "@/server/session";
import { ladeFitnessProfil, ladeGewichte } from "@/server/data/fitness";
import { heuteIso } from "@/server/calc/fitness/datum";
import { FitnessProfilForm } from "./FitnessProfilForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fitness — Ziele & Körperdaten" };

export default async function FitnessProfilPage() {
  const userId = await getActiveUserId();
  const heute = heuteIso();
  const [profil, gewichte] = await Promise.all([ladeFitnessProfil(userId), ladeGewichte(userId, { bis: heute })]);

  const initial = {
    groesseCm: profil?.groesseCm ?? 175,
    geburtsjahr: profil?.geburtsjahr ?? 1990,
    geschlecht: profil?.geschlecht ?? "MAENNLICH",
    aktivitaetslevel: profil?.aktivitaetslevel ?? "LEICHT",
    ziel: profil?.ziel ?? "HALTEN",
    zielTempoKgProWoche: profil?.zielTempoKgProWoche ?? 0.5,
    zielGewichtKg: profil?.zielGewichtKg ?? null,
    kalorienzielKcal: profil?.kalorienzielKcal ?? null,
    kalorienzielOverride: profil?.kalorienzielOverride ?? false,
    proteinGProKg: profil?.proteinGProKg ?? 1.8,
    fettAnteilProzent: profil?.fettAnteilProzent ?? 30,
    wasserZielMl: profil?.wasserZielMl ?? null,
    schritteZiel: profil?.schritteZiel ?? 10000,
    trainingskalorienAnrechnen: profil?.trainingskalorienAnrechnen ?? true,
    aktuellesGewichtKg: gewichte.at(-1)?.gewichtKg ?? null,
  } as const;

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Ziele & Körperdaten</h1>
        <p className="mt-1 text-slate-400">
          Grundlage für Kalorienziel, Makros und Wasserbedarf — Richtwerte für gesunde Erwachsene, keine medizinische Beratung.
        </p>
      </div>
      <FitnessProfilForm initial={initial} bezugsjahr={Number(heute.slice(0, 4))} />
    </>
  );
}
