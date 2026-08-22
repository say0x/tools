"use client";

// Referenz (inkl. ReferenceDot/XAxis-Recharts-Stolperstein): docs/weitere-rechner.md

import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { berechneEinkommensteuer, berechneGrenzsteuersatz } from "@/server/calc/tax/grenzsteuersatz";
import { schaetzeZvEAusBrutto } from "@/server/calc/tax/zve-schaetzung";
import { formatEuro, formatNumber } from "@/lib/format";

const JAHR = new Date().getFullYear();
const KURVE_MAX_ZVE = 300000;
const KURVE_SCHRITTE = 60;

export function SteuerrechnerClient() {
  const [bruttoJaehrlich, setBruttoJaehrlich] = useState(60000);
  const [zvEOverride, setZvEOverride] = useState(false);
  const [zvEManuell, setZvEManuell] = useState(45000);

  const zvEGeschaetzt = useMemo(() => schaetzeZvEAusBrutto(bruttoJaehrlich), [bruttoJaehrlich]);
  const zvE = zvEOverride ? zvEManuell : zvEGeschaetzt;

  const einkommensteuer = useMemo(() => berechneEinkommensteuer(zvE, JAHR), [zvE]);
  const grenzsteuersatz = useMemo(() => berechneGrenzsteuersatz(zvE, JAHR), [zvE]);
  const durchschnittssteuersatz = zvE > 0 ? (einkommensteuer / zvE) * 100 : 0;
  const nettoNachEinkommensteuer = zvE - einkommensteuer;

  const kurve = useMemo(
    () =>
      Array.from({ length: KURVE_SCHRITTE + 1 }, (_, i) => {
        const punktZvE = Math.round((KURVE_MAX_ZVE / KURVE_SCHRITTE) * i);
        return { zvE: punktZvE, grenzsteuersatz: berechneGrenzsteuersatz(punktZvE, JAHR) };
      }),
    []
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardTitle>Annahmen</CardTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Brutto-Jahreseinkommen (€)" hint={`≈ ${formatEuro(bruttoJaehrlich / 12)}/Monat`}>
            <Input
              type="number"
              step="any"
              min={0}
              value={bruttoJaehrlich}
              onChange={(e) => setBruttoJaehrlich(Number(e.target.value) || 0)}
            />
          </Field>
          <Field label="Zu versteuerndes Einkommen (zvE, €/Jahr)" hint={zvEOverride ? undefined : `Geschätzt aus Brutto: ${formatEuro(zvEGeschaetzt)}`}>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="any"
                min={0}
                disabled={!zvEOverride}
                value={zvEOverride ? zvEManuell : Math.round(zvEGeschaetzt)}
                onChange={(e) => setZvEManuell(Number(e.target.value) || 0)}
              />
              <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-slate-400">
                <Switch
                  checked={zvEOverride}
                  onChange={(e) => {
                    if (e.target.checked) setZvEManuell(Math.round(zvEGeschaetzt));
                    setZvEOverride(e.target.checked);
                  }}
                />
                manuell
              </label>
            </div>
          </Field>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          zvE-Schätzung: Pauschbeträge für Werbungskosten/Sonderausgaben, ~20% pauschale Vorsorgeaufwendungen — für Genauigkeit
          das echte zvE aus dem Steuerbescheid eintragen (Häkchen &quot;manuell&quot;).
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Zu versteuerndes Einkommen" value={formatEuro(zvE)} />
        <Stat label="Einkommensteuer (Jahr)" value={formatEuro(einkommensteuer)} hint={`Tarif ${JAHR >= 2025 ? 2025 : JAHR}`} />
        <Stat label="Grenzsteuersatz" value={`${formatNumber(grenzsteuersatz, 1)}%`} hint="Steuer auf den nächsten Euro" />
        <Stat label="Durchschnittssteuersatz" value={`${formatNumber(durchschnittssteuersatz, 1)}%`} hint="Einkommensteuer ÷ zvE" />
      </div>

      <Card>
        <CardTitle>Nach Einkommensteuer</CardTitle>
        <p className="text-sm text-slate-400">
          Vom zu versteuernden Einkommen bleiben nach Einkommensteuer{" "}
          <span className="font-medium text-slate-100">{formatEuro(nettoNachEinkommensteuer)}</span> im Jahr — ohne
          Solidaritätszuschlag, Kirchensteuer oder Sozialabgaben, die hier nicht modelliert sind.
        </p>
      </Card>

      <Card>
        <CardTitle>Grenzsteuersatz nach Einkommen</CardTitle>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={kurve} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="steuerkurve" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="zvE"
              type="number"
              domain={[0, KURVE_MAX_ZVE]}
              stroke="#64748b"
              fontSize={12}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
            />
            <YAxis stroke="#64748b" fontSize={12} unit="%" domain={[0, 45]} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
              labelFormatter={(zvE) => `zvE ${formatEuro(Number(zvE) || 0)}`}
              formatter={(value) => [`${formatNumber(Number(value) || 0, 1)}%`, "Grenzsteuersatz"]}
            />
            <Area type="monotone" dataKey="grenzsteuersatz" stroke="#3b82f6" fill="url(#steuerkurve)" />
            {zvE <= KURVE_MAX_ZVE && <ReferenceDot x={Math.round(zvE)} y={grenzsteuersatz} r={5} fill="#f97316" stroke="none" />}
          </ComposedChart>
        </ResponsiveContainer>
        <p className="mt-2 text-xs text-slate-500">Der orangene Punkt markiert dein eingegebenes zvE.</p>
      </Card>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-100">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </Card>
  );
}
