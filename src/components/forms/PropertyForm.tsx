"use client";

import { useMemo, useTransition } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { AmpelBadge } from "@/components/ui/Badge";
import { DualUnitInput } from "@/components/forms/DualUnitInput";
import { OverridableField } from "@/components/forms/OverridableField";
import { ObjektChartsPanel } from "@/components/charts/ObjektChartsPanel";
import { berechneObjekt } from "@/server/calc/engine";
import {
  BUNDESLAENDER,
  EIGENTUMSTYPEN,
  FINANZIERUNGSARTEN,
  GEWERKE,
  LAGETYPEN,
  OBJEKTTYPEN,
  SANIERUNGSMODI,
  type CalculationResult,
  type ProfileInput,
  type ReferenceDataSnapshot,
} from "@/server/calc/types";
import type { PropertyFormValues } from "@/server/actions/property";
import {
  BUNDESLAND_LABELS,
  EIGENTUMSTYP_LABELS,
  FINANZIERUNGSART_LABELS,
  GEWERK_LABELS,
  LAGETYP_LABELS,
  OBJEKTTYP_LABELS,
  SANIERUNGSMODUS_LABELS,
  ZUSTAND_LABELS,
} from "@/lib/labels";
import { formatEuro } from "@/lib/format";

export function PropertyForm({
  defaultValues,
  profile,
  referenceData,
  onSubmit,
  submitLabel,
  showCharts = false,
}: {
  defaultValues: PropertyFormValues;
  profile: ProfileInput;
  referenceData: ReferenceDataSnapshot;
  onSubmit: (values: PropertyFormValues) => Promise<void>;
  submitLabel: string;
  showCharts?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const { register, control, handleSubmit, setValue, getValues } = useForm<PropertyFormValues>({ defaultValues });
  const gewerkeArray = useFieldArray({ control, name: "gewerke" });

  const watched = useWatch({ control });

  const result = useMemo<CalculationResult | null>(() => {
    try {
      const values = { ...getValues(), ...watched } as PropertyFormValues;
      if (!values.wohnflaeche || values.wohnflaeche <= 0) return null;
      return berechneObjekt(values, profile, referenceData);
    } catch {
      return null;
    }
  }, [watched, profile, referenceData, getValues]);

  const wohnflaeche = Number(watched.wohnflaeche) || 0;
  const kaufpreis = Number(watched.kaufpreis) || 0;

  const berechneNebenkostenAutomatisch = () => {
    setValue("grunderwerbsteuerOverride", false);
    setValue("notarOverride", false);
    setValue("grundbuchOverride", false);
    setValue("maklerprovisionOverride", false);
  };

  const submit = handleSubmit((values) => {
    startTransition(async () => {
      await onSubmit(values);
    });
  });

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-6">
        <Card>
          <CardTitle>Objekt</CardTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2">
              <Input {...register("name")} placeholder="z. B. Musterstraße 12, Köln" />
            </Field>
            <Field label="Kaufpreis (€)">
              <Input type="number" step="any" {...register("kaufpreis", { valueAsNumber: true })} />
            </Field>
            <Field label="Wohnfläche (m²)">
              <Input type="number" step="any" {...register("wohnflaeche", { valueAsNumber: true })} />
            </Field>
            <Field label="Bundesland">
              <Select {...register("bundesland")}>
                {BUNDESLAENDER.map((b) => (
                  <option key={b} value={b}>
                    {BUNDESLAND_LABELS[b]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Lagetyp">
              <Select {...register("lagetyp")}>
                {LAGETYPEN.map((l) => (
                  <option key={l} value={l}>
                    {LAGETYP_LABELS[l]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Objekttyp">
              <Select {...register("objekttyp")}>
                {OBJEKTTYPEN.map((o) => (
                  <option key={o} value={o}>
                    {OBJEKTTYP_LABELS[o]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Baujahr">
              <Input type="number" {...register("baujahr", { valueAsNumber: true })} />
            </Field>
            <Field label="Anzahl Einheiten">
              <Input type="number" {...register("anzahlEinheiten", { valueAsNumber: true })} />
            </Field>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle className="mb-0">Kaufnebenkosten</CardTitle>
            <Button type="button" variant="secondary" size="sm" onClick={berechneNebenkostenAutomatisch}>
              Automatisch berechnen
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <OverridableField
              label="Grunderwerbsteuer (%)"
              control={control}
              register={register}
              valueField="grunderwerbsteuerProzent"
              overrideField="grunderwerbsteuerOverride"
              computedValue={result?.kaufnebenkosten.grunderwerbsteuerProzent ?? 0}
              setValue={setValue}
            />
            <OverridableField
              label="Notar (%)"
              control={control}
              register={register}
              valueField="notarProzent"
              overrideField="notarOverride"
              computedValue={result?.kaufnebenkosten.notarProzent ?? 1.0}
              setValue={setValue}
            />
            <OverridableField
              label="Grundbuch (%)"
              control={control}
              register={register}
              valueField="grundbuchProzent"
              overrideField="grundbuchOverride"
              computedValue={result?.kaufnebenkosten.grundbuchProzent ?? 0.5}
              setValue={setValue}
            />
            <OverridableField
              label="Maklerprovision (%)"
              control={control}
              register={register}
              valueField="maklerprovisionProzent"
              overrideField="maklerprovisionOverride"
              computedValue={result?.kaufnebenkosten.maklerprovisionProzent ?? 0}
              setValue={setValue}
            />
          </div>
          {result && (
            <p className="mt-3 text-sm text-slate-400">
              Summe Kaufnebenkosten: <span className="text-slate-200">{formatEuro(result.kaufnebenkosten.summeEuro)}</span>
            </p>
          )}
        </Card>

        <Card>
          <CardTitle>Sanierung / Sofortinvestition</CardTitle>
          <Field label="Modus" className="mb-4 max-w-xs">
            <Select {...register("sanierungsmodus")}>
              {SANIERUNGSMODI.map((s) => (
                <option key={s} value={s}>
                  {SANIERUNGSMODUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </Field>

          {watched.sanierungsmodus === "GRANULAR" ? (
            <GewerkeSubform control={control} register={register} fieldArray={gewerkeArray} result={result} />
          ) : (
            <Field label="Sofortinvestition (€)" className="max-w-xs">
              <Input type="number" step="any" {...register("sofortinvestitionPauschal", { valueAsNumber: true })} />
            </Field>
          )}
        </Card>

        <Card>
          <CardTitle>Finanzierung</CardTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Finanzierungsart" className="sm:col-span-2">
              <Select {...register("financing.finanzierungsart")}>
                {FINANZIERUNGSARTEN.map((f) => (
                  <option key={f} value={f}>
                    {FINANZIERUNGSART_LABELS[f]}
                  </option>
                ))}
              </Select>
            </Field>
            {watched.financing?.finanzierungsart === "MANUELL" && (
              <Field label="Eigenkapitalquote (%)">
                <Input type="number" step="any" {...register("financing.eigenkapitalquoteManuellProzent", { valueAsNumber: true })} />
              </Field>
            )}
            <Field label="Zinssatz (%)">
              <Input type="number" step="any" {...register("financing.zinssatzProzent", { valueAsNumber: true })} />
            </Field>
            <Field label="Anfängliche Tilgung (%)">
              <Input type="number" step="any" {...register("financing.anfaenglicheTilgungProzent", { valueAsNumber: true })} />
            </Field>
            <Field label="Zinsbindung (Jahre)">
              <Input type="number" {...register("financing.zinsbindungJahre", { valueAsNumber: true })} />
            </Field>
          </div>
          {result && (
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-md bg-slate-950/60 p-4 text-sm sm:grid-cols-3">
              <Stat label="Gesamtinvestition" value={formatEuro(result.finanzierung.gesamtinvestitionEuro)} />
              <Stat label="Darlehenssumme" value={formatEuro(result.finanzierung.darlehenssummeEuro)} />
              <Stat label="Eigenkapital-Einsatz" value={formatEuro(result.finanzierung.eigenkapitalEinsatzEuro)} />
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Miete</CardTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DualUnitInput control={control} name="kaltmieteMonatlich" label="Kaltmiete" wohnflaeche={wohnflaeche} />
            <Field label="Erwartete Mietsteigerung (%/Jahr)">
              <Input type="number" step="any" {...register("mietsteigerungProzentJaehrlich", { valueAsNumber: true })} />
            </Field>
          </div>
          {referenceData.mietpreisByBundeslandLagetyp[`${watched.bundesland}:${watched.lagetyp}`] != null && wohnflaeche > 0 && (
            <p className="mt-3 text-sm text-slate-400">
              Referenz-Mietpreis {LAGETYP_LABELS[watched.lagetyp ?? "GROSSSTADT"]}:{" "}
              <span className="text-slate-200">
                {referenceData.mietpreisByBundeslandLagetyp[`${watched.bundesland}:${watched.lagetyp}`]} €/m²
              </span>{" "}
              (dein Wert: {((Number(watched.kaltmieteMonatlich) || 0) / wohnflaeche).toFixed(2)} €/m²)
            </p>
          )}
        </Card>

        <Card>
          <CardTitle>Laufende Kosten</CardTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Hausgeld umlagefähig (€/Monat)">
              <Input type="number" step="any" {...register("hausgeldUmlagefaehigMonatlich", { valueAsNumber: true })} />
            </Field>
            <Field label="Hausgeld nicht umlagefähig (€/Monat)">
              <Input type="number" step="any" {...register("hausgeldNichtUmlagefaehigMonatlich", { valueAsNumber: true })} />
            </Field>
            <OverridableField
              label="Instandhaltungsrücklage (€/Monat)"
              control={control}
              register={register}
              valueField="instandhaltungsruecklageMonatlich"
              overrideField="instandhaltungsruecklageOverride"
              computedValue={result?.instandhaltung.empfohleneRuecklageMonatlich ?? 0}
              setValue={setValue}
              step="any"
            />
            <Field label="Verwaltungskosten (€/Monat)">
              <Input type="number" step="any" {...register("verwaltungskostenMonatlich", { valueAsNumber: true })} />
            </Field>
            <Field label="Leerstandsquote (%)">
              <Input type="number" step="any" {...register("leerstandsquoteProzent", { valueAsNumber: true })} />
            </Field>
            <Field label="Versicherung (€/Jahr)">
              <Input type="number" step="any" {...register("versicherungJaehrlich", { valueAsNumber: true })} />
            </Field>
          </div>
        </Card>

        <Card>
          <CardTitle>Steuer (Näherung)</CardTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="AfA-Satz (%)">
              <Input type="number" step="any" {...register("afaSatzProzent", { valueAsNumber: true })} />
            </Field>
            <Field label="Sonderabschreibung Neubau">
              <div className="flex h-[38px] items-center">
                <Switch {...register("afaSonderabschreibung")} />
              </div>
            </Field>
          </div>
          {result && <p className="mt-3 text-sm text-slate-400">Grenzsteuersatz (aus Profil): <span className="text-slate-200">{result.rendite.grenzsteuersatzProzent}%</span></p>}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle className="mb-0">Exit-Szenario</CardTitle>
            <Switch {...register("exit.geplant")} />
          </div>
          <div className={`mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 ${watched.exit?.geplant ? "" : "opacity-40"}`}>
            <Field label="Erwartete Wertsteigerung (%/Jahr)">
              <Input
                type="number"
                step="any"
                disabled={!watched.exit?.geplant}
                {...register("exit.wertsteigerungProzentJaehrlich", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Geplante Haltedauer (Jahre)">
              <Input
                type="number"
                disabled={!watched.exit?.geplant}
                {...register("exit.haltedauerJahre", { valueAsNumber: true })}
              />
            </Field>
          </div>
        </Card>

        <Button type="submit" disabled={isPending} className="self-start">
          {isPending ? "Speichert…" : submitLabel}
        </Button>
      </div>

      <div className="flex flex-col gap-6 xl:sticky xl:top-6 xl:self-start">
        {result ? (
          <>
            <Card>
              <CardTitle>Kennzahlen</CardTitle>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Bruttomietrendite" value={`${result.rendite.bruttomietrenditeProzent}%`} />
                <Stat label="Nettomietrendite" value={`${result.rendite.nettomietrenditeProzent}%`} />
                <Stat label="Kaufpreisfaktor" value={result.rendite.kaufpreisfaktor.toFixed(2)} />
                <Stat label="EK-Rendite" value={`${result.rendite.eigenkapitalrenditeProzent}%`} />
                <Stat label="Cashflow vor Steuer" value={formatEuro(result.rendite.monatlicherCashflowVorSteuer) + "/Mon."} />
                <Stat label="Cashflow nach Steuer" value={formatEuro(result.rendite.monatlicherCashflowNachSteuer) + "/Mon."} />
              </div>
            </Card>

            <Card>
              <div className="mb-3 flex items-center justify-between">
                <CardTitle className="mb-0">Rechnet sich das?</CardTitle>
                <AmpelBadge status={result.affordability.ampel} />
              </div>
              <p className={`text-sm ${result.dealBreaker.rechnetSich ? "text-emerald-400" : "text-amber-400"}`}>
                {result.dealBreaker.meldung}
              </p>
              {result.affordability.begruendung.map((b, i) => (
                <p key={i} className="mt-2 text-xs text-slate-500">
                  {b}
                </p>
              ))}
            </Card>

            {showCharts && <ObjektChartsPanel result={result} />}
          </>
        ) : (
          <Card>
            <p className="text-sm text-slate-500">Wohnfläche &gt; 0 eingeben, um Kennzahlen live zu sehen.</p>
          </Card>
        )}
      </div>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-100">{value}</div>
    </div>
  );
}

function GewerkeSubform({
  control,
  register,
  fieldArray,
  result,
}: {
  control: any;
  register: any;
  fieldArray: ReturnType<typeof useFieldArray<PropertyFormValues, "gewerke">>;
  result: CalculationResult | null;
}) {
  const { fields, append, remove } = fieldArray;

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() => append({ gewerk: "DACH", zustand: 3, eigentumsTyp: "SONDEREIGENTUM", geschaetzteKostenOverride: null, kommentar: "" })}
      >
        + Gewerk hinzufügen
      </Button>

      {fields.map((field, index) => {
        const posten = result?.gewerke.posten[index];
        return (
          <div key={field.id} className="grid grid-cols-1 gap-3 rounded-md border border-slate-800 p-3 sm:grid-cols-[1.2fr_1fr_1.2fr_1fr_auto]">
            <Field label="Gewerk">
              <Select {...register(`gewerke.${index}.gewerk` as const)}>
                {GEWERKE.map((g) => (
                  <option key={g} value={g}>
                    {GEWERK_LABELS[g]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Zustand">
              <Select {...register(`gewerke.${index}.zustand` as const, { valueAsNumber: true })}>
                {[1, 2, 3, 4, 5, 6].map((z) => (
                  <option key={z} value={z}>
                    {ZUSTAND_LABELS[z]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Eigentumstyp">
              <Select {...register(`gewerke.${index}.eigentumsTyp` as const)}>
                {EIGENTUMSTYPEN.map((e) => (
                  <option key={e} value={e}>
                    {EIGENTUMSTYP_LABELS[e]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Geschätzte Kosten" hint={posten ? formatEuro(posten.geschaetzteKostenEuro) + " (auto)" : undefined}>
              <Input
                type="number"
                step="any"
                placeholder="auto"
                {...register(`gewerke.${index}.geschaetzteKostenOverride` as const, {
                  setValueAs: (v: string) => (v === "" ? null : Number(v)),
                })}
              />
            </Field>
            <div className="flex items-end">
              <Button type="button" variant="danger" size="sm" onClick={() => remove(index)}>
                Entfernen
              </Button>
            </div>
          </div>
        );
      })}

      {result && fields.length > 0 && (
        <p className="text-sm text-slate-400">
          Summe Sanierung: <span className="text-slate-200">{formatEuro(result.gewerke.summeGesamtEuro)}</span> · Risiko-Score:{" "}
          <span className="text-slate-200">{result.gewerke.risikoScore.toFixed(1)}</span>
        </p>
      )}
    </div>
  );
}
