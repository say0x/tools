"use client";

// Referenz (Kennzahlen-Sidebar, Exit-Szenario, Annahmen-Warnungen, Verhandlungsargumente): docs/tools/immobilien-rechner.md

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { BesitzstatusBadge } from "@/components/ui/Badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { BESITZSTAENDE, BESITZSTATUS_HILFE, BESITZSTATUS_LABELS } from "@/lib/asset";
import { DualUnitInput } from "@/components/forms/DualUnitInput";
import { OverridableField } from "@/components/forms/OverridableField";
import { GewerkeSubform } from "@/components/forms/GewerkeSubform";
import { Stat } from "@/components/forms/Stat";
import { PropertyKennzahlenSidebar } from "@/components/forms/PropertyKennzahlenSidebar";
import { berechneObjekt } from "@/server/calc/engine";
import {
  BUNDESLAENDER,
  FINANZIERUNGSARTEN,
  LAGETYPEN,
  OBJEKTTYPEN,
  SANIERUNGSMODI,
  type CalculationResult,
  type ProfileInput,
  type ReferenceDataSnapshot,
} from "@/server/calc/types";
import type { PropertyFormValues } from "@/server/actions/property";
import { propertySchema } from "@/server/actions/property-schema";
import {
  BUNDESLAND_LABELS,
  FINANZIERUNGSART_LABELS,
  LAGETYP_LABELS,
  OBJEKTTYP_LABELS,
  SANIERUNGSMODUS_LABELS,
} from "@/lib/labels";
import { formatEuro, formatNumber } from "@/lib/format";
import { FIELD_HILFE } from "@/lib/field-hilfe";
import { flattenFormErrors } from "@/lib/form-errors";
import { SPEKULATIONSFRIST_JAHRE } from "@/server/calc/constants";
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

  const fehlerListe = flattenFormErrors(errors);

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
            <Field
              label="Kaufdatum"
              hint="Für die Finanzübersicht: bestimmt, wie viele Jahre seit dem Kauf bereits vergangen sind (auch in der Zukunft möglich, für geplante Käufe)."
              error={errors.kaufdatum?.message}
            >
              <Input type="date" {...register("kaufdatum")} />
            </Field>
            <Field
              label={
                <>
                  Status <InfoTooltip text={BESITZSTATUS_HILFE[(watched.besitzstatus as (typeof BESITZSTAENDE)[number]) ?? "POTENZIELLE_ANSCHAFFUNG"]} />
                </>
              }
              className="sm:col-span-2"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Select {...register("besitzstatus")} className="max-w-xs">
                  {BESITZSTAENDE.map((status) => (
                    <option key={status} value={status}>
                      {BESITZSTATUS_LABELS[status]}
                    </option>
                  ))}
                </Select>
                <BesitzstatusBadge status={(watched.besitzstatus as (typeof BESITZSTAENDE)[number]) ?? "POTENZIELLE_ANSCHAFFUNG"} />
              </div>
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
          <CardTitle>Quelle &amp; Notizen</CardTitle>
          <p className="mb-4 text-xs text-slate-500">
            Reine Notizfelder, fließen nicht in die Berechnung ein.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Exposé-Link" error={errors.quelleUrl?.message}>
              <Input {...register("quelleUrl")} placeholder="z. B. https://www.immobilienscout24.de/expose/..." />
            </Field>
            <Field
              label="Notizen"
              hint="Z. B. welche Werte du geschätzt/angenommen hast, weil sie nicht im Exposé standen."
              error={errors.notizen?.message}
            >
              <Textarea {...register("notizen")} rows={3} placeholder="z. B. Hausgeld geschätzt (nicht im Exposé angegeben), Instandhaltungsrücklage aus Baujahr abgeleitet" />
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
            <>
              {watched.gewerke?.some((g) => g?.eigentumsTyp === "GEMEINSCHAFTSEIGENTUM") && (
                <div className="mb-4 grid grid-cols-1 gap-4 rounded-md border border-slate-800 p-3 sm:grid-cols-2">
                  <Field
                    label={
                      <>
                        Gesamtwohnfläche Gebäude/WEG (m²) <InfoTooltip text={FIELD_HILFE.gebaeudeWohnflaecheGesamt} />
                      </>
                    }
                  >
                    <Input
                      type="number"
                      step="any"
                      placeholder="optional"
                      {...register("gebaeudeWohnflaecheGesamt", {
                        setValueAs: (v: unknown) => (v === "" || v === null || v === undefined ? null : Number(v)),
                      })}
                    />
                  </Field>
                  <OverridableField
                    label={
                      <>
                        Miteigentumsanteil (%) <InfoTooltip text={FIELD_HILFE.miteigentumsanteil} />
                      </>
                    }
                    control={control}
                    register={register}
                    valueField="miteigentumsanteilProzent"
                    overrideField="miteigentumsanteilOverride"
                    computedValue={result?.gewerke.miteigentumsanteilProzentEffektiv ?? 100}
                    setValue={setValue}
                    formel={
                      watched.gebaeudeWohnflaecheGesamt
                        ? `Aus deiner Wohnfläche (${wohnflaeche} m²) / Gesamtwohnfläche (${watched.gebaeudeWohnflaecheGesamt} m²) hergeleitet.`
                        : "Ohne Gesamtwohnfläche wird 100% angenommen — Gemeinschaftseigentum-Kosten laufen dann wie bisher über deine eigene Wohnfläche. Trag die Gesamtwohnfläche ein, um hier deinen tatsächlichen Anteil (z. B. aus dem Grundbuch) zu hinterlegen."
                    }
                  />
                </div>
              )}
              <GewerkeSubform
                register={register}
                fieldArray={gewerkeArray}
                result={result}
                referenceData={referenceData}
                wohnflaeche={wohnflaeche}
                watched={watched}
                errors={errors}
              />
            </>
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
          <div className="mb-1 flex items-center justify-between">
            <CardTitle className="mb-0">Finanzierung</CardTitle>
            <Link href="/kreditvergleich" className="text-sm text-blue-400 hover:underline">
              Gegen anderes Angebot vergleichen →
            </Link>
          </div>
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
          <div className="mb-1 flex items-center justify-between">
            <CardTitle className="mb-0">Steuer (Näherung)</CardTitle>
            <Link href="/steuerrechner" className="text-sm text-blue-400 hover:underline">
              Anderes Einkommen durchspielen →
            </Link>
          </div>
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
          {watched.exit?.geplant && result?.exitSzenario && (
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-md bg-slate-950/60 p-4 text-sm sm:grid-cols-3">
              <Stat label="Verkaufspreis" value={formatEuro(result.exitSzenario.verkaufspreisEuro)} />
              <Stat label="Restschuld" value={formatEuro(result.exitSzenario.restschuldEuro)} />
              <Stat label="Erlös vor Steuer" value={formatEuro(result.exitSzenario.erloesVorSteuerEuro)} />
              <Stat
                label="Spekulationssteuer (§23 EStG)"
                value={
                  result.exitSzenario.spekulationssteuer.pflichtig
                    ? formatEuro(result.exitSzenario.spekulationssteuer.steuerEuro)
                    : "entfällt"
                }
                subValue={
                  result.exitSzenario.spekulationssteuer.pflichtig
                    ? `Verkauf < ${SPEKULATIONSFRIST_JAHRE} Jahre nach Kauf, Gewinn ${formatEuro(result.exitSzenario.spekulationssteuer.veraeusserungsgewinnEuro)}`
                    : `Verkauf ≥ ${SPEKULATIONSFRIST_JAHRE} Jahre nach Kauf, steuerfrei`
                }
              />
              <Stat label="Erlös nach Steuer" value={formatEuro(result.exitSzenario.erloesNachSteuerEuro)} />
            </div>
          )}
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
        <PropertyKennzahlenSidebar result={result} showCharts={showCharts} />
      </div>
    </form>
  );
}
