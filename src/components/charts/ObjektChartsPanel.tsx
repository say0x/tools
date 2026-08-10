"use client";

import { useMemo, useState } from "react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { BETRACHTUNGSZEITRAUM_PRESETS } from "@/server/calc/constants";
import type { CalculationResult } from "@/server/calc/types";
import { VermoegensChart } from "./VermoegensChart";
import { CashflowChart } from "./CashflowChart";
import { MonthlyCashflowChart } from "./MonthlyCashflowChart";

const MAX_JAHRE = 50;

export function ObjektChartsPanel({ result }: { result: CalculationResult }) {
  const [betrachtungszeitraum, setBetrachtungszeitraum] = useState(30);
  const [ausgewaehltesJahr, setAusgewaehltesJahr] = useState(1);

  const sichtbareDaten = useMemo(
    () => result.vermoegensverlauf.slice(0, betrachtungszeitraum),
    [result.vermoegensverlauf, betrachtungszeitraum]
  );

  const jahrDaten = result.vermoegensverlauf.find((j) => j.jahr === ausgewaehltesJahr) ?? result.vermoegensverlauf[0];

  const setZeitraum = (jahre: number) => {
    const geklemmt = Math.max(1, Math.min(MAX_JAHRE, jahre));
    setBetrachtungszeitraum(geklemmt);
    if (ausgewaehltesJahr > geklemmt) setAusgewaehltesJahr(geklemmt);
  };

  return (
    <>
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="mb-0">Vermögensverlauf</CardTitle>
          <div className="flex flex-wrap items-center gap-1.5">
            {BETRACHTUNGSZEITRAUM_PRESETS.map((jahre) => (
              <Button
                key={jahre}
                type="button"
                size="sm"
                variant={betrachtungszeitraum === jahre ? "primary" : "secondary"}
                onClick={() => setZeitraum(jahre)}
              >
                {jahre}J
              </Button>
            ))}
            <input
              type="number"
              min={1}
              max={MAX_JAHRE}
              value={betrachtungszeitraum}
              onChange={(e) => setZeitraum(Number(e.target.value) || 1)}
              className="w-16 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-100 focus:border-blue-500 focus:outline-none"
              aria-label="Betrachtungszeitraum in Jahren (max. 50)"
            />
          </div>
        </div>
        <VermoegensChart data={sichtbareDaten} meilensteine={result.meilensteine} />
        <p className="mt-2 text-xs text-slate-500">
          Betrachtungszeitraum: {betrachtungszeitraum} {betrachtungszeitraum === 1 ? "Jahr" : "Jahre"}
          {result.meilensteine.volltilgungJahr != null &&
            ` · Kredit abbezahlt in Jahr ${result.meilensteine.volltilgungJahr}`}
        </p>
      </Card>

      <Card>
        <CardTitle>Kumulierter Cashflow — vor &amp; nach Steuer</CardTitle>
        <CashflowChart data={sichtbareDaten} />
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle className="mb-0">Monatlicher Cashflow in einem Jahr</CardTitle>
          <Select
            className="w-auto"
            value={ausgewaehltesJahr}
            onChange={(e) => setAusgewaehltesJahr(Number(e.target.value))}
          >
            {Array.from({ length: betrachtungszeitraum }, (_, i) => i + 1).map((jahr) => (
              <option key={jahr} value={jahr}>
                Jahr {jahr}
              </option>
            ))}
          </Select>
        </div>
        {jahrDaten && (
          <MonthlyCashflowChart
            cashflowVorSteuerJahr={jahrDaten.cashflowVorSteuerJahr}
            cashflowNachSteuerJahr={jahrDaten.cashflowNachSteuerJahr}
          />
        )}
        <p className="mt-2 text-xs text-slate-500">
          Näherung: Jahreswert gleichmäßig auf 12 Monate verteilt (keine unterjährige Saisonalität im Modell).
        </p>
      </Card>
    </>
  );
}
