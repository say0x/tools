"use client";

import { Bar, BarChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatEuro } from "@/lib/format";
import { nullBasierteDomain } from "@/lib/chart-domain";

const MONATE = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

export function MonthlyCashflowChart({
  cashflowVorSteuerJahr,
  cashflowNachSteuerJahr,
}: {
  cashflowVorSteuerJahr: number;
  cashflowNachSteuerJahr: number;
}) {
  const data = MONATE.map((monat) => ({
    monat,
    vorSteuer: round2(cashflowVorSteuerJahr / 12),
    nachSteuer: round2(cashflowNachSteuerJahr / 12),
  }));

  return (
    <div role="img" aria-label="Balkendiagramm: monatlicher Cashflow vor und nach Steuer über zwölf Monate">
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={20} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#1e293b" />
          <XAxis dataKey="monat" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${Math.round(v)}`} domain={nullBasierteDomain} />
          <ReferenceLine y={0} stroke="#475569" />
          <Tooltip
            contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
            formatter={(value, name) => [formatEuro(Number(value) || 0), String(name)]}
          />
          <Legend />
          <Bar dataKey="vorSteuer" name="Vor Steuer" fill="#f97316" radius={[3, 3, 0, 0]} />
          <Bar dataKey="nachSteuer" name="Nach Steuer" fill="#3b82f6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
