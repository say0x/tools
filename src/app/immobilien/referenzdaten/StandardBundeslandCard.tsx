"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { aktualisiereStandardBundesland } from "@/server/actions/reference-data";
import { BUNDESLAND_LABELS } from "@/lib/labels";
import { BUNDESLAENDER, type Bundesland } from "@/server/calc/types";

export function StandardBundeslandCard({ initialBundesland }: { initialBundesland: Bundesland | null }) {
  const [bundesland, setBundesland] = useState<Bundesland | "">(initialBundesland ?? "");
  const [isPending, startTransition] = useTransition();
  const [gespeichert, setGespeichert] = useState(false);

  const save = () => {
    startTransition(async () => {
      await aktualisiereStandardBundesland(bundesland === "" ? null : bundesland);
      setGespeichert(true);
      setTimeout(() => setGespeichert(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        Wird beim Anlegen eines neuen Objekts vorausgefüllt, bleibt aber pro Objekt frei änderbar.
      </p>
      <div className="max-w-xs">
        <Select value={bundesland} onChange={(e) => setBundesland(e.target.value as Bundesland | "")}>
          <option value="">Kein Standard</option>
          {BUNDESLAENDER.map((b) => (
            <option key={b} value={b}>
              {BUNDESLAND_LABELS[b]}
            </option>
          ))}
        </Select>
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
