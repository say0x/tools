"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch, type FieldErrors } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { AmpelBadge } from "@/components/ui/Badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
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
  VERGLASUNGSARTEN,
  type CalculationResult,
  type ProfileInput,
  type ReferenceDataSnapshot,
} from "@/server/calc/types";
import type { PropertyFormValues } from "@/server/actions/property";
import { propertySchema } from "@/server/actions/property-schema";
import {
  BUNDESLAND_LABELS,
  EIGENTUMSTYP_LABELS,
  FINANZIERUNGSART_LABELS,
  GEWERK_LABELS,
  LAGETYP_LABELS,
  OBJEKTTYP_LABELS,
  SANIERUNGSMODUS_LABELS,
  VERGLASUNG_LABELS,
  ZUSTAND_LABELS,
} from "@/lib/labels";
import { GEWERK_ZUSTAND_BESCHREIBUNG } from "@/lib/gewerk-zustand-beschreibungen";
import { formatEuro, formatNumber } from "@/lib/format";
import { FIELD_HILFE } from "@/lib/field-hilfe";
import { formatiereVerhandlungsargument } from "@/lib/verhandlungstexte";
import { ZUSTANDSFAKTOR } from "@/server/calc/constants";
import { MAKLERPROVISION_DEFAULT_PROZENT } from "@/server/calc/costs/kaufnebenkosten";

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
  const [gespeichert, setGespeichert] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = useForm<PropertyFormValues>({ defaultValues, resolver: zodResolver(propertySchema) });
  const gewerkeArray = useFieldArray({ control, name: "gewerke" });

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

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
      reset(values);
      setGespeichert(true);
      setTimeout(() => setGespeichert(false), 2500);
    });
  });

  const fehlerListe = flattenErrors(errors);

  return (
    <form onSubmit={submit} className="grid grid-cols-1 gap-6 pb-20 lg:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-6">
        {fehlerListe.length > 0 && (
          <Card className="border-red-900/50 bg-red-950/20">
            <p className="text-sm font-medium text-red-400">Bitte folgende Angaben korrigieren:</p>
            <ul className="mt-2 list-disc pl-5 text-sm text-red-300">
              {fehlerListe.map((meldung, i) => (
                <li key={i}>{meldung}</li>
              ))}
            </ul>
          </Card>
        )}

        <Card>
          <CardTitle>Objekt</CardTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name" className="sm:col-span-2" error={errors.name?.message}>
              <Input {...register("name")} placeholder="z. B. Musterstraße 12, Köln" />
            </Field>
            <Field
              label="Kaufpreis (€)"
              hint={wohnflaeche > 0 ? `${formatEuro(Math.round(kaufpreis / wohnflaeche))}/m²` : undefined}
              error={errors.kaufpreis?.message}
            >
              <Input type="number" step="any" {...register("kaufpreis", { valueAsNumber: true })} />
            </Field>
            <Field label="Wohnfläche (m²)" error={errors.wohnflaeche?.message}>
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
            <Field label="Baujahr" error={errors.baujahr?.message}>
              <Input type="number" {...register("baujahr", { valueAsNumber: true })} />
            </Field>
            <Field label="Anzahl Einheiten" error={errors.anzahlEinheiten?.message}>
              <Input type="number" {...register("anzahlEinheiten", { valueAsNumber: true })} />
            </Field>
          </div>
        </Card>

        <Card>
          <CardTitle>Ansprechpartner / Makler</CardTitle>
          <p className="mb-4 text-xs text-slate-500">
            Reine Notizfelder, fließen nicht in die Berechnung ein.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Name">
              <Input {...register("ansprechpartnerName")} placeholder="z. B. Max Mustermann, ImmoMakler GmbH" />
            </Field>
            <Field label="Telefon">
              <Input {...register("ansprechpartnerTelefon")} placeholder="z. B. 0170 1234567" />
            </Field>
            <Field label="E-Mail">
              <Input type="email" {...register("ansprechpartnerEmail")} placeholder="z. B. kontakt@makler.de" />
            </Field>
            <Field label="Notizen" className="sm:col-span-2">
              <Textarea {...register("ansprechpartnerNotizen")} rows={2} placeholder="z. B. Besichtigungstermin, Provisionsabsprache, offene Fragen" />
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
              label={
                <>
                  Grunderwerbsteuer (%) <InfoTooltip text={FIELD_HILFE.grunderwerbsteuer} />
                </>
              }
              control={control}
              register={register}
              valueField="grunderwerbsteuerProzent"
              overrideField="grunderwerbsteuerOverride"
              computedValue={result?.kaufnebenkosten.grunderwerbsteuerProzent ?? 0}
              setValue={setValue}
              formel={`Übernommen aus dem Bundesland ${BUNDESLAND_LABELS[watched.bundesland ?? "NORDRHEIN_WESTFALEN"]}: ${referenceData.grunderwerbsteuerByBundesland[watched.bundesland ?? "NORDRHEIN_WESTFALEN"] ?? 0}% (editierbar auf /immobilien/referenzdaten).`}
            />
            <OverridableField
              label={
                <>
                  Notar (%) <InfoTooltip text={FIELD_HILFE.notar} />
                </>
              }
              control={control}
              register={register}
              valueField="notarProzent"
              overrideField="notarOverride"
              computedValue={result?.kaufnebenkosten.notarProzent ?? 1.0}
              setValue={setValue}
              formel={`Standard-Satz aus den Referenzdaten: ${referenceData.notarProzentDefault}% vom Kaufpreis.`}
            />
            <OverridableField
              label={
                <>
                  Grundbuch (%) <InfoTooltip text={FIELD_HILFE.grundbuch} />
                </>
              }
              control={control}
              register={register}
              valueField="grundbuchProzent"
              overrideField="grundbuchOverride"
              computedValue={result?.kaufnebenkosten.grundbuchProzent ?? 0.5}
              setValue={setValue}
              formel={`Standard-Satz aus den Referenzdaten: ${referenceData.grundbuchProzentDefault}% vom Kaufpreis.`}
            />
            <OverridableField
              label={
                <>
                  Maklerprovision (%) <InfoTooltip text={FIELD_HILFE.maklerprovision} />
                </>
              }
              control={control}
              register={register}
              valueField="maklerprovisionProzent"
              overrideField="maklerprovisionOverride"
              computedValue={result?.kaufnebenkosten.maklerprovisionProzent ?? 0}
              setValue={setValue}
              formel={`Kein Makler bekannt: grober Richtwert von ${MAKLERPROVISION_DEFAULT_PROZENT}% (üblicher hälftiger Käuferanteil inkl. USt.) angenommen. Sobald ein Makler feststeht, hier den tatsächlichen Satz eintragen.`}
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
            <GewerkeSubform
              control={control}
              register={register}
              fieldArray={gewerkeArray}
              result={result}
              referenceData={referenceData}
              wohnflaeche={wohnflaeche}
              watched={watched}
              errors={errors}
            />
          ) : (
            <Field
              label="Sofortinvestition (€)"
              className="max-w-xs"
              hint={
                wohnflaeche > 0 && Number(watched.sofortinvestitionPauschal) > 0
                  ? `${formatEuro(Math.round((Number(watched.sofortinvestitionPauschal) || 0) / wohnflaeche))}/m²`
                  : undefined
              }
            >
              <Input type="number" step="any" {...register("sofortinvestitionPauschal", { valueAsNumber: true })} />
            </Field>
          )}
        </Card>

        <Card>
          <CardTitle>Finanzierung</CardTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label={
                <>
                  Finanzierungsart <InfoTooltip text={FIELD_HILFE.finanzierungsart} />
                </>
              }
              className="sm:col-span-2"
            >
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
            <Field
              label={
                <>
                  Zinsbindung (Jahre) <InfoTooltip text={FIELD_HILFE.zinsbindung} />
                </>
              }
            >
              <Input type="number" {...register("financing.zinsbindungJahre", { valueAsNumber: true })} />
            </Field>
            <Field
              label={
                <>
                  Anschlusszins-Aufschlag (Prozentpunkte) <InfoTooltip text={FIELD_HILFE.anschlusszinsAufschlag} />
                </>
              }
              hint={
                result
                  ? `Angenommener Zins ab Jahr ${result.meilensteine.zinsbindungEndeJahr + 1}: ${formatNumber(result.meilensteine.anschlusszinssatzProzent)}%`
                  : undefined
              }
            >
              <Input type="number" step="any" {...register("financing.anschlusszinsAufschlagProzent", { valueAsNumber: true })} />
            </Field>
            <Field
              label={
                <>
                  Sondertilgung (%/Jahr) <InfoTooltip text={FIELD_HILFE.sondertilgung} />
                </>
              }
              error={errors.financing?.sondertilgungProzent?.message}
              hint={
                result && result.tilgungsplan[0]
                  ? `→ ${formatEuro(result.tilgungsplan[0].sondertilgungBetrag)}/Jahr zusätzlich`
                  : undefined
              }
            >
              <Input type="number" step="any" {...register("financing.sondertilgungProzent", { valueAsNumber: true })} />
            </Field>
            <Field
              label={
                <>
                  Max. Sondertilgung laut Vertrag (%/Jahr) <InfoTooltip text={FIELD_HILFE.sondertilgungMax} />
                </>
              }
            >
              <Input type="number" step="any" {...register("financing.sondertilgungMaxProzent", { valueAsNumber: true })} />
            </Field>
          </div>
          {result && (
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-md bg-slate-950/60 p-4 text-sm sm:grid-cols-3">
              <Stat
                label="Gesamtinvestition"
                value={formatEuro(result.finanzierung.gesamtinvestitionEuro)}
                subValue={wohnflaeche > 0 ? `${formatEuro(Math.round(result.finanzierung.gesamtinvestitionEuro / wohnflaeche))}/m²` : undefined}
              />
              <Stat label="Darlehenssumme" value={formatEuro(result.finanzierung.darlehenssummeEuro)} />
              <Stat label="Eigenkapital-Einsatz" value={formatEuro(result.finanzierung.eigenkapitalEinsatzEuro)} />
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Miete &amp; Wertentwicklung</CardTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DualUnitInput
              control={control}
              name="kaltmieteMonatlich"
              label="Kaltmiete"
              wohnflaeche={wohnflaeche}
              error={errors.kaltmieteMonatlich?.message}
            />
            <Field
              label={
                <>
                  Erwartete Mietsteigerung (%/Jahr) <InfoTooltip text={FIELD_HILFE.mietsteigerung} />
                </>
              }
            >
              <Input type="number" step="any" {...register("mietsteigerungProzentJaehrlich", { valueAsNumber: true })} />
            </Field>
            <Field
              label={
                <>
                  Erwartete Wertsteigerung (%/Jahr) <InfoTooltip text={FIELD_HILFE.wertsteigerung} />
                </>
              }
            >
              <Input type="number" step="any" {...register("wertsteigerungProzentJaehrlich", { valueAsNumber: true })} />
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
            <Field
              label={
                <>
                  Kostensteigerung (%/Jahr) <InfoTooltip text={FIELD_HILFE.kostensteigerung} />
                </>
              }
            >
              <Input type="number" step="any" {...register("kostensteigerungProzentJaehrlich", { valueAsNumber: true })} />
            </Field>
            <Field
              label={
                <>
                  Hausgeld umlagefähig (€/Monat) <InfoTooltip text={FIELD_HILFE.hausgeldUmlagefaehig} />
                </>
              }
            >
              <Input type="number" step="any" {...register("hausgeldUmlagefaehigMonatlich", { valueAsNumber: true })} />
            </Field>
            <Field
              label={
                <>
                  Hausgeld nicht umlagefähig (€/Monat) <InfoTooltip text={FIELD_HILFE.hausgeldNichtUmlagefaehig} />
                </>
              }
            >
              <Input type="number" step="any" {...register("hausgeldNichtUmlagefaehigMonatlich", { valueAsNumber: true })} />
            </Field>
            <Field
              label={
                <>
                  Grundsteuer (€/Jahr) <InfoTooltip text={FIELD_HILFE.grundsteuer} />
                </>
              }
            >
              <Input type="number" step="any" {...register("grundsteuerJaehrlich", { valueAsNumber: true })} />
            </Field>
            <OverridableField
              label={
                <>
                  Instandhaltungsrücklage (€/Monat) <InfoTooltip text={FIELD_HILFE.instandhaltungsruecklage} />
                </>
              }
              control={control}
              register={register}
              valueField="instandhaltungsruecklageMonatlich"
              overrideField="instandhaltungsruecklageOverride"
              computedValue={result?.instandhaltung.empfohleneRuecklageMonatlich ?? 0}
              setValue={setValue}
              step="any"
              formel={
                result && (
                  <>
                    {result.instandhaltung.basisSatzProM2ProJahr} €/m²/Jahr × {wohnflaeche}m² ×{" "}
                    {result.instandhaltung.risikoMultiplikator} Risiko ÷ 12 ={" "}
                    {formatEuro(result.instandhaltung.empfohleneRuecklageMonatlich)}
                  </>
                )
              }
            />
            <Field
              label={
                <>
                  Verwaltungskosten (€/Monat) <InfoTooltip text={FIELD_HILFE.verwaltungskosten} />
                </>
              }
            >
              <Input type="number" step="any" {...register("verwaltungskostenMonatlich", { valueAsNumber: true })} />
            </Field>
            <Field
              label={
                <>
                  Leerstandsquote (%) <InfoTooltip text={FIELD_HILFE.leerstandsquote} />
                </>
              }
            >
              <Input type="number" step="any" {...register("leerstandsquoteProzent", { valueAsNumber: true })} />
            </Field>
            <Field
              label={
                <>
                  Versicherung (€/Jahr) <InfoTooltip text={FIELD_HILFE.versicherung} />
                </>
              }
            >
              <div className="flex items-center gap-2">
                <Input type="number" step="any" {...register("versicherungJaehrlich", { valueAsNumber: true })} />
                <label className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
                  <Switch {...register("versicherungUmlagefaehig")} />
                  umlagefähig
                  <InfoTooltip text={FIELD_HILFE.versicherungUmlagefaehig} />
                </label>
              </div>
            </Field>
          </div>
        </Card>

        <Card>
          <CardTitle>Steuer (Näherung)</CardTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <OverridableField
              label={
                <>
                  AfA-Satz (%) <InfoTooltip text={FIELD_HILFE.afaSatz} />
                </>
              }
              control={control}
              register={register}
              valueField="afaSatzProzent"
              overrideField="afaSatzProzentOverride"
              computedValue={result?.rendite.afaSatzProzentEffektiv ?? 2}
              setValue={setValue}
              formel={`Aus dem Baujahr ${watched.baujahr ?? 1995} hergeleitet (§7 Abs. 4 EStG): ${(watched.baujahr ?? 1995) < 1925 ? "2,5% (Altbau, Baujahr vor 1925)" : "2% (Standardsatz)"}.`}
            />
            <Field
              label={
                <>
                  Sonderabschreibung Neubau <InfoTooltip text={FIELD_HILFE.afaSonderabschreibung} />
                </>
              }
            >
              <div className="flex h-[38px] items-center">
                <Switch {...register("afaSonderabschreibung")} />
              </div>
            </Field>
          </div>
          {result && (
            <p className="mt-3 flex items-center gap-1 text-sm text-slate-400">
              Grenzsteuersatz (aus Profil): <span className="text-slate-200">{result.rendite.grenzsteuersatzProzent}%</span>
              <InfoTooltip text={FIELD_HILFE.grenzsteuersatz} />
            </p>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <CardTitle className="mb-0 flex items-center gap-1">
              Exit-Szenario <InfoTooltip text={FIELD_HILFE.exitSzenario} />
            </CardTitle>
            <Switch {...register("exit.geplant")} />
          </div>
          <div className={`mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 ${watched.exit?.geplant ? "" : "opacity-40"}`}>
            <Field label="Geplante Haltedauer (Jahre)">
              <Input
                type="number"
                disabled={!watched.exit?.geplant}
                {...register("exit.haltedauerJahre", { valueAsNumber: true })}
              />
            </Field>
          </div>
        </Card>

      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Speichert…" : submitLabel}
          </Button>
          {gespeichert && <span className="text-sm text-emerald-400">Gespeichert.</span>}
          {!gespeichert && isDirty && !isPending && (
            <span className="text-sm text-amber-400">Ungespeicherte Änderungen</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
        {result ? (
          <>
            <Card>
              <CardTitle>Kennzahlen</CardTitle>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Bruttomietrendite" value={`${result.rendite.bruttomietrenditeProzent}%`} />
                <Stat label="Nettomietrendite" value={`${result.rendite.nettomietrenditeProzent}%`} />
                <Stat label="Kaufpreisfaktor" value={formatNumber(result.rendite.kaufpreisfaktor)} />
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

            <Card>
              <div className="mb-3 flex items-center justify-between">
                <CardTitle className="mb-0">Kapitaleffizienz</CardTitle>
                <AmpelBadge status={result.kapitaleffizienz.ampel} />
              </div>
              {result.kapitaleffizienz.begruendung.map((b, i) => (
                <p key={i} className="text-xs text-slate-500">
                  {b}
                </p>
              ))}
            </Card>

            {result.verhandlungsargumente.length > 0 && (
              <Card>
                <CardTitle>Verhandlungs-Argumente</CardTitle>
                <p className="mb-3 text-xs text-slate-500">
                  Automatisch aus deinen Angaben abgeleitet — Fakten für ein Gespräch mit Verkäufer oder Makler.
                </p>
                <div className="flex flex-col gap-3">
                  {result.verhandlungsargumente.map((arg, i) => {
                    const { titel, text } = formatiereVerhandlungsargument(arg);
                    return (
                      <div key={i} className="rounded-md border border-amber-900/40 bg-amber-950/20 p-3">
                        <p className="text-sm font-medium text-amber-300">{titel}</p>
                        <p className="mt-1 text-sm text-slate-300">{text}</p>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

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

function Stat({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-100">{value}</div>
      {subValue && <div className="text-xs text-slate-500">{subValue}</div>}
    </div>
  );
}

function GewerkeSubform({
  control,
  register,
  fieldArray,
  result,
  referenceData,
  wohnflaeche,
  watched,
  errors,
}: {
  control: any;
  register: any;
  fieldArray: ReturnType<typeof useFieldArray<PropertyFormValues, "gewerke">>;
  result: CalculationResult | null;
  referenceData: ReferenceDataSnapshot;
  wohnflaeche: number;
  watched: { gewerke?: { gewerk?: string; zustand?: number }[] };
  errors: FieldErrors<PropertyFormValues>;
}) {
  const { fields, append, remove } = fieldArray;

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="self-start"
        onClick={() =>
          append({
            gewerk: "DACH",
            zustand: 3,
            eigentumsTyp: "SONDEREIGENTUM",
            geschaetzteKostenOverride: null,
            kommentar: "",
            baujahr: null,
            verglasung: null,
          })
        }
      >
        + Gewerk hinzufügen
      </Button>

      {fields.map((field, index) => {
        const posten = result?.gewerke.posten[index];
        const gewerkWert = watched.gewerke?.[index]?.gewerk as (typeof GEWERKE)[number] | undefined;
        const zustandWert = watched.gewerke?.[index]?.zustand;
        const istFenster = gewerkWert === "FENSTER";
        const gewerkErrors = errors.gewerke?.[index];
        const zustandBeschreibung =
          gewerkWert && zustandWert ? GEWERK_ZUSTAND_BESCHREIBUNG[gewerkWert]?.[zustandWert] : undefined;
        return (
          <div key={field.id} className="grid grid-cols-1 gap-3 rounded-md border border-slate-800 p-3 sm:grid-cols-[1.2fr_1fr_1.2fr_1fr_1fr_auto]">
            <Field label="Gewerk">
              <Select {...register(`gewerke.${index}.gewerk` as const)}>
                {GEWERKE.map((g) => (
                  <option key={g} value={g}>
                    {GEWERK_LABELS[g]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label={
                <>
                  Zustand {zustandBeschreibung && <InfoTooltip text={zustandBeschreibung} />}
                </>
              }
            >
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
            <Field
              label={
                <>
                  Baujahr / Einbaujahr <InfoTooltip text={FIELD_HILFE.gewerkBaujahr} />
                </>
              }
              error={gewerkErrors?.baujahr?.message}
            >
              <Input
                type="number"
                placeholder="optional"
                {...register(`gewerke.${index}.baujahr` as const, {
                  setValueAs: (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v)),
                })}
              />
            </Field>
            {istFenster ? (
              <Field
                label={
                  <>
                    Verglasung <InfoTooltip text={FIELD_HILFE.gewerkVerglasung} />
                  </>
                }
              >
                <Select
                  {...register(`gewerke.${index}.verglasung` as const, {
                    setValueAs: (v: unknown) => (v === "" ? null : v),
                  })}
                >
                  <option value="">— unbekannt —</option>
                  {VERGLASUNGSARTEN.map((v) => (
                    <option key={v} value={v}>
                      {VERGLASUNG_LABELS[v]}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <div />
            )}
            <div className="flex items-end">
              <Button type="button" variant="danger" size="sm" onClick={() => remove(index)}>
                Entfernen
              </Button>
            </div>
            <Field
              label="Geschätzte Kosten"
              className="sm:col-span-6"
              error={gewerkErrors?.geschaetzteKostenOverride?.message}
              hint={
                posten && !posten.istOverride
                  ? (() => {
                      const kosten = referenceData.gewerkKosten[posten.gewerk];
                      const mittelwert = round1((kosten.min + kosten.max) / 2);
                      const faktor = ZUSTANDSFAKTOR[posten.zustand] ?? ZUSTANDSFAKTOR[3];
                      const verglasungTeil =
                        posten.verglasungsfaktor != null
                          ? ` × ${posten.verglasungsfaktor} Verglasungsfaktor (${VERGLASUNG_LABELS[posten.verglasung ?? "DOPPEL"]})`
                          : "";
                      const alterTeil = posten.alterJahre != null ? ` · Alter: ${posten.alterJahre} Jahre (Baujahr ${posten.baujahr})` : "";
                      return `(${kosten.min}+${kosten.max})/2=${mittelwert}€/m² × ${wohnflaeche}m² × ${faktor * 100}% Zustand${verglasungTeil} = ${formatEuro(posten.geschaetzteKostenEuro)}${alterTeil}`;
                    })()
                  : posten
                    ? `Manuell: ${formatEuro(posten.geschaetzteKostenEuro)}`
                    : undefined
              }
            >
              <Input
                type="number"
                step="any"
                placeholder="auto"
                {...register(`gewerke.${index}.geschaetzteKostenOverride` as const, {
                  setValueAs: (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v)),
                })}
              />
            </Field>
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

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Sammelt alle react-hook-form-Fehlermeldungen (auch verschachtelte Objekte/Array-Felder) in einer flachen Liste. */
function flattenErrors(errors: FieldErrors<PropertyFormValues>): string[] {
  const meldungen: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if ("message" in node && typeof (node as { message?: unknown }).message === "string") {
      meldungen.push((node as { message: string }).message);
      return;
    }
    for (const value of Object.values(node as Record<string, unknown>)) {
      walk(value);
    }
  };
  walk(errors);
  return meldungen;
}
