"use client";

// Referenz (warum Lump-Sum-Vergleich statt klassischer Miete-vs-Kauf-Rechner): docs/weitere-rechner.md

import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { berechneSparpositionsverlauf } from "@/server/calc/rendite/portfolioverlauf";
import { formatEuro } from "@/lib/format";

interface ObjektOption {
  id: string;
  name: string;
  eigenkapitalEinsatzEuro: number;
  vermoegensverlauf: { jahr: number; eigenkapitalanteil: number; kumulierterCashflowNachSteuer: number }[];
}

export function KaufenOderAnlegenClient({ objekte }: { objekte: ObjektOption[] }) {
  const [objektId, setObjektId] = useState(objekte[0].id);
  const [renditeProzent, setRenditeProzent] = useState(6);

  const objekt = objekte.find((o) => o.id === objektId) ?? objekte[0];
  const horizontJahre = objekt.vermoegensverlauf.length;

  const alternativanlageVerlauf = useMemo(
    () =>
      berechneSparpositionsverlauf(
        { betrag: objekt.eigenkapitalEinsatzEuro, renditeProzentJaehrlich: renditeProzent, sparplanBetragMonatlich: 0, sparplanSteigerungProzentJaehrlich: 0 },
        horizontJahre
      ),
    [objekt.eigenkapitalEinsatzEuro, renditeProzent, horizontJahre]
  );

  const chartData = objekt.vermoegensverlauf.map((j, i) => ({
    jahr: j.jahr,
    immobilie: j.eigenkapitalanteil + j.kumulierterCashflowNachSteuer,
    alternativanlage: alternativanlageVerlauf[i + 1] ?? alternativanlageVerlauf[alternativanlageVerlauf.length - 1],
  }));

  const letzterPunkt = chartData[chartData.length - 1];
  const differenz = letzterPunkt.immobilie - letzterPunkt.alternativanlage;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardTitle>Annahmen</CardTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Objekt">
            <Select value={objektId} onChange={(e) => setObjektId(e.target.value)}>
              {objekte.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Erwartete Rendite Alternativanlage (%/Jahr)" hint="z. B. ein breit gestreutes ETF-Depot">
            <Input type="number" step="any" value={renditeProzent} onChange={(e) => setRenditeProzent(Number(e.target.value) || 0)} />
          </Field>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Eigenkapital-Einsatz beim Kauf: {formatEuro(objekt.eigenkapitalEinsatzEuro)} — dieselbe Summe wird hier als
          Einmalanlage zum Vergleich angesetzt (kein zusätzlicher Sparplan).
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <div className="text-xs text-slate-500">Immobilie nach {horizontJahre} Jahren</div>
          <div className="mt-1 text-xl font-semibold text-slate-100">{formatEuro(letzterPunkt.immobilie)}</div>
          <div className="mt-1 text-xs text-slate-500">Eigenkapitalanteil + aufgelaufener Cashflow nach Steuer</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-500">Alternativanlage nach {horizontJahre} Jahren</div>
          <div className="mt-1 text-xl font-semibold text-slate-100">{formatEuro(letzterPunkt.alternativanlage)}</div>
          <div className="mt-1 text-xs text-slate-500">{formatEuro(objekt.eigenkapitalEinsatzEuro)} zu {renditeProzent}% p. a.</div>
        </Card>
      </div>

      <Card className={differenz >= 0 ? "border-emerald-900/50 bg-emerald-950/10" : "border-amber-900/50 bg-amber-950/10"}>
        <p className="text-sm text-slate-300">
          {differenz >= 0 ? (
            <>
              Nach {horizontJahre} Jahren liegt die Immobilie um{" "}
              <span className="font-medium text-emerald-400">{formatEuro(differenz)}</span> vor der Alternativanlage.
            </>
          ) : (
            <>
              Nach {horizontJahre} Jahren läge die Alternativanlage um{" "}
              <span className="font-medium text-amber-400">{formatEuro(-differenz)}</span> vor der Immobilie.
            </>
          )}
        </p>
      </Card>

      <Card>
        <CardTitle>Vermögensverlauf im Vergleich</CardTitle>
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
            <Legend formatter={(id) => (id === "immobilie" ? "Immobilie" : "Alternativanlage")} />
            <Line type="monotone" dataKey="immobilie" name="immobilie" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            <Line
              type="monotone"
              dataKey="alternativanlage"
              name="alternativanlage"
              stroke="#a855f7"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="mt-2 text-xs text-slate-500">
          Vereinfachung: die Immobilien-Seite reinvestiert den laufenden Cashflow nicht weiter (er läuft nur als Barsumme
          mit), die Alternativanlage-Seite verzinst durchgehend mit der gewählten Rendite — beide Seiten ignorieren Steuern
          auf einen möglichen Verkaufserlös bzw. auf Kursgewinne.
        </p>
      </Card>
    </div>
  );
}
