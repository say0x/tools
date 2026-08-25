"use client";

import { Legend, Line, ComposedChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { VermoegensverlaufJahr } from "@/server/calc/types";
import { formatEuro } from "@/lib/format";
import { tickInterval } from "@/lib/chart-ticks";

export function CashflowChart({ data }: { data: VermoegensverlaufJahr[] }) {
  return (
    <div role="img" aria-label="Liniendiagramm: kumulierter Cashflow vor und nach Steuer über die Jahre">
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1e293b" />
          <XAxis dataKey="jahr" stroke="#64748b" fontSize={12} interval={tickInterval(data.length)} />
          <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
          <ReferenceLine y={0} stroke="#475569" />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
            labelFormatter={(jahr) => `Jahr ${jahr}`}
            formatter={(value, name) => [formatEuro(Number(value) || 0), String(name)]}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="kumulierterCashflowVorSteuer"
            name="Kumuliert, vor Steuer"
            stroke="#d95926"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="kumulierterCashflowNachSteuer"
            name="Kumuliert, nach Steuer"
            stroke="#3987e5"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
