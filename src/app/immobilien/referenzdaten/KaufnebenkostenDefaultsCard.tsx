"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { aktualisiereKaufnebenkostenDefaults } from "@/server/actions/reference-data";

export function KaufnebenkostenDefaultsCard({
  initialNotarProzent,
  initialGrundbuchProzent,
}: {
  initialNotarProzent: number;
  initialGrundbuchProzent: number;
}) {
  const [notarProzent, setNotarProzent] = useState(initialNotarProzent);
  const [grundbuchProzent, setGrundbuchProzent] = useState(initialGrundbuchProzent);
  const [saved, setSaved] = useState({ notarProzent: initialNotarProzent, grundbuchProzent: initialGrundbuchProzent });
  const [isPending, startTransition] = useTransition();
  const [gespeichert, setGespeichert] = useState(false);
  const isDirty = notarProzent !== saved.notarProzent || grundbuchProzent !== saved.grundbuchProzent;

  const save = () => {
    startTransition(async () => {
      await aktualisiereKaufnebenkostenDefaults({ notarProzent, grundbuchProzent });
      setSaved({ notarProzent, grundbuchProzent });
      setGespeichert(true);
      setTimeout(() => setGespeichert(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-md">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-300">Notar (%)</span>
          <Input
            type="number"
            step="any"
            value={notarProzent}
            onChange={(e) => setNotarProzent(Number(e.target.value) || 0)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-300">Grundbuch (%)</span>
          <Input
            type="number"
            step="any"
            value={grundbuchProzent}
            onChange={(e) => setGrundbuchProzent(Number(e.target.value) || 0)}
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" size="sm" disabled={isPending} onClick={save}>
          {isPending ? "Speichert…" : "Speichern"}
        </Button>
        {gespeichert && <span className="text-sm text-emerald-400">Gespeichert.</span>}
        {!gespeichert && isDirty && <span className="text-sm text-amber-400">Ungespeicherte Änderungen</span>}
      </div>
    </div>
  );
}
