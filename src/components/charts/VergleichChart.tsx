"use client";

import { Bar, BarChart, Cell, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { nullBasierteDomain } from "@/lib/chart-domain";
import { farbeFuerIndex } from "@/lib/chart-colors";

export function VergleichChart({
  data,
  ariaLabel,
}: {
  data: { id: string; name: string; value: number; label: string }[];
  /** Beschreibt, welche Kennzahl verglichen wird — der Chart wird für mehrere Kennzahlen wiederverwendet. */
  ariaLabel: string;
}) {
  // Ein Balkendiagramm, in dem jeder Wert 0 ist, rendert ohne sichtbare Balken oder
  // Beschriftung (0 Höhe) — sieht wie ein Ladefehler aus statt wie "alle Werte sind 0".
  const alleWerteNull = data.length > 0 && data.every((d) => d.value === 0);

  if (alleWerteNull) {
    return (
      <div role="img" aria-label={ariaLabel} className="flex h-[240px] items-center justify-center text-sm text-slate-500">
        Alle Werte liegen bei 0 (oder sind nicht verfügbar) — kein Unterschied sichtbar.
      </div>
    );
  }

  return (
    <div role="img" aria-label={ariaLabel}>
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
          <CartesianGrid stroke="#1e293b" vertical={false} />
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} interval={0} angle={-30} textAnchor="end" height={60} />
          <YAxis stroke="#64748b" fontSize={12} domain={nullBasierteDomain} />
          <Tooltip
            cursor={{ fill: "#1e293b", opacity: 0.4 }}
            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
            formatter={(_value, _name, item) => [item.payload.label, ""]}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={24}>
            {data.map((entry, i) => (
              <Cell key={entry.id} fill={`url(#vergleichBalken-${i})`} />
            ))}
            <LabelList dataKey="label" position="top" fill="#cbd5e1" fontSize={11} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
