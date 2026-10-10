import dynamicImport from "next/dynamic";
import { Card, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { getActiveUserId } from "@/server/session";
import { ladeFitnessProfil, ladeGewichtsverlauf } from "@/server/data/fitness";
import { heuteIso } from "@/server/calc/fitness/datum";
import { berechneBmi } from "@/server/calc/fitness/energiebedarf";
import {
  BMI_KATEGORIE_LABELS,
  DATEN_QUELLE_LABELS,
  PROGNOSE_LABELS,
  formatDatumLang,
  formatKg,
  formatKgDifferenz,
} from "@/lib/fitness-labels";
import { formatNumber } from "@/lib/format";
import { LoeschenButton } from "../_components/LoeschenButton";
import { Kennzahl } from "../_components/Kennzahl";
import { GewichtForm } from "./GewichtForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fitness — Gewicht" };

const GewichtChart = dynamicImport(() => import("@/components/charts/GewichtChart").then((m) => m.GewichtChart), {
  loading: () => <Skeleton className="h-[280px] w-full" />,
});

export default async function GewichtPage() {
  const userId = await getActiveUserId();
  const heute = heuteIso();
  const [verlauf, profil] = await Promise.all([ladeGewichtsverlauf(userId, heute), ladeFitnessProfil(userId)]);
  const zielGewichtKg = profil?.zielGewichtKg ?? null;
  const bmi = verlauf.aktuellGeglaettetKg != null && profil ? berechneBmi(verlauf.aktuellGeglaettetKg, profil.groesseCm) : null;
  const letzte90 = verlauf.punkte.slice(-90);

  return (
    <>
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Gewicht</h1>
        <p className="mt-1 text-slate-400">Verlauf, Trend und Prognose — geglättet über 7 Tage, weil Tageswerte stark schwanken.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kennzahl
          label="Aktuell (7-Tage-Ø)"
          wert={verlauf.aktuellGeglaettetKg == null ? "—" : formatKg(verlauf.aktuellGeglaettetKg)}
          hinweis={verlauf.aktuellKg == null ? "noch keine Messung" : `letzte Messung ${formatKg(verlauf.aktuellKg)}`}
        />
        <Kennzahl
          label="Veränderung 7 / 30 Tage"
          wert={verlauf.veraenderung7TageKg == null ? "—" : formatKgDifferenz(verlauf.veraenderung7TageKg)}
          hinweis={verlauf.veraenderung30TageKg == null ? "30 Tage: —" : `30 Tage: ${formatKgDifferenz(verlauf.veraenderung30TageKg)}`}
        />
        <Kennzahl
          label="Trend"
          wert={verlauf.trendKgProWoche == null ? "—" : `${formatKgDifferenz(verlauf.trendKgProWoche)}/Woche`}
          hinweis="Regression über 28 Tage"
        />
        <Kennzahl
          label="BMI"
          wert={bmi ? formatNumber(bmi.bmi, 1) : "—"}
          hinweis={bmi ? BMI_KATEGORIE_LABELS[bmi.kategorie] : "Größe im Profil hinterlegen"}
        />
      </div>

      {zielGewichtKg != null && (
        <Card className={verlauf.prognose.status === "FALSCHE_RICHTUNG" ? "border-amber-900/50 bg-amber-950/10" : undefined}>
          <div className="text-sm text-slate-300">
            <span className="font-medium text-slate-100">Ziel {formatKg(zielGewichtKg)}:</span> {PROGNOSE_LABELS[verlauf.prognose.status]}
            {verlauf.prognose.status === "IN_RICHTUNG" && verlauf.prognose.datum && (
              <>
                {" "}
                — bei gleichbleibendem Trend voraussichtlich um den <strong>{formatDatumLang(verlauf.prognose.datum)}</strong> (in{" "}
                {verlauf.prognose.tage} Tagen).
              </>
            )}
          </div>
        </Card>
      )}

      <GewichtForm heute={heute} letztesGewicht={verlauf.aktuellKg} />

      <Card>
        <CardTitle>Verlauf {letzte90.length < verlauf.punkte.length ? "(letzte 90 Messungen)" : ""}</CardTitle>
        {letzte90.length < 2 ? (
          <p className="text-sm text-slate-400">Ab zwei Messungen erscheint hier der Verlauf.</p>
        ) : (
          <GewichtChart punkte={letzte90} zielGewichtKg={zielGewichtKg} />
        )}
      </Card>

      {verlauf.eintraege.length > 0 && (
        <Card>
          <CardTitle>Messungen</CardTitle>
          <div className="max-h-96 overflow-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="pb-2 pr-3 font-medium">Datum</th>
                  <th className="pb-2 pr-3 text-right font-medium">Gewicht</th>
                  <th className="pb-2 pr-3 text-right font-medium">Körperfett</th>
                  <th className="pb-2 pr-3 font-medium">Quelle</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[...verlauf.eintraege].reverse().map((e) => (
                  <tr key={e.id}>
                    <td className="py-1.5 pr-3 text-slate-300">
                      {formatDatumLang(e.datum)}
                      {e.notiz && <div className="text-xs text-slate-400">{e.notiz}</div>}
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-slate-200">{formatKg(e.gewichtKg)}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-slate-300">
                      {e.koerperfettProzent != null ? `${formatNumber(e.koerperfettProzent, 1)} %` : "—"}
                    </td>
                    <td className="py-1.5 pr-3 text-xs text-slate-400">{DATEN_QUELLE_LABELS[e.quelle]}</td>
                    <td className="py-1.5 text-right">
                      <LoeschenButton art="gewicht" id={e.id} bezeichnung={`Messung vom ${formatDatumLang(e.datum)}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  );
}
