// Referenz (Formeln, Annahmen): docs/tools/fitness.md

import Link from "next/link";
import dynamicImport from "next/dynamic";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { getActiveUserId } from "@/server/session";
import { ladeFitnessTag, ladeFitnessZeitraum } from "@/server/data/fitness";
import { heuteIso, istIsoDatum } from "@/server/calc/fitness/datum";
import { INTENSITAET_LABELS, SPORTART_LABELS, formatKcal, formatKg } from "@/lib/fitness-labels";
import { formatNumber } from "@/lib/format";
import { DatumWaehler } from "./_components/DatumWaehler";
import { Fortschritt } from "./_components/Fortschritt";
import { LoeschenButton } from "./_components/LoeschenButton";
import { Kennzahl } from "./_components/Kennzahl";
import { MahlzeitenListe } from "./_components/MahlzeitenListe";
import { TageswerteCard } from "./_components/TageswerteCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fitness — Heute" };

const FitnessWochenChart = dynamicImport(() => import("@/components/charts/FitnessWochenChart").then((m) => m.FitnessWochenChart), {
  loading: () => <Skeleton className="h-[220px] w-full" />,
});

export default async function FitnessPage({ searchParams }: PageProps<"/fitness">) {
  const params = await searchParams;
  const heute = heuteIso();
  const roh = typeof params.datum === "string" ? params.datum : null;
  const datum = roh && istIsoDatum(roh) && roh <= heute ? roh : heute;

  const userId = await getActiveUserId();
  const [tag, woche] = await Promise.all([ladeFitnessTag(userId, datum), ladeFitnessZeitraum(userId, datum, 7)]);
  const { bilanz, energiebedarf } = tag;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Fitness & Ernährung</h1>
          <p className="mt-1 text-slate-400">Kalorienbudget, Makros, Training und Tageswerte auf einen Blick.</p>
        </div>
        <DatumWaehler datum={datum} heute={heute} />
      </div>

      {!tag.profil || tag.gewichtKg == null ? (
        <Card className="border-blue-900/50 bg-blue-950/10">
          <CardTitle>Los geht’s</CardTitle>
          <p className="text-sm text-slate-300">
            {!tag.profil
              ? "Hinterlege einmalig Größe, Geburtsjahr, Gewicht und dein Ziel — dann berechnet das Tool deinen Kalorien- und Makrobedarf."
              : "Trage dein aktuelles Gewicht ein, damit Kalorienziel und Trainingsverbrauch berechnet werden können."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={!tag.profil ? "/fitness/profil" : "/fitness/gewicht"}>
              <Button size="sm">{!tag.profil ? "Ziele & Körperdaten anlegen" : "Gewicht eintragen"}</Button>
            </Link>
          </div>
        </Card>
      ) : null}

      {bilanz && energiebedarf && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kennzahl label="Kalorienziel" wert={formatKcal(bilanz.kalorienziel)} hinweis={`Gewicht ${formatKg(tag.gewichtKg!)}`} />
          <Kennzahl label="Gegessen" wert={formatKcal(bilanz.zugefuehrt.kcal)} hinweis={tag.mahlzeiten.length === 1 ? "1 Eintrag" : `${tag.mahlzeiten.length} Einträge`} />
          <Kennzahl
            label="Training"
            wert={`+ ${formatKcal(bilanz.trainingsverbrauchKcal)}`}
            hinweis={tag.profil?.trainingskalorienAnrechnen ? "aufs Budget angerechnet" : "nicht angerechnet"}
          />
          <Kennzahl
            label={bilanz.ueberBudget ? "Über Budget" : "Verbleibend"}
            wert={formatKcal(Math.abs(bilanz.verbleibend))}
            hinweis={`Budget ${formatKcal(bilanz.budget)}`}
            warnung={bilanz.ueberBudget}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {bilanz && (
          <Card>
            <CardTitle>Kalorien & Makros</CardTitle>
            <div className="flex flex-col gap-4">
              <Fortschritt label="Kalorien" ist={bilanz.zugefuehrt.kcal} ziel={bilanz.budget} einheit="kcal" />
              <Fortschritt label="Protein" ist={bilanz.makros.protein.ist} ziel={bilanz.makros.protein.ziel} einheit="g" />
              <Fortschritt label="Kohlenhydrate" ist={bilanz.makros.kohlenhydrate.ist} ziel={bilanz.makros.kohlenhydrate.ziel} einheit="g" />
              <Fortschritt label="Fett" ist={bilanz.makros.fett.ist} ziel={bilanz.makros.fett.ziel} einheit="g" />
            </div>
          </Card>
        )}

        <TageswerteCard
          key={datum}
          datum={datum}
          aktivitaet={tag.aktivitaet}
          wasserZielMl={tag.wasserZielMl}
          schritteZiel={tag.schritteZiel}
        />
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-100">Mahlzeiten</h2>
          <Link href={datum === heute ? "/fitness/ernaehrung" : `/fitness/ernaehrung?datum=${datum}`}>
            <Button size="sm">Essen eintragen</Button>
          </Link>
        </div>
        <MahlzeitenListe mahlzeiten={tag.mahlzeiten} />
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-100">Training</h2>
            <Link href="/fitness/training">
              <Button size="sm" variant="secondary">
                Training eintragen
              </Button>
            </Link>
          </div>
          {tag.trainings.length === 0 ? (
            <p className="text-sm text-slate-400">Kein Training an diesem Tag.</p>
          ) : (
            <ul className="divide-y divide-slate-800/60">
              {tag.trainings.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                  <div>
                    <span className="text-slate-200">{SPORTART_LABELS[t.sportart]}</span>
                    <span className="text-slate-400">
                      {" "}
                      · {t.dauerMin} min · {INTENSITAET_LABELS[t.intensitaet]}
                      {t.distanzKm != null ? ` · ${formatNumber(t.distanzKm, 1)} km` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="tabular-nums text-slate-300">{formatKcal(t.verbrauch.kcal)}</span>
                    <LoeschenButton art="training" id={t.id} bezeichnung={SPORTART_LABELS[t.sportart]} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardTitle>Letzte 7 Tage</CardTitle>
          <FitnessWochenChart daten={woche.tage.map((t) => ({ datum: t.datum, zugefuehrt: t.zugefuehrt?.kcal ?? null, budget: t.budget > 0 ? t.budget : null }))} />
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-slate-400">Ø Zufuhr</dt>
            <dd className="text-right tabular-nums text-slate-200">
              {woche.statistik.durchschnittKcal == null ? "—" : formatKcal(woche.statistik.durchschnittKcal)}
            </dd>
            <dt className="text-slate-400">Tage im Zielkorridor (±10 %)</dt>
            <dd className="text-right tabular-nums text-slate-200">
              {woche.statistik.tageImZielkorridor} / {woche.statistik.tageMitErnaehrung}
            </dd>
            <dt className="text-slate-400">Bilanz (protokollierte Tage, inkl. laufendem Tag)</dt>
            <dd className="text-right tabular-nums text-slate-200">
              {formatKcal(woche.statistik.bilanzKcal)} ≈ {formatNumber(woche.statistik.rechnerischeVeraenderungKg, 2)} kg
            </dd>
            <dt className="text-slate-400">Training</dt>
            <dd className="text-right tabular-nums text-slate-200">
              {woche.statistik.trainingAnzahl}× · {woche.statistik.trainingMinuten} min
            </dd>
          </dl>
        </Card>
      </div>
    </>
  );
}
