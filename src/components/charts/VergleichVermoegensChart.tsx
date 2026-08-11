"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatEuro } from "@/lib/format";

const FARBEN = ["#3b82f6", "#f97316", "#10b981", "#a855f7", "#ec4899", "#eab308"];

export function VergleichVermoegensChart({
  objekte,
  jahre = 30,
}: {
  objekte: { id: string; name: string; eigenkapitalanteilProJahr: number[] }[];
  jahre?: number;
}) {
  const data = Array.from({ length: jahre }, (_, i) => {
    const jahr = i + 1;
    const punkt: Record<string, number> = { jahr };
    for (const o of objekte) {
      punkt[o.id] = o.eigenkapitalanteilProJahr[i] ?? 0;
    }
    return punkt;
  });

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="jahr" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${Math.round(v / 1000)}k`} width={48} />
        <Tooltip
          contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
          labelFormatter={(jahr) => `Jahr ${jahr}`}
          formatter={(value, name) => [formatEuro(Number(value) || 0), objekte.find((o) => o.id === name)?.name ?? String(name)]}
        />
        <Legend formatter={(id) => objekte.find((o) => o.id === id)?.name ?? id} />
        {objekte.map((o, i) => (
          <Line
            key={o.id}
            type="monotone"
            dataKey={o.id}
            name={o.id}
            stroke={FARBEN[i % FARBEN.length]}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
