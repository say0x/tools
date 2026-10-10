import { Card, CardTitle } from "@/components/ui/Card";
import { getActiveUserId } from "@/server/session";
import { ladeFitnessZeitraum, ladeGewichte, ladeTrainings, REFERENZGEWICHT_KG } from "@/server/data/fitness";
import { addiereTage, heuteIso } from "@/server/calc/fitness/datum";
import { INTENSITAET_LABELS, SPORTART_LABELS, formatDatumLang, formatKcal } from "@/lib/fitness-labels";
import { formatNumber } from "@/lib/format";
import { LoeschenButton } from "../_components/LoeschenButton";
import { Kennzahl } from "../_components/Kennzahl";
import { TrainingForm } from "./TrainingForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fitness — Training" };

export default async function TrainingPage() {
  const userId = await getActiveUserId();
  const heute = heuteIso();
  const [trainings, gewichte, woche, monat] = await Promise.all([
    ladeTrainings(userId, addiereTage(heute, -29), heute),
    ladeGewichte(userId, { bis: heute }),
    ladeFitnessZeitraum(userId, heute, 7),
    ladeFitnessZeitraum(userId, heute, 30),
  ]);
  const gewichtKg = gewichte.at(-1)?.gewichtKg ?? null;

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Training</h1>
        <p className="mt-1 text-slate-400">Sporteinheiten erfassen — der Mehrverbrauch wird auf dein Tagesbudget angerechnet.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kennzahl label="Einheiten (7 Tage)" wert={String(woche.statistik.trainingAnzahl)} />
        <Kennzahl label="Minuten (7 Tage)" wert={`${woche.statistik.trainingMinuten} min`} hinweis="WHO: ≥ 150 min moderat/Woche" />
        <Kennzahl label="Einheiten (30 Tage)" wert={String(monat.statistik.trainingAnzahl)} />
        <Kennzahl label="Mehrverbrauch (30 Tage)" wert={formatKcal(monat.statistik.trainingKcal)} />
      </div>

      <TrainingForm heute={heute} gewichtKg={gewichtKg ?? REFERENZGEWICHT_KG} gewichtBekannt={gewichtKg != null} />

      <Card>
        <CardTitle>Letzte 30 Tage</CardTitle>
        {trainings.length === 0 ? (
          <p className="text-sm text-slate-400">Noch keine Trainings in den letzten 30 Tagen.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="pb-2 pr-3 font-medium">Datum</th>
                  <th className="pb-2 pr-3 font-medium">Sportart</th>
                  <th className="pb-2 pr-3 text-right font-medium">Dauer</th>
                  <th className="pb-2 pr-3 text-right font-medium">Distanz</th>
                  <th className="pb-2 pr-3 text-right font-medium">Mehrverbrauch</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {trainings.map((t) => (
                  <tr key={t.id}>
                    <td className="py-1.5 pr-3 text-slate-300">{formatDatumLang(t.datum)}</td>
                    <td className="py-1.5 pr-3 text-slate-200">
                      {SPORTART_LABELS[t.sportart]} <span className="text-xs text-slate-400">· {INTENSITAET_LABELS[t.intensitaet]}</span>
                      {t.notiz && <div className="text-xs text-slate-400">{t.notiz}</div>}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-slate-300">{t.dauerMin} min</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-slate-300">{t.distanzKm != null ? `${formatNumber(t.distanzKm, 1)} km` : "—"}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-slate-300">
                      {formatKcal(t.verbrauch.kcal)}
                      {t.verbrauch.methode === "MANUELL" && <span className="ml-1 text-xs text-slate-400">(eigener Wert)</span>}
                    </td>
                    <td className="py-1.5 text-right">
                      <LoeschenButton art="training" id={t.id} bezeichnung={`${SPORTART_LABELS[t.sportart]} am ${formatDatumLang(t.datum)}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
