"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { aktualisiereGewerkKosten } from "@/server/actions/reference-data";
import { GEWERK_LABELS } from "@/lib/labels";
import type { Gewerk } from "@/server/calc/types";

type Row = { id: string; gewerk: Gewerk; kostenProM2Min: number; kostenProM2Max: number };

export function GewerkKostenTable({ initialRows }: { initialRows: Row[] }) {
  const [rows, setRows] = useState(initialRows);
  const [savedRows, setSavedRows] = useState(initialRows);
  const [isPending, startTransition] = useTransition();
  const [gespeichert, setGespeichert] = useState(false);
  const [serverFehler, setServerFehler] = useState<string | null>(null);
  const isDirty = JSON.stringify(rows) !== JSON.stringify(savedRows);

  const update = (id: string, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const save = () => {
    setServerFehler(null);
    startTransition(async () => {
      const result = await aktualisiereGewerkKosten(
        rows.map((r) => ({ id: r.id, kostenProM2Min: r.kostenProM2Min, kostenProM2Max: r.kostenProM2Max }))
      );
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-400">{GEWERK_LABELS[row.gewerk]}</span>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                step="any"
                className="w-20"
                aria-label={`${GEWERK_LABELS[row.gewerk]} – Kosten pro m² Minimum in Euro`}
                value={row.kostenProM2Min}
                onChange={(e) => update(row.id, { kostenProM2Min: Number(e.target.value) || 0 })}
              />
              <span className="text-slate-600" aria-hidden="true">–</span>
              <Input
                type="number"
                step="any"
                className="w-20"
                aria-label={`${GEWERK_LABELS[row.gewerk]} – Kosten pro m² Maximum in Euro`}
                value={row.kostenProM2Max}
                onChange={(e) => update(row.id, { kostenProM2Max: Number(e.target.value) || 0 })}
              />
              <span className="text-xs text-slate-400">€/m²</span>
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
