"use client";

// Referenz: docs/tools/weitere-rechner.md

import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/Button";
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

// Ab dem 27. Angebot (Z) wird auf "Angebot 27" o. ä. umgestellt statt mit einem
// zweiten Buchstaben weiterzuzählen — für einen Vergleichsrechner ein Randfall,
// der keine eigene AA/AB/...-Logik rechtfertigt.
function naechsterKreditname(anzahlBestehend: number): string {
  const buchstabe = String.fromCharCode(65 + anzahlBestehend);
  return anzahlBestehend < 26 ? `Angebot ${buchstabe}` : `Angebot ${anzahlBestehend + 1}`;
}

function leererKredit(anzahlBestehend: number): KreditInput {
  return {
    name: naechsterKreditname(anzahlBestehend),
    darlehenssummeEuro: 300000,
    zinssatzProzent: 3.5,
    anfaenglicheTilgungProzent: 2,
    zinsbindungJahre: 10,
    anschlusszinsAufschlagProzent: 1,
    sondertilgungProzent: 0,
  };
}

export function KreditvergleichClient() {
  const [kredite, setKredite] = useState<KreditInput[]>(STANDARD_KREDITE);

  const updateKredit = (index: number, patch: Partial<KreditInput>) => {
    setKredite((prev) => prev.map((k, i) => (i === index ? { ...k, ...patch } : k)));
  };

  const addKredit = () => {
    setKredite((prev) => [...prev, leererKredit(prev.length)]);
  };

  // Mindestens ein Kredit bleibt immer stehen — bei 0 Krediten hätten Tabelle und
  // Diagramm keine Spalten/Linien mehr, das wäre ein bedeutungsloser Leerzustand.
  const removeKredit = (index: number) => {
    setKredite((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
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
        // Toleranzbereich statt strikter Gleichheit — dieselbe Bedingung wie im
        // Immobilien-Rechner (engine.ts) und in tilgungsplan.test.ts, damit "Volltilgung"
        // nicht an zwei Stellen unabhängig als exakte vs. gerundete Gleichheit definiert ist.
        const volltilgungsjahr = tilgungsplan.find((j) => j.restschuldEnde <= 0.01 && j.restschuldStart > 0.01)?.jahr ?? null;
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
      <div className="flex items-center justify-end">
        <Button type="button" variant="secondary" size="sm" onClick={addKredit}>
          + Kredit hinzufügen
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {kredite.map((k, i) => (
          <Card key={i}>
            <div className="mb-4 flex items-center gap-2">
              <input
                value={k.name}
                onChange={(e) => updateKredit(i, { name: e.target.value })}
                className="w-full rounded-md border-none bg-transparent text-base font-semibold text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                aria-label={`Name Kredit ${i + 1}`}
              />
              {kredite.length > 1 && (
                <Button type="button" variant="danger" size="sm" onClick={() => removeKredit(i)}>
                  Entfernen
                </Button>
              )}
            </div>
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
            <tr className="text-left text-slate-400">
              <th scope="col" className="pb-3 pr-4 font-medium">
                Kennzahl
              </th>
              {kredite.map((k, i) => (
                <th key={i} scope="col" className="pb-3 pr-4 font-medium text-slate-200">
                  {k.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            <tr>
              <th scope="row" className="py-2 pr-4 text-left font-normal text-slate-400">
                Monatliche Rate (Jahr 1)
              </th>
              {ergebnisse.map((e, i) => (
                <td key={i} className="py-2 pr-4 text-slate-100">
                  {formatEuro(e.monatlicheRate)}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="py-2 pr-4 text-left font-normal text-slate-400">
                Zinskosten gesamt ({BETRACHTUNGSZEITRAUM_JAHRE} J.)
              </th>
              {ergebnisse.map((e, i) => (
                <td key={i} className="py-2 pr-4 text-slate-100">
                  {formatEuro(e.zinskostenGesamt)}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="py-2 pr-4 text-left font-normal text-slate-400">
                Restschuld nach {BETRACHTUNGSZEITRAUM_JAHRE} Jahren
              </th>
              {ergebnisse.map((e, i) => (
                <td key={i} className="py-2 pr-4 text-slate-100">
                  {formatEuro(e.restschuldNachHorizont)}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row" className="py-2 pr-4 text-left font-normal text-slate-400">
                Volltilgung
              </th>
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
        <div role="img" aria-label="Liniendiagramm: Restschuld-Verlauf beider Kredite über die Jahre im Vergleich">
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
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Sondertilgung reduziert die Restschuld hier zusätzlich zur regulären Tilgung, wirkt sich aber wie im
          Immobilien-Rechner nicht auf die laufende Rate aus (behandelt wie eine zusätzliche Kapitaleinlage).
        </p>
      </Card>
    </div>
  );
}
