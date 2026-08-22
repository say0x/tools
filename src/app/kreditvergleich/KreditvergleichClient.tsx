"use client";

// Referenz: docs/weitere-rechner.md

import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { berechneTilgungsplan } from "@/server/calc/financing/tilgungsplan";
import { formatEuro } from "@/lib/format";
import { farbeFuerIndex } from "@/lib/chart-colors";

const BETRACHTUNGSZEITRAUM_JAHRE = 30;

interface KreditInput {
  name: string;
  darlehenssummeEuro: number;
  zinssatzProzent: number;
  anfaenglicheTilgungProzent: number;
  zinsbindungJahre: number;
  anschlusszinsAufschlagProzent: number;
  sondertilgungProzent: number;
}

const STANDARD_KREDITE: KreditInput[] = [
  {
    name: "Angebot A",
    darlehenssummeEuro: 300000,
    zinssatzProzent: 3.5,
    anfaenglicheTilgungProzent: 2,
    zinsbindungJahre: 10,
    anschlusszinsAufschlagProzent: 1,
    sondertilgungProzent: 0,
  },
  {
    name: "Angebot B",
    darlehenssummeEuro: 300000,
    zinssatzProzent: 3.8,
    anfaenglicheTilgungProzent: 3,
    zinsbindungJahre: 15,
    anschlusszinsAufschlagProzent: 1,
    sondertilgungProzent: 5,
  },
];

export function KreditvergleichClient() {
  const [kredite, setKredite] = useState<KreditInput[]>(STANDARD_KREDITE);

  const updateKredit = (index: number, patch: Partial<KreditInput>) => {
    setKredite((prev) => prev.map((k, i) => (i === index ? { ...k, ...patch } : k)));
  };

  const ergebnisse = useMemo(
    () =>
      kredite.map((k) => {
        const tilgungsplan = berechneTilgungsplan(
          k.darlehenssummeEuro,
          k.zinssatzProzent,
          k.anfaenglicheTilgungProzent,
          BETRACHTUNGSZEITRAUM_JAHRE,
          k.zinsbindungJahre > 0 ? k.zinsbindungJahre : Infinity,
          k.anschlusszinsAufschlagProzent,
          k.sondertilgungProzent,
          100
        );
        const jahr1 = tilgungsplan[0];
        const monatlicheRate = jahr1 ? (jahr1.zinszahlung + jahr1.tilgungszahlung) / 12 : 0;
        const zinskostenGesamt = tilgungsplan.reduce((summe, j) => summe + j.zinszahlung, 0);
        const restschuldNachHorizont = tilgungsplan[tilgungsplan.length - 1]?.restschuldEnde ?? 0;
        const volltilgungsjahr = tilgungsplan.find((j) => j.restschuldEnde === 0)?.jahr ?? null;
        return { tilgungsplan, monatlicheRate, zinskostenGesamt, restschuldNachHorizont, volltilgungsjahr };
      }),
    [kredite]
  );

  const chartData = Array.from({ length: BETRACHTUNGSZEITRAUM_JAHRE + 1 }, (_, i) => {
    const punkt: Record<string, number> = { jahr: i };
    ergebnisse.forEach((e, idx) => {
      punkt[`kredit${idx}`] = i === 0 ? kredite[idx].darlehenssummeEuro : (e.tilgungsplan[i - 1]?.restschuldEnde ?? 0);
    });
    return punkt;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {kredite.map((k, i) => (
          <Card key={i}>
            <input
              value={k.name}
              onChange={(e) => updateKredit(i, { name: e.target.value })}
              className="mb-4 w-full rounded-md border-none bg-transparent text-base font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              aria-label={`Name Kredit ${i + 1}`}
            />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Darlehenssumme (€)">
                <Input
                  type="number"
                  step="any"
                  min={0}
                  value={k.darlehenssummeEuro}
                  onChange={(e) => updateKredit(i, { darlehenssummeEuro: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Zinssatz (%)">
                <Input
                  type="number"
                  step="any"
                  min={0}
                  value={k.zinssatzProzent}
                  onChange={(e) => updateKredit(i, { zinssatzProzent: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Anfängliche Tilgung (%)">
                <Input
                  type="number"
                  step="any"
                  min={0}
                  value={k.anfaenglicheTilgungProzent}
                  onChange={(e) => updateKredit(i, { anfaenglicheTilgungProzent: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Zinsbindung (Jahre)">
                <Input
                  type="number"
                  step="any"
                  min={0}
                  value={k.zinsbindungJahre}
                  onChange={(e) => updateKredit(i, { zinsbindungJahre: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Anschlusszins-Aufschlag (Pp.)" hint="nach Zinsbindungsende">
                <Input
                  type="number"
                  step="any"
                  value={k.anschlusszinsAufschlagProzent}
                  onChange={(e) => updateKredit(i, { anschlusszinsAufschlagProzent: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Sondertilgung (%/Jahr)" hint="der ursprünglichen Summe">
                <Input
                  type="number"
                  step="any"
                  min={0}
                  value={k.sondertilgungProzent}
                  onChange={(e) => updateKredit(i, { sondertilgungProzent: Number(e.target.value) || 0 })}
                />
              </Field>
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="pb-3 pr-4 font-medium">Kennzahl</th>
              {kredite.map((k, i) => (
                <th key={i} className="pb-3 pr-4 font-medium text-slate-200">
                  {k.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            <tr>
              <td className="py-2 pr-4 text-slate-400">Monatliche Rate (Jahr 1)</td>
              {ergebnisse.map((e, i) => (
                <td key={i} className="py-2 pr-4 text-slate-100">
                  {formatEuro(e.monatlicheRate)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 pr-4 text-slate-400">Zinskosten gesamt ({BETRACHTUNGSZEITRAUM_JAHRE} J.)</td>
              {ergebnisse.map((e, i) => (
                <td key={i} className="py-2 pr-4 text-slate-100">
                  {formatEuro(e.zinskostenGesamt)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 pr-4 text-slate-400">Restschuld nach {BETRACHTUNGSZEITRAUM_JAHRE} Jahren</td>
              {ergebnisse.map((e, i) => (
                <td key={i} className="py-2 pr-4 text-slate-100">
                  {formatEuro(e.restschuldNachHorizont)}
                </td>
              ))}
            </tr>
            <tr>
              <td className="py-2 pr-4 text-slate-400">Volltilgung</td>
              {ergebnisse.map((e, i) => (
                <td key={i} className="py-2 pr-4 text-slate-100">
                  {e.volltilgungsjahr === null ? `nicht in ${BETRACHTUNGSZEITRAUM_JAHRE} Jahren` : `Jahr ${e.volltilgungsjahr}`}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </Card>

      <Card>
        <CardTitle>Restschuld-Verlauf</CardTitle>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="jahr" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
              labelFormatter={(jahr) => `Jahr ${jahr}`}
              formatter={(value, name) => [formatEuro(Number(value) || 0), String(name)]}
            />
            <Legend formatter={(id) => kredite[Number(String(id).replace("kredit", ""))]?.name ?? id} />
            {kredite.map((k, i) => (
              <Line
                key={i}
                type="monotone"
                dataKey={`kredit${i}`}
                name={`kredit${i}`}
                stroke={farbeFuerIndex(i)}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-2 text-xs text-slate-500">
          Sondertilgung reduziert die Restschuld hier zusätzlich zur regulären Tilgung, wirkt sich aber wie im
          Immobilien-Rechner nicht auf die laufende Rate aus (behandelt wie eine zusätzliche Kapitaleinlage).
        </p>
      </Card>
    </div>
  );
}
