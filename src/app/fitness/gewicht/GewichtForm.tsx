"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { speichereGewicht } from "@/server/actions/fitness";
import { zahlOderNull } from "../_components/zahl";

export function GewichtForm({ heute, letztesGewicht }: { heute: string; letztesGewicht: number | null }) {
  const [datum, setDatum] = useState(heute);
  const [gewicht, setGewicht] = useState("");
  const [koerperfett, setKoerperfett] = useState("");
  const [notiz, setNotiz] = useState("");
  const [isPending, startTransition] = useTransition();
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);

  const speichern = () =>
    startTransition(async () => {
      const r = await speichereGewicht({ datum, gewichtKg: zahlOderNull(gewicht), koerperfettProzent: zahlOderNull(koerperfett), notiz });
      setMeldung(r.success ? { ok: true, text: "Gespeichert." } : { ok: false, text: r.error });
      if (r.success) {
        setGewicht("");
        setKoerperfett("");
        setNotiz("");
      }
    });

  return (
    <Card>
      <CardTitle>Gewicht eintragen</CardTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Datum">
          <Input type="date" value={datum} max={heute} onChange={(e) => setDatum(e.target.value)} />
        </Field>
        <Field label="Gewicht (kg)">
          <Input inputMode="decimal" value={gewicht} onChange={(e) => setGewicht(e.target.value)} placeholder={letztesGewicht ? String(letztesGewicht) : "z. B. 80,4"} />
        </Field>
        <Field label="Körperfett (%)">
          <Input inputMode="decimal" value={koerperfett} onChange={(e) => setKoerperfett(e.target.value)} placeholder="optional" />
        </Field>
        <Field label="Notiz">
          <Input value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder="optional" />
        </Field>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button type="button" onClick={speichern} disabled={isPending}>
          {isPending ? "Speichert…" : "Speichern"}
        </Button>
        {meldung && (
          <span role="status" className={meldung.ok ? "text-sm text-emerald-400" : "text-sm text-red-400"}>
            {meldung.text}
          </span>
        )}
      </div>
      <p className="mt-3 text-xs text-slate-400">
        Ein Wert pro Tag — erneutes Speichern für dasselbe Datum überschreibt ihn. Tipp: immer morgens nach dem Aufstehen wiegen.
      </p>
    </Card>
  );
}
