"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { erstelleTraining } from "@/server/actions/fitness";
import { schaetzeTrainingsverbrauch } from "@/server/calc/fitness/training";
import { INTENSITAETEN, SPORTARTEN, type Intensitaet, type Sportart } from "@/server/calc/fitness/types";
import { INTENSITAET_LABELS, SPORTART_LABELS, formatKcal } from "@/lib/fitness-labels";
import { formatNumber } from "@/lib/format";
import { zahlOderNull } from "../_components/zahl";

const METHODEN_TEXT = {
  MET: "MET-Wert × Gewicht × Dauer",
  LAUFDISTANZ: "≈ 1 kcal je kg und km",
  RADTEMPO: "MET aus Durchschnittstempo",
  MANUELL: "manuell",
} as const;

export function TrainingForm({ heute, gewichtKg, gewichtBekannt }: { heute: string; gewichtKg: number; gewichtBekannt: boolean }) {
  const [datum, setDatum] = useState(heute);
  const [sportart, setSportart] = useState<Sportart>("LAUFEN");
  const [intensitaet, setIntensitaet] = useState<Intensitaet>("MITTEL");
  const [dauer, setDauer] = useState("45");
  const [distanz, setDistanz] = useState("");
  const [override, setOverride] = useState(false);
  const [kcal, setKcal] = useState("");
  const [puls, setPuls] = useState("");
  const [notiz, setNotiz] = useState("");
  const [isPending, startTransition] = useTransition();
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);

  const dauerMin = zahlOderNull(dauer);
  const distanzKm = zahlOderNull(distanz);
  const schaetzung = useMemo(
    () => (dauerMin && dauerMin > 0 ? schaetzeTrainingsverbrauch({ sportart, intensitaet, dauerMin, distanzKm }, gewichtKg) : null),
    [sportart, intensitaet, dauerMin, distanzKm, gewichtKg]
  );
  const mitDistanz = ["LAUFEN", "GEHEN", "WANDERN", "RADFAHREN", "SCHWIMMEN", "RUDERN"].includes(sportart);

  const speichern = () =>
    startTransition(async () => {
      const pulsWert = zahlOderNull(puls);
      const r = await erstelleTraining({
        datum,
        sportart,
        intensitaet,
        dauerMin: dauerMin == null ? null : Math.round(dauerMin),
        distanzKm: mitDistanz ? distanzKm : null,
        kcalOverride: override,
        kcalVerbrauch: override ? zahlOderNull(kcal) : null,
        durchschnittsPuls: pulsWert == null ? null : Math.round(pulsWert),
        notiz,
      });
      setMeldung(r.success ? { ok: true, text: "Training gespeichert." } : { ok: false, text: r.error });
      if (r.success) {
        setDistanz("");
        setKcal("");
        setPuls("");
        setNotiz("");
      }
    });

  return (
    <Card>
      <CardTitle>Training eintragen</CardTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Datum">
          <Input type="date" value={datum} max={heute} onChange={(e) => setDatum(e.target.value)} />
        </Field>
        <Field label="Sportart" className="col-span-1 sm:col-span-2">
          <Select value={sportart} onChange={(e) => setSportart(e.target.value as Sportart)}>
            {SPORTARTEN.map((s) => (
              <option key={s} value={s}>
                {SPORTART_LABELS[s]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Intensität">
          <Select value={intensitaet} onChange={(e) => setIntensitaet(e.target.value as Intensitaet)}>
            {INTENSITAETEN.map((i) => (
              <option key={i} value={i}>
                {INTENSITAET_LABELS[i]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Dauer (min)">
          <Input inputMode="numeric" value={dauer} onChange={(e) => setDauer(e.target.value)} />
        </Field>
        {mitDistanz && (
          <Field label="Distanz (km, optional)" hint={sportart === "LAUFEN" || sportart === "RADFAHREN" ? "Verbessert die Schätzung" : undefined}>
            <Input inputMode="decimal" value={distanz} onChange={(e) => setDistanz(e.target.value)} />
          </Field>
        )}
        <Field label="Ø Puls (optional)">
          <Input inputMode="numeric" value={puls} onChange={(e) => setPuls(e.target.value)} />
        </Field>
        <Field label="Notiz" className="col-span-2 sm:col-span-3">
          <Input value={notiz} onChange={(e) => setNotiz(e.target.value)} placeholder="optional, z. B. Intervalle 6×800 m" />
        </Field>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-md border border-slate-800 p-3">
        <div className="flex items-baseline justify-between gap-2 text-sm">
          <span className="text-slate-400">Geschätzter Mehrverbrauch</span>
          <span className="text-lg font-semibold tabular-nums text-slate-100">{schaetzung ? formatKcal(schaetzung.kcal) : "—"}</span>
        </div>
        {schaetzung && (
          <p className="text-xs text-slate-400">
            {METHODEN_TEXT[schaetzung.methode]}
            {schaetzung.met != null ? ` (MET ${formatNumber(schaetzung.met, 1)})` : ""}, abzüglich Ruheumsatz · Gewicht {formatNumber(gewichtKg, 1)} kg
            {!gewichtBekannt && " (Platzhalter — noch kein Gewicht erfasst)"}
          </p>
        )}
        <label className="flex items-center gap-3 text-sm text-slate-300">
          <Switch bare checked={override} onChange={(e) => setOverride(e.target.checked)} />
          Eigenen Wert verwenden (z. B. von der Sportuhr)
        </label>
        {override && (
          <Field label="Verbrauch (kcal)" hint="Sportuhren zeigen meist den Brutto-Verbrauch — für das Budget ggf. etwas abziehen.">
            <Input inputMode="decimal" value={kcal} onChange={(e) => setKcal(e.target.value)} />
          </Field>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button type="button" onClick={speichern} disabled={isPending}>
          {isPending ? "Speichert…" : "Training speichern"}
        </Button>
        {meldung && (
          <span role="status" className={meldung.ok ? "text-sm text-emerald-400" : "text-sm text-red-400"}>
            {meldung.text}
          </span>
        )}
      </div>
    </Card>
  );
}
