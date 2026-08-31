"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { aktualisiereBodenrichtwerte } from "@/server/actions/reference-data";
import { LAGETYP_LABELS } from "@/lib/labels";
import { LAGETYPEN, type Bundesland, type Lagetyp } from "@/server/calc/types";

type Row = { id: string; bundesland: Bundesland; lagetyp: Lagetyp; bodenrichtwertProM2: number };

// Aktuell nur Schleswig-Holstein (siehe docs/tools/immobilien-rechner.md) — anders
// als MietpreisTable deshalb keine Bundesland-Spalte, nur eine Zeile Lagetypen.
export function BodenrichtwertTable({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [savedRows, setSavedRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();
  const [gespeichert, setGespeichert] = useState(false);
  const [serverFehler, setServerFehler] = useState<string | null>(null);
  const isDirty = JSON.stringify(rows) !== JSON.stringify(savedRows);

  const update = (id: string, value: number) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, bodenrichtwertProM2: value } : r)));
  };

  const save = () => {
    setServerFehler(null);
    startTransition(async () => {
      const result = await aktualisiereBodenrichtwerte(rows.map((r) => ({ id: r.id, bodenrichtwertProM2: r.bodenrichtwertProM2 })));
      if (!result.success) {
        setServerFehler(result.error);
        return;
      }
      setSavedRows(rows);
      setGespeichert(true);
      setTimeout(() => setGespeichert(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-400">Aktuell nur Schleswig-Holstein hinterlegt.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] text-sm">
          <thead>
            <tr className="text-left text-slate-400">
              {LAGETYPEN.map((l) => (
                <th key={l} className="pb-2 pr-4 font-medium">
                  {LAGETYP_LABELS[l]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            <tr>
              {LAGETYPEN.map((l) => {
                const row = rows.find((r) => r.lagetyp === l);
                if (!row) return <td key={l} />;
                return (
                  <td key={l} className="py-1.5 pr-4">
                    <Input
                      type="number"
                      step="any"
                      className="w-28"
                      aria-label={`${LAGETYP_LABELS[l]} – Bodenrichtwert pro m² in Euro`}
                      value={row.bodenrichtwertProM2}
                      onChange={(e) => update(row.id, Number(e.target.value) || 0)}
                    />
                  </td>
                );
              })}
            </tr>
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
