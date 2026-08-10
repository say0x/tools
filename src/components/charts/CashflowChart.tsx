"use client";

import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { VermoegensverlaufJahr } from "@/server/calc/types";
import { formatEuro } from "@/lib/format";

export function CashflowChart({ data }: { data: VermoegensverlaufJahr[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="jahr" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <ReferenceLine y={0} stroke="#475569" />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
          labelFormatter={(jahr) => `Jahr ${jahr}`}
          formatter={(value) => [formatEuro(Number(value) || 0), "Kumulierter Cashflow"]}
        />
        <Bar dataKey="kumulierterCashflow" fill="#3b82f6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
