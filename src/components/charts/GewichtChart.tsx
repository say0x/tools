"use client";

import { CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from "recharts";
import { formatDatumKurz, formatKg } from "@/lib/fitness-labels";

export interface GewichtChartPunkt {
  datum: string;
  gewichtKg: number;
  durchschnitt7: number;
}

/**
 * Einzelmessungen als Punkte, der 7-Tage-Durchschnitt als Linie — die Linie
 * ist die eigentliche Aussage, Tageswerte schwanken um ±1 kg.
 */
export function GewichtChart({ punkte, zielGewichtKg }: { punkte: GewichtChartPunkt[]; zielGewichtKg: number | null }) {
  // Echte Zeitachse statt Kategorien: Messungen kommen in unregelmäßigen Abständen,
  // gleichmäßige Kategorie-Abstände würden Trends verzerren.
  const daten = punkte.map((p) => ({ ...p, t: Date.parse(`${p.datum}T00:00:00.000Z`) }));
  const werte = punkte.flatMap((p) => [p.gewichtKg, p.durchschnitt7]).concat(zielGewichtKg != null ? [zielGewichtKg] : []);
  const min = Math.floor(Math.min(...werte) - 1);
  const max = Math.ceil(Math.max(...werte) + 1);

  return (
    <div role="img" aria-label="Diagramm: Gewichtsverlauf mit Einzelmessungen und 7-Tage-Durchschnitt">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={daten} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            stroke="#64748b"
            fontSize={12}
            minTickGap={32}
            tickFormatter={(t) => formatDatumKurz(new Date(Number(t)).toISOString().slice(0, 10))}
          />
          <YAxis stroke="#64748b" fontSize={12} domain={[min, max]} width={40} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
            labelFormatter={(t) => formatDatumKurz(new Date(Number(t)).toISOString().slice(0, 10))}
            formatter={(value, name) => [formatKg(Number(value)), String(name)]}
          />
          <Legend />
          <Scatter dataKey="gewichtKg" name="Messung" fill="#94a3b8" />
          <Line type="monotone" dataKey="durchschnitt7" name="7-Tage-Durchschnitt" stroke="#3987e5" strokeWidth={2} dot={false} />
          {zielGewichtKg != null && (
            <ReferenceLine
              y={zielGewichtKg}
              stroke="#199e70"
              strokeDasharray="4 4"
              label={{ value: `Ziel ${formatKg(zielGewichtKg)}`, position: "insideBottomRight", fill: "#94a3b8", fontSize: 11 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
