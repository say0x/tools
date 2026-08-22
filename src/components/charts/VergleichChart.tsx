"use client";

import { Bar, BarChart, Cell, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { nullBasierteDomain } from "@/lib/chart-domain";
import { farbeFuerIndex } from "@/lib/chart-colors";

export function VergleichChart({ data }: { data: { id: string; name: string; value: number; label: string }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
        <defs>
          {data.map((entry, i) => (
            <linearGradient key={entry.id} id={`vergleichBalken-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={farbeFuerIndex(i)} stopOpacity={0.95} />
              <stop offset="100%" stopColor={farbeFuerIndex(i)} stopOpacity={0.55} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="name" stroke="#64748b" fontSize={12} interval={0} angle={-30} textAnchor="end" height={60} />
        <YAxis stroke="#64748b" fontSize={12} domain={nullBasierteDomain} />
        <Tooltip
          cursor={{ fill: "#1e293b", opacity: 0.4 }}
          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
          formatter={(_value, _name, item) => [item.payload.label, ""]}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}>
          {data.map((entry, i) => (
            <Cell key={entry.id} fill={`url(#vergleichBalken-${i})`} />
          ))}
          <LabelList dataKey="label" position="top" fill="#cbd5e1" fontSize={11} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
