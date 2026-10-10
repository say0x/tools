"use client";

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDatumKurz, formatKcal } from "@/lib/fitness-labels";

export interface FitnessWochenPunkt {
  datum: string;
  zugefuehrt: number | null;
  budget: number | null;
}

/** Zufuhr je Tag als Balken gegen das Tagesbudget (inkl. Training) als Linie. */
export function FitnessWochenChart({ daten }: { daten: FitnessWochenPunkt[] }) {
  const punkte = daten.map((d) => ({ ...d, label: formatDatumKurz(d.datum) }));
  return (
    <div role="img" aria-label="Diagramm: zugeführte Kalorien je Tag im Vergleich zum Tagesbudget">
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={punkte} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1e293b" vertical={false} />
          <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} width={48} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
            formatter={(value, name) => [value == null ? "—" : formatKcal(Number(value)), String(name)]}
          />
          <Legend />
          <Bar dataKey="zugefuehrt" name="Zugeführt" fill="#3987e5" radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Line type="stepAfter" dataKey="budget" name="Budget" stroke="#d95926" strokeWidth={2} dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
