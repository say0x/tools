"use client";

// Referenz (inkl. ReferenceDot/XAxis-Recharts-Stolperstein): docs/tools/weitere-rechner.md

import Link from "next/link";
import { useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { berechneEinkommensteuer, berechneGrenzsteuersatz } from "@/server/calc/tax/grenzsteuersatz";
import { resolveEstgZone } from "@/server/calc/tax/estg-zonen";
import { berechneSolidaritaetszuschlag } from "@/server/calc/tax/soli";
import { berechneKirchensteuer, kirchensteuersatzProzent } from "@/server/calc/tax/kirchensteuer";
import { berechneSozialabgaben } from "@/server/calc/tax/sozialabgaben";
import { schaetzeZvEAusBrutto } from "@/server/calc/tax/zve-schaetzung";
import { BUNDESLAENDER, type Bundesland } from "@/server/calc/types";
import { formatEuro, formatNumber } from "@/lib/format";
import { FIELD_HILFE } from "@/lib/field-hilfe";
import { BESCHAEFTIGUNGSSTATUS_LABELS, BUNDESLAND_LABELS } from "@/lib/labels";
import { BESCHAEFTIGUNGSSTATUS } from "@/server/actions/profile-schema";

const JAHR = new Date().getFullYear();
// Für Jahre ohne eigenen Tabelleneintrag fällt resolveEstgZone() auf den jüngsten
// bekannten Tarif zurück (siehe estg-zonen.ts) — der Hint muss denselben Wert zeigen,
// den berechneEinkommensteuer()/berechneGrenzsteuersatz() unten tatsächlich verwenden,
// statt ihn separat zu erraten.
const TARIFJAHR = resolveEstgZone(JAHR).jahr;
const KURVE_MAX_ZVE = 300000;
const KURVE_SCHRITTE = 60;

export function SteuerrechnerClient({
  bundeslandInitial,
  kirchensteuerpflichtigInitial,
  beschaeftigungsstatusInitial,
  gesetzlichKrankenversichertInitial,
  kinderlosInitial,
}: {
  bundeslandInitial: Bundesland;
  kirchensteuerpflichtigInitial: boolean;
  beschaeftigungsstatusInitial: (typeof BESCHAEFTIGUNGSSTATUS)[number];
  gesetzlichKrankenversichertInitial: boolean;
  kinderlosInitial: boolean;
}) {
  const [bruttoJaehrlich, setBruttoJaehrlich] = useState(60000);
  const [zvEOverride, setZvEOverride] = useState(false);
  const [zvEManuell, setZvEManuell] = useState(45000);

  const [bundesland, setBundesland] = useState<Bundesland>(bundeslandInitial);
  const [kirchensteuerpflichtig, setKirchensteuerpflichtig] = useState(kirchensteuerpflichtigInitial);
  const [beschaeftigungsstatus, setBeschaeftigungsstatus] = useState(beschaeftigungsstatusInitial);
  const [gesetzlichKrankenversichert, setGesetzlichKrankenversichert] = useState(gesetzlichKrankenversichertInitial);
  const [kinderlos, setKinderlos] = useState(kinderlosInitial);

  const zvEGeschaetzt = useMemo(() => schaetzeZvEAusBrutto(bruttoJaehrlich), [bruttoJaehrlich]);
  const zvE = zvEOverride ? zvEManuell : zvEGeschaetzt;

  const einkommensteuer = useMemo(() => berechneEinkommensteuer(zvE, JAHR), [zvE]);
  const grenzsteuersatz = useMemo(() => berechneGrenzsteuersatz(zvE, JAHR), [zvE]);
  const durchschnittssteuersatz = zvE > 0 ? (einkommensteuer / zvE) * 100 : 0;

  const soli = useMemo(() => berechneSolidaritaetszuschlag(einkommensteuer, JAHR), [einkommensteuer]);
  const kirchensteuer = useMemo(
    () => berechneKirchensteuer(einkommensteuer, bundesland, kirchensteuerpflichtig),
    [einkommensteuer, bundesland, kirchensteuerpflichtig]
  );
  const sozialabgaben = useMemo(
    () => berechneSozialabgaben(bruttoJaehrlich, JAHR, { beschaeftigungsstatus, gesetzlichKrankenversichert, kinderlos, bundesland }),
    [bruttoJaehrlich, beschaeftigungsstatus, gesetzlichKrankenversichert, kinderlos, bundesland]
  );

  const abzuegeGesamt = einkommensteuer + soli + kirchensteuer + sozialabgaben.summe;
  const nettoNachAllenAbzuegen = zvE - einkommensteuer - soli - kirchensteuer - sozialabgaben.summe;

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
        <div className="mb-1 flex items-center justify-between">
          <CardTitle className="mb-0">Annahmen</CardTitle>
          <Link href="/profil" className="text-sm text-blue-400 hover:underline">
            Dieses Einkommen im Profil hinterlegen →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={
              <>
                Brutto-Jahreseinkommen (€) <InfoTooltip text={FIELD_HILFE.bruttoEinkommen} />
              </>
            }
            hint={`≈ ${formatEuro(bruttoJaehrlich / 12)}/Monat`}
          >
            <Input
              type="number"
              step="any"
              min={0}
              value={bruttoJaehrlich}
              onChange={(e) => setBruttoJaehrlich(Number(e.target.value) || 0)}
            />
          </Field>
          <Field
            label={
              <>
                Zu versteuerndes Einkommen (zvE, €/Jahr) <InfoTooltip text={FIELD_HILFE.zvE} />
              </>
            }
            hint={zvEOverride ? undefined : `Geschätzt aus Brutto: ${formatEuro(zvEGeschaetzt)}`}
          >
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
                  bare
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
        <p className="mt-3 text-xs text-slate-400">
          zvE-Schätzung: Pauschbeträge für Werbungskosten/Sonderausgaben, ~20% pauschale Vorsorgeaufwendungen — für Genauigkeit
          das echte zvE aus dem Steuerbescheid eintragen (Häkchen &quot;manuell&quot;).
        </p>
      </Card>

      <Card>
        <CardTitle>Steuerliche Angaben</CardTitle>
        <p className="mb-4 text-sm text-slate-400">
          Aus dem Profil vorbelegt, hier frei änderbar — für Solidaritätszuschlag, Kirchensteuer und Sozialabgaben unten.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={
              <>
                Bundesland <InfoTooltip text={FIELD_HILFE.bundeslandSteuer} />
              </>
            }
          >
            <Select value={bundesland} onChange={(e) => setBundesland(e.target.value as Bundesland)}>
              {BUNDESLAENDER.map((b) => (
                <option key={b} value={b}>
                  {BUNDESLAND_LABELS[b]}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={
              <>
                Beschäftigungsstatus <InfoTooltip text={FIELD_HILFE.beschaeftigungsstatus} />
              </>
            }
          >
            <Select
              value={beschaeftigungsstatus}
              onChange={(e) => setBeschaeftigungsstatus(e.target.value as (typeof BESCHAEFTIGUNGSSTATUS)[number])}
            >
              {BESCHAEFTIGUNGSSTATUS.map((b) => (
                <option key={b} value={b}>
                  {BESCHAEFTIGUNGSSTATUS_LABELS[b]}
                </option>
              ))}
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <Switch bare checked={kirchensteuerpflichtig} onChange={(e) => setKirchensteuerpflichtig(e.target.checked)} />
            Kirchensteuerpflichtig
            <InfoTooltip text={FIELD_HILFE.kirchensteuerpflichtig} />
          </label>
          {beschaeftigungsstatus === "ANGESTELLT" && (
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <Switch
                bare
                checked={gesetzlichKrankenversichert}
                onChange={(e) => setGesetzlichKrankenversichert(e.target.checked)}
              />
              Gesetzlich krankenversichert
              <InfoTooltip text={FIELD_HILFE.gesetzlichKrankenversichert} />
            </label>
          )}
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <Switch bare checked={kinderlos} onChange={(e) => setKinderlos(e.target.checked)} />
            Kinderlos (ab 23 Jahre)
            <InfoTooltip text={FIELD_HILFE.kinderlos} />
          </label>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Zu versteuerndes Einkommen" value={formatEuro(zvE)} />
        <Stat label="Einkommensteuer (Jahr)" value={formatEuro(einkommensteuer)} hint={`Tarif ${TARIFJAHR}`} />
        <Stat label="Grenzsteuersatz" value={`${formatNumber(grenzsteuersatz, 1)}%`} hint="Steuer auf den nächsten Euro" />
        <Stat label="Durchschnittssteuersatz" value={`${formatNumber(durchschnittssteuersatz, 1)}%`} hint="Einkommensteuer ÷ zvE" />
        <Stat label="Solidaritätszuschlag (Jahr)" value={formatEuro(soli)} />
        <Stat
          label="Kirchensteuer (Jahr)"
          value={formatEuro(kirchensteuer)}
          hint={kirchensteuerpflichtig ? `${BUNDESLAND_LABELS[bundesland]}: ${kirchensteuersatzProzent(bundesland)}%` : "nicht kirchensteuerpflichtig"}
        />
        <Stat
          label="Sozialabgaben (Jahr, AN-Anteil)"
          value={formatEuro(sozialabgaben.summe)}
          hint={beschaeftigungsstatus === "SELBSTSTAENDIG" ? "keine Pflichtbeiträge" : "vom Brutto, nicht vom zvE"}
        />
        <Stat label="Netto nach allen Abzügen" value={formatEuro(nettoNachAllenAbzuegen)} hint="zvE abzüglich aller vier Abzüge oben" />
      </div>

      {beschaeftigungsstatus === "ANGESTELLT" && sozialabgaben.summe > 0 && (
        <Card>
          <CardTitle>Sozialabgaben im Detail</CardTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Rentenversicherung" value={formatEuro(sozialabgaben.rentenversicherung)} />
            <Stat label="Arbeitslosenversicherung" value={formatEuro(sozialabgaben.arbeitslosenversicherung)} />
            <Stat
              label="Krankenversicherung"
              value={gesetzlichKrankenversichert ? formatEuro(sozialabgaben.krankenversicherung) : "privat"}
            />
            <Stat
              label="Pflegeversicherung"
              value={gesetzlichKrankenversichert ? formatEuro(sozialabgaben.pflegeversicherung) : "privat"}
            />
          </div>
        </Card>
      )}

      <Card>
        <CardTitle>Nach allen Abzügen</CardTitle>
        <p className="text-sm text-slate-400">
          Vom zu versteuernden Einkommen bleiben nach Einkommensteuer, Solidaritätszuschlag, Kirchensteuer und Sozialabgaben{" "}
          <span className="font-medium text-slate-100">{formatEuro(nettoNachAllenAbzuegen)}</span> im Jahr
          (Gesamtabzüge: {formatEuro(abzuegeGesamt)}).
        </p>
        <p className="mt-3 text-xs text-slate-400">
          Vereinfachungen: nur Grundtabelle (kein Ehegatten-Splitting), keine Kinderfreibeträge, Pflegeversicherung ohne
          Staffelung nach Kinderzahl, privat Versicherte ohne individuelle Prämie, Selbstständige ohne freiwillige Beiträge —
          Modell-Richtwert, keine Steuerberatung oder Lohnabrechnung.
        </p>
      </Card>

      <Card>
        <CardTitle>Grenzsteuersatz nach Einkommen</CardTitle>
        <div role="img" aria-label="Flächendiagramm: Grenzsteuersatz nach zu versteuerndem Einkommen, mit Markierung des eigenen zvE">
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
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Der orangene Punkt markiert dein eingegebenes zvE. Zeigt nur den Grenzsteuersatz der Einkommensteuer, ohne
          Soli/Kirchensteuer/Sozialabgaben.
        </p>
      </Card>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-100">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </Card>
  );
}
