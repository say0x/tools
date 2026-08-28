"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { aktualisiereGrunderwerbsteuer } from "@/server/actions/reference-data";
import { BUNDESLAND_LABELS } from "@/lib/labels";
import type { Bundesland } from "@/server/calc/types";

type Row = { id: string; bundesland: Bundesland; satzProzent: number };

export function GrunderwerbsteuerTable({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [savedRows, setSavedRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();
  const [gespeichert, setGespeichert] = useState(false);
  const [serverFehler, setServerFehler] = useState<string | null>(null);
  const isDirty = JSON.stringify(rows) !== JSON.stringify(savedRows);

  const save = () => {
    setServerFehler(null);
    startTransition(async () => {
      const result = await aktualisiereGrunderwerbsteuer(rows.map((r) => ({ id: r.id, satzProzent: r.satzProzent })));
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
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        {rows.map((row, i) => (
          <div key={row.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="text-slate-400">{BUNDESLAND_LABELS[row.bundesland]}</span>
            <div className="relative w-20">
              <Input
                type="number"
                step="any"
                aria-label={`${BUNDESLAND_LABELS[row.bundesland]} – Grunderwerbsteuersatz in Prozent`}
                value={row.satzProzent}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = { ...row, satzProzent: Number(e.target.value) || 0 };
                  setRows(next);
                }}
              />
            </div>
          </div>
        ))}
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
