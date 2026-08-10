"use client";

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { VermoegensverlaufJahr } from "@/server/calc/types";
import { formatEuro } from "@/lib/format";

export function VermoegensChart({ data }: { data: VermoegensverlaufJahr[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="wert" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="ek" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis dataKey="jahr" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
          labelFormatter={(jahr) => `Jahr ${jahr}`}
          formatter={(value, name) => [formatEuro(Number(value) || 0), String(name)]}
        />
        <Legend />
        <Area type="monotone" dataKey="immobilienwert" name="Immobilienwert" stroke="#3b82f6" fill="url(#wert)" />
        <Area type="monotone" dataKey="restschuld" name="Restschuld" stroke="#f97316" fillOpacity={0} />
        <Area type="monotone" dataKey="eigenkapitalanteil" name="Eigenkapitalanteil" stroke="#10b981" fill="url(#ek)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
