"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { addiereWasser, aktualisiereTagesAktivitaet } from "@/server/actions/fitness";
import type { TagesAktivitaetInput } from "@/server/calc/fitness/types";
import { formatLiter } from "@/lib/fitness-labels";
import { Fortschritt } from "./Fortschritt";
import { zahlAlsText, zahlOderNull } from "./zahl";

export function TageswerteCard({
  datum,
  aktivitaet,
  wasserZielMl,
  schritteZiel,
}: {
  datum: string;
  aktivitaet: TagesAktivitaetInput | null;
  wasserZielMl: number | null;
  schritteZiel: number | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [fehler, setFehler] = useState<string | null>(null);
  const [schritte, setSchritte] = useState(zahlAlsText(aktivitaet?.schritte));
  const [schlaf, setSchlaf] = useState(zahlAlsText(aktivitaet?.schlafStunden));
  const [ruhepuls, setRuhepuls] = useState(zahlAlsText(aktivitaet?.ruhepuls));

  const wasser = (ml: number) =>
    startTransition(async () => {
      setFehler(null);
      const r = await addiereWasser({ datum, ml });
      if (!r.success) setFehler(r.error);
    });

  const speichern = () =>
    startTransition(async () => {
      setFehler(null);
      const r = await aktualisiereTagesAktivitaet({
        datum,
        schritte: zahlOderNull(schritte) == null ? null : Math.round(zahlOderNull(schritte)!),
        schlafStunden: zahlOderNull(schlaf),
        ruhepuls: zahlOderNull(ruhepuls) == null ? null : Math.round(zahlOderNull(ruhepuls)!),
      });
      if (!r.success) setFehler(r.error);
    });

  return (
    <Card>
      <CardTitle>Wasser, Schritte & Erholung</CardTitle>
      <div className="flex flex-col gap-4">
        <Fortschritt label="Wasser" ist={aktivitaet?.wasserMl ?? 0} ziel={wasserZielMl ?? 0} einheit="" formatieren={formatLiter} />
        <div className="flex flex-wrap gap-2">
          {[250, 500].map((ml) => (
            <Button key={ml} type="button" size="sm" variant="secondary" disabled={isPending} onClick={() => wasser(ml)}>
              + {ml} ml
            </Button>
          ))}
          <Button type="button" size="sm" variant="ghost" disabled={isPending || !aktivitaet?.wasserMl} onClick={() => wasser(-250)}>
            − 250 ml
          </Button>
        </div>
        {schritteZiel != null && schritteZiel > 0 && (
          <Fortschritt
            label="Schritte"
            ist={aktivitaet?.schritte ?? 0}
            ziel={schritteZiel}
            einheit=""
            formatieren={(n) => new Intl.NumberFormat("de-DE").format(Math.round(n))}
          />
        )}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Schritte">
            <Input inputMode="numeric" value={schritte} onChange={(e) => setSchritte(e.target.value)} placeholder="—" />
          </Field>
          <Field label="Schlaf (h)">
            <Input inputMode="decimal" value={schlaf} onChange={(e) => setSchlaf(e.target.value)} placeholder="—" />
          </Field>
          <Field label="Ruhepuls">
            <Input inputMode="numeric" value={ruhepuls} onChange={(e) => setRuhepuls(e.target.value)} placeholder="—" />
          </Field>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" size="sm" onClick={speichern} disabled={isPending}>
            Tageswerte speichern
          </Button>
          {fehler && (
            <span role="alert" className="text-sm text-red-400">
              {fehler}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400">
          Schritte sind rein informativ und erhöhen dein Kalorienbudget nicht — die Alltagsbewegung steckt schon im Aktivitätslevel. Per
          Home-Assistant/API lassen sich diese Werte automatisch befüllen.
        </p>
      </div>
    </Card>
  );
}
