"use client";

import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { berechneSparpositionsverlauf } from "@/server/calc/rendite/portfolioverlauf";
import { findeJahrBisZielbetrag } from "@/server/calc/rendite/sparziel";
import { formatEuro } from "@/lib/format";

const HORIZONT_JAHRE = 40;

export function SparzielClient() {
  const [startkapital, setStartkapital] = useState(10000);
  const [sparrateMonatlich, setSparrateMonatlich] = useState(500);
  const [sparratenSteigerungProzent, setSparratenSteigerungProzent] = useState(0);
  const [renditeProzent, setRenditeProzent] = useState(6);
  const [zielbetrag, setZielbetrag] = useState(100000);

  const verlauf = useMemo(
    () =>
      berechneSparpositionsverlauf(
        {
          betrag: startkapital,
          renditeProzentJaehrlich: renditeProzent,
          sparplanBetragMonatlich: sparrateMonatlich,
          sparplanSteigerungProzentJaehrlich: sparratenSteigerungProzent,
        },
        HORIZONT_JAHRE
      ),
    [startkapital, sparrateMonatlich, sparratenSteigerungProzent, renditeProzent]
  );

  const jahrBisZiel = useMemo(() => findeJahrBisZielbetrag(verlauf, zielbetrag), [verlauf, zielbetrag]);

  const chartData = verlauf.map((wert, jahr) => ({ jahr, kapital: wert }));
  const endkapitalNach10Jahren = verlauf[Math.min(10, verlauf.length - 1)];
  const endkapitalNach20Jahren = verlauf[Math.min(20, verlauf.length - 1)];
  const eingezahltNach10Jahren = startkapital + summeEinzahlungen(sparrateMonatlich, sparratenSteigerungProzent, 10);
  const eingezahltNach20Jahren = startkapital + summeEinzahlungen(sparrateMonatlich, sparratenSteigerungProzent, 20);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardTitle>Annahmen</CardTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Startkapital (€)">
            <Input type="number" step="any" min={0} value={startkapital} onChange={(e) => setStartkapital(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Sparrate (€/Monat)">
            <Input
              type="number"
              step="any"
              min={0}
              value={sparrateMonatlich}
              onChange={(e) => setSparrateMonatlich(Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Steigerung der Sparrate (%/Jahr)" hint="z. B. analog zu erwarteten Gehaltssteigerungen">
            <Input
              type="number"
              step="any"
              value={sparratenSteigerungProzent}
              onChange={(e) => setSparratenSteigerungProzent(Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Erwartete Rendite (%/Jahr)">
            <Input type="number" step="any" value={renditeProzent} onChange={(e) => setRenditeProzent(Number(e.target.value) || 0)} />
          </Field>
          <Field label="Zielbetrag (€)">
            <Input type="number" step="any" min={0} value={zielbetrag} onChange={(e) => setZielbetrag(Number(e.target.value) || 0)} />
          </Field>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Kapital nach 10 Jahren" value={formatEuro(endkapitalNach10Jahren)} hint={`davon ${formatEuro(eingezahltNach10Jahren)} eingezahlt`} />
        <Stat label="Kapital nach 20 Jahren" value={formatEuro(endkapitalNach20Jahren)} hint={`davon ${formatEuro(eingezahltNach20Jahren)} eingezahlt`} />
        <Stat
          label="Zielbetrag erreicht"
          value={jahrBisZiel === null ? `nicht in ${HORIZONT_JAHRE} Jahren` : jahrBisZiel === 0 ? "sofort" : `in ${jahrBisZiel} Jahren`}
          hint={formatEuro(zielbetrag)}
        />
      </div>

      <Card>
        <CardTitle>Kapitalverlauf</CardTitle>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sparziel-kapital" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="jahr" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
              labelFormatter={(jahr) => `Jahr ${jahr}`}
              formatter={(value) => [formatEuro(Number(value) || 0), "Kapital"]}
            />
            <Area type="monotone" dataKey="kapital" name="Kapital" stroke="#3b82f6" fill="url(#sparziel-kapital)" />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="mt-2 text-xs text-slate-500">
          Vereinfachung: Sparrate wird jährlich am Jahresanfang gutgeschrieben (keine unterjährige Verzinsung), Rendite konstant über
          den gesamten Zeitraum — reale Kapitalmarktrenditen schwanken.
        </p>
      </Card>
    </div>
  );
}

function summeEinzahlungen(sparrateMonatlich: number, steigerungProzent: number, jahre: number): number {
  let summe = 0;
  let rateJaehrlich = sparrateMonatlich * 12;
  for (let jahr = 1; jahr <= jahre; jahr++) {
    summe += rateJaehrlich;
    rateJaehrlich = rateJaehrlich * (1 + steigerungProzent / 100);
  }
  return summe;
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-100">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </Card>
  );
}
