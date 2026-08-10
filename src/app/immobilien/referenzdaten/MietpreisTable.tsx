"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { aktualisiereMietpreise } from "@/server/actions/reference-data";
import { BUNDESLAND_LABELS, LAGETYP_LABELS } from "@/lib/labels";
import { BUNDESLAENDER, LAGETYPEN, type Bundesland, type Lagetyp } from "@/server/calc/types";

type Row = { id: string; bundesland: Bundesland; lagetyp: Lagetyp; mietpreisProM2: number };

export function MietpreisTable({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();
  const [gespeichert, setGespeichert] = useState(false);

  const update = (id: string, value: number) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, mietpreisProM2: value } : r)));
  };

  const save = () => {
    startTransition(async () => {
      await aktualisiereMietpreise(rows.map((r) => ({ id: r.id, mietpreisProM2: r.mietpreisProM2 })));
      setGespeichert(true);
      setTimeout(() => setGespeichert(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="pb-2 pr-4 font-medium">Bundesland</th>
              {LAGETYPEN.map((l) => (
                <th key={l} className="pb-2 pr-4 font-medium">
                  {LAGETYP_LABELS[l]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {BUNDESLAENDER.map((b) => (
              <tr key={b}>
                <td className="py-1.5 pr-4 text-slate-400">{BUNDESLAND_LABELS[b]}</td>
                {LAGETYPEN.map((l) => {
                  const row = rows.find((r) => r.bundesland === b && r.lagetyp === l);
                  if (!row) return <td key={l} />;
                  return (
                    <td key={l} className="py-1.5 pr-4">
                      <Input
                        type="number"
                        step="any"
                        className="w-24"
                        value={row.mietpreisProM2}
                        onChange={(e) => update(row.id, Number(e.target.value) || 0)}
                      />
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
      </div>
    </div>
  );
}
