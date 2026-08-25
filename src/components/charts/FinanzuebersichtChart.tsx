"use client";

import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PortfolioJahr } from "@/server/calc/types";
import { formatEuro } from "@/lib/format";
import { tickInterval } from "@/lib/chart-ticks";

export function FinanzuebersichtChart({ data }: { data: PortfolioJahr[] }) {
  return (
    <div role="img" aria-label="Liniendiagramm: verfügbares Geld nominal und inflationsbereinigt über die Jahre">
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="vermoegen-nominal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="kalenderjahr" stroke="#64748b" fontSize={12} interval={tickInterval(data.length)} />
          <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
            labelFormatter={(kalenderjahr) => `Jahr ${kalenderjahr}`}
            formatter={(value, name) => [formatEuro(Number(value) || 0), String(name)]}
          />
          <Legend />
          <Area type="monotone" dataKey="gesamtNominal" name="Verfügbares Geld (nominal)" stroke="#3b82f6" fill="url(#vermoegen-nominal)" />
          <Line
            type="monotone"
            dataKey="gesamtReal"
            name="Verfügbares Geld (real, inflationsbereinigt)"
            stroke="#10b981"
            strokeDasharray="4 4"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
