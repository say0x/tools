"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import {
  WETTKAMPF_DISTANZEN_KM,
  berechneHerzfrequenzzonen,
  formatDauer,
  geschwindigkeitKmh,
  gewichtFuerWiederholungen,
  maximalpulsTanaka,
  paceSekundenProKm,
  parseDauer,
  riegelPrognoseSekunden,
  schaetzeEinerMaximum,
} from "@/server/calc/fitness/sportrechner";
import { formatNumber } from "@/lib/format";
import { zahlOderNull } from "../_components/zahl";

export function SportRechnerClient({ alterInitial, ruhepulsInitial }: { alterInitial: number | null; ruhepulsInitial: number | null }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <PaceRechner />
      <PulsRechner alterInitial={alterInitial} ruhepulsInitial={ruhepulsInitial} />
      <EinerMaxRechner />
    </div>
  );
}

function PaceRechner() {
  const [distanz, setDistanz] = useState("10");
  const [zeit, setZeit] = useState("50:00");
  const km = zahlOderNull(distanz);
  const sekunden = parseDauer(zeit);
  const gueltig = km != null && km > 0 && sekunden != null && sekunden > 0;

  return (
    <Card className="lg:col-span-2">
      <CardTitle>Lauf-Pace & Wettkampfprognose</CardTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Distanz (km)">
          <Input inputMode="decimal" value={distanz} onChange={(e) => setDistanz(e.target.value)} />
        </Field>
        <Field label="Zeit (h:mm:ss oder mm:ss)">
          <Input value={zeit} onChange={(e) => setZeit(e.target.value)} />
        </Field>
        <Ergebnis label="Pace" wert={gueltig ? `${formatDauer(paceSekundenProKm(km!, sekunden!))} min/km` : "—"} />
        <Ergebnis label="Tempo" wert={gueltig ? `${formatNumber(geschwindigkeitKmh(km!, sekunden!), 1)} km/h` : "—"} />
      </div>
      {gueltig && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="pb-2 pr-3 font-medium">Strecke</th>
                <th className="pb-2 pr-3 text-right font-medium">Prognose (Riegel)</th>
                <th className="pb-2 text-right font-medium">Pace</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {WETTKAMPF_DISTANZEN_KM.map((d) => {
                const prognose = riegelPrognoseSekunden(km!, sekunden!, d.km);
                return (
                  <tr key={d.label}>
                    <td className="py-1.5 pr-3 text-slate-300">{d.label}</td>
                    <td className="py-1.5 pr-3 text-right tabular-nums text-slate-100">{formatDauer(prognose)}</td>
                    <td className="py-1.5 text-right tabular-nums text-slate-300">{formatDauer(paceSekundenProKm(d.km, prognose))} min/km</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-2 text-xs text-slate-400">
            Riegel-Formel T₂ = T₁ · (D₂/D₁)^1,06 — setzt passendes Ausdauertraining für die längere Strecke voraus; für den Marathon
            meist zu optimistisch, wenn die Wochenumfänge fehlen.
          </p>
        </div>
      )}
    </Card>
  );
}

function PulsRechner({ alterInitial, ruhepulsInitial }: { alterInitial: number | null; ruhepulsInitial: number | null }) {
  const [alter, setAlter] = useState(alterInitial != null ? String(alterInitial) : "35");
  const [maxPuls, setMaxPuls] = useState("");
  const [ruhepuls, setRuhepuls] = useState(ruhepulsInitial != null ? String(ruhepulsInitial) : "");

  const alterZahl = zahlOderNull(alter);
  const maxEigen = zahlOderNull(maxPuls);
  const hfMax = maxEigen ?? (alterZahl != null ? maximalpulsTanaka(alterZahl) : null);
  const ruhe = zahlOderNull(ruhepuls);
  const zonen = hfMax && hfMax > 0 ? berechneHerzfrequenzzonen(hfMax, ruhe) : [];

  return (
    <Card>
      <CardTitle>Herzfrequenzzonen</CardTitle>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Alter">
          <Input inputMode="numeric" value={alter} onChange={(e) => setAlter(e.target.value)} />
        </Field>
        <Field label="Max-Puls" hint="leer = Tanaka">
          <Input inputMode="numeric" value={maxPuls} onChange={(e) => setMaxPuls(e.target.value)} placeholder={alterZahl != null ? String(maximalpulsTanaka(alterZahl)) : ""} />
        </Field>
        <Field label="Ruhepuls" hint="für Karvonen">
          <Input inputMode="numeric" value={ruhepuls} onChange={(e) => setRuhepuls(e.target.value)} placeholder="optional" />
        </Field>
      </div>
      {zonen.length > 0 && (
        <table className="mt-4 w-full text-sm">
          <tbody className="divide-y divide-slate-800">
            {zonen.map((z) => (
              <tr key={z.zone}>
                <td className="py-1.5 pr-3 text-slate-400">Zone {z.zone}</td>
                <td className="py-1.5 pr-3 text-slate-200">{z.name}</td>
                <td className="py-1.5 pr-3 text-right text-xs text-slate-400">
                  {z.vonProzent}–{z.bisProzent} %
                </td>
                <td className="py-1.5 text-right tabular-nums text-slate-100">
                  {z.vonBpm}–{z.bisBpm} bpm
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-2 text-xs text-slate-400">
        {ruhe ? "Karvonen-Methode (Herzfrequenzreserve)" : "Prozent der maximalen Herzfrequenz"} · HFmax {hfMax ?? "—"} bpm. Formeln streuen
        individuell um ±10 bpm — ein Laktat- oder Belastungstest ist genauer.
      </p>
    </Card>
  );
}

function EinerMaxRechner() {
  const [gewicht, setGewicht] = useState("80");
  const [wdh, setWdh] = useState("8");
  const g = zahlOderNull(gewicht);
  const w = zahlOderNull(wdh);
  const ergebnis = g != null && g > 0 && w != null && w >= 1 ? schaetzeEinerMaximum(g, Math.round(w)) : null;

  return (
    <Card>
      <CardTitle>Maximalkraft (1RM)</CardTitle>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Gewicht (kg)">
          <Input inputMode="decimal" value={gewicht} onChange={(e) => setGewicht(e.target.value)} />
        </Field>
        <Field label="Wiederholungen">
          <Input inputMode="numeric" value={wdh} onChange={(e) => setWdh(e.target.value)} />
        </Field>
      </div>
      {ergebnis && (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Ergebnis label="Epley" wert={`${formatNumber(ergebnis.epley, 1)} kg`} />
            <Ergebnis label="Brzycki" wert={ergebnis.brzycki == null ? "—" : `${formatNumber(ergebnis.brzycki, 1)} kg`} />
            <Ergebnis label="Mittelwert" wert={`${formatNumber(ergebnis.mittelwert, 1)} kg`} />
          </div>
          <table className="mt-4 w-full text-sm">
            <tbody className="divide-y divide-slate-800">
              {[1, 3, 5, 8, 10, 12, 15].map((r) => (
                <tr key={r}>
                  <td className="py-1 pr-3 text-slate-400">{r} Wdh.</td>
                  <td className="py-1 text-right tabular-nums text-slate-200">{formatNumber(gewichtFuerWiederholungen(ergebnis.mittelwert, r), 1)} kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      <p className="mt-2 text-xs text-slate-400">Am genauesten bei 3–10 Wiederholungen bis kurz vor Muskelversagen.</p>
    </Card>
  );
}

function Ergebnis({ label, wert }: { label: string; wert: string }) {
  return (
    <div className="flex flex-col justify-end">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-semibold tabular-nums text-slate-100">{wert}</div>
    </div>
  );
}
