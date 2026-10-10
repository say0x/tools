import { Card, CardTitle } from "@/components/ui/Card";
import { getActiveUserId } from "@/server/session";
import { ladeFitnessTag, ladeLebensmittelKatalog } from "@/server/data/fitness";
import { heuteIso, istIsoDatum } from "@/server/calc/fitness/datum";
import { formatGramm, formatKcal } from "@/lib/fitness-labels";
import { DatumWaehler } from "../_components/DatumWaehler";
import { MahlzeitenListe } from "../_components/MahlzeitenListe";
import { ErnaehrungClient } from "./ErnaehrungClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fitness — Ernährung" };

export default async function ErnaehrungPage({ searchParams }: PageProps<"/fitness/ernaehrung">) {
  const params = await searchParams;
  const heute = heuteIso();
  const roh = typeof params.datum === "string" ? params.datum : null;
  const datum = roh && istIsoDatum(roh) && roh <= heute ? roh : heute;

  const userId = await getActiveUserId();
  const [tag, katalog] = await Promise.all([ladeFitnessTag(userId, datum), ladeLebensmittelKatalog(userId)]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Ernährungstagebuch</h1>
          <p className="mt-1 text-slate-400">
            {tag.bilanz
              ? `${formatKcal(tag.bilanz.zugefuehrt.kcal)} von ${formatKcal(tag.bilanz.budget)} — ${
                  tag.bilanz.ueberBudget ? `${formatKcal(-tag.bilanz.verbleibend)} drüber` : `${formatKcal(tag.bilanz.verbleibend)} übrig`
                }`
              : `${formatKcal(tag.zugefuehrt.kcal)} eingetragen`}
            {` · Protein ${formatGramm(tag.zugefuehrt.proteinG)}`}
          </p>
        </div>
        <DatumWaehler datum={datum} heute={heute} />
      </div>

      <ErnaehrungClient key={datum} datum={datum} katalog={katalog} />

      <Card>
        <CardTitle>Einträge an diesem Tag</CardTitle>
        <MahlzeitenListe mahlzeiten={tag.mahlzeiten} />
      </Card>

      <p className="text-xs text-slate-400">
        Nährwerte der Datenbank sind gerundete Richtwerte je 100 g (Sorten und Zubereitung schwanken um ±10–20 %). Für exakte Werte die
        Verpackungsangaben als eigenes Lebensmittel anlegen.
      </p>
    </>
  );
}
