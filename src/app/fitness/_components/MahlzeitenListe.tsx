import { MAHLZEITEN } from "@/server/calc/fitness/types";
import type { MahlzeitZeile } from "@/server/data/fitness";
import { DATEN_QUELLE_LABELS, KI_KONFIDENZ_LABELS, MAHLZEIT_LABELS, formatGramm, formatKcal } from "@/lib/fitness-labels";
import { formatNumber } from "@/lib/format";
import { LoeschenButton } from "./LoeschenButton";

export function MahlzeitenListe({ mahlzeiten }: { mahlzeiten: MahlzeitZeile[] }) {
  if (mahlzeiten.length === 0) return <p className="text-sm text-slate-400">Noch nichts eingetragen.</p>;

  return (
    <div className="flex flex-col gap-4">
      {MAHLZEITEN.filter((m) => mahlzeiten.some((e) => e.mahlzeit === m)).map((m) => {
        const eintraege = mahlzeiten.filter((e) => e.mahlzeit === m);
        const summe = eintraege.reduce((s, e) => s + e.kcal, 0);
        return (
          <div key={m}>
            <div className="flex justify-between border-b border-slate-800 pb-1 text-sm">
              <span className="font-medium text-slate-200">{MAHLZEIT_LABELS[m]}</span>
              <span className="tabular-nums text-slate-400">{formatKcal(summe)}</span>
            </div>
            <ul className="mt-1 divide-y divide-slate-800/60">
              {eintraege.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                  <div className="min-w-0">
                    <span className="text-slate-200">{e.bezeichnung}</span>
                    {e.mengeG != null && <span className="text-slate-400"> · {formatGramm(e.mengeG)}</span>}
                    {e.quelle !== "MANUELL" && (
                      <span className="ml-2 rounded border border-slate-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                        {DATEN_QUELLE_LABELS[e.quelle]}
                        {e.kiKonfidenz ? ` · ${KI_KONFIDENZ_LABELS[e.kiKonfidenz]}` : ""}
                      </span>
                    )}
                    <div className="text-xs text-slate-400">
                      P {formatNumber(e.proteinG, 0)} g · KH {formatNumber(e.kohlenhydrateG, 0)} g · F {formatNumber(e.fettG, 0)} g
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="tabular-nums text-slate-300">{formatKcal(e.kcal)}</span>
                    <LoeschenButton art="mahlzeit" id={e.id} bezeichnung={e.bezeichnung} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
