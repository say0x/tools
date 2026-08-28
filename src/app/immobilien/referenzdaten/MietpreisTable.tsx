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
  const [savedRows, setSavedRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();
  const [gespeichert, setGespeichert] = useState(false);
  const [serverFehler, setServerFehler] = useState<string | null>(null);
  const isDirty = JSON.stringify(rows) !== JSON.stringify(savedRows);

  const update = (id: string, value: number) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, mietpreisProM2: value } : r)));
  };

  const save = () => {
    setServerFehler(null);
    startTransition(async () => {
      try {
        await aktualisiereMietpreise(rows.map((r) => ({ id: r.id, mietpreisProM2: r.mietpreisProM2 })));
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-slate-400">
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
                        aria-label={`${BUNDESLAND_LABELS[b]} – ${LAGETYP_LABELS[l]} – Mietpreis pro m² in Euro`}
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
        {!gespeichert && isDirty && <span className="text-sm text-amber-400">Ungespeicherte Änderungen</span>}
        {serverFehler && <span className="text-sm text-red-400">{serverFehler}</span>}
      </div>
    </div>
  );
}
