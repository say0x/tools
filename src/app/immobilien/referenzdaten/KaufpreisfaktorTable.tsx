"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { aktualisiereKaufpreisfaktoren } from "@/server/actions/reference-data";
import { LAGETYP_LABELS, OBJEKTTYP_LABELS } from "@/lib/labels";
import { LAGETYPEN, OBJEKTTYPEN, type Lagetyp, type Objekttyp } from "@/server/calc/types";

type Row = { id: string; objekttyp: Objekttyp; lagetyp: Lagetyp; kaufpreisfaktorReferenz: number };

export function KaufpreisfaktorTable({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [savedRows, setSavedRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();
  const [gespeichert, setGespeichert] = useState(false);
  const [serverFehler, setServerFehler] = useState<string | null>(null);
  const isDirty = JSON.stringify(rows) !== JSON.stringify(savedRows);

  const update = (id: string, value: number) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, kaufpreisfaktorReferenz: value } : r)));
  };

  const save = () => {
    setServerFehler(null);
    startTransition(async () => {
      try {
        await aktualisiereKaufpreisfaktoren(rows.map((r) => ({ id: r.id, kaufpreisfaktorReferenz: r.kaufpreisfaktorReferenz })));
        setSavedRows(rows);
        setGespeichert(true);
        setTimeout(() => setGespeichert(false), 2000);
      } catch (err) {
        setServerFehler(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-400">
        Vergleichswert für die Verhandlungs-Argumente auf der Objektseite. Bruttomietrendite ergibt sich als Kehrwert
        (100 / Kaufpreisfaktor) und wird automatisch angezeigt.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              <th className="pb-2 pr-4 font-medium">Objekttyp</th>
              {LAGETYPEN.map((l) => (
                <th key={l} className="pb-2 pr-4 font-medium">
                  {LAGETYP_LABELS[l]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {OBJEKTTYPEN.map((o) => (
              <tr key={o}>
                <td className="py-1.5 pr-4 text-slate-400">{OBJEKTTYP_LABELS[o]}</td>
                {LAGETYPEN.map((l) => {
                  const row = rows.find((r) => r.objekttyp === o && r.lagetyp === l);
                  if (!row) return <td key={l} />;
                  return (
                    <td key={l} className="py-1.5 pr-4">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="any"
                          className="w-20"
                          aria-label={`${OBJEKTTYP_LABELS[o]} – ${LAGETYP_LABELS[l]} – Kaufpreisfaktor-Referenz`}
                          value={row.kaufpreisfaktorReferenz}
                          onChange={(e) => update(row.id, Number(e.target.value) || 0)}
                        />
                        <span className="text-xs text-slate-400">
                          {row.kaufpreisfaktorReferenz > 0 ? `≈ ${(100 / row.kaufpreisfaktorReferenz).toFixed(1)}%` : ""}
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" size="sm" disabled={isPending} onClick={save}>
          {isPending ? "Speichert…" : "Speichern"}
        </Button>
        {gespeichert && <span className="text-sm text-emerald-400">Gespeichert.</span>}
        {!gespeichert && isDirty && <span className="text-sm text-amber-400">Ungespeicherte Änderungen</span>}
        {serverFehler && <span className="text-sm text-red-400">{serverFehler}</span>}
      </div>
    </div>
  );
}
