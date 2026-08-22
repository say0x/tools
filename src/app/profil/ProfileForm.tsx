"use client";

import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { OverridableField } from "@/components/forms/OverridableField";
import { berechneGrenzsteuersatz } from "@/server/calc/tax/grenzsteuersatz";
import { schaetzeZvEAusBrutto } from "@/server/calc/tax/zve-schaetzung";
import { formatEuro, formatNumber } from "@/lib/format";
import { FIELD_HILFE } from "@/lib/field-hilfe";
import { type ProfileFormValues, upsertProfile } from "@/server/actions/profile";
import { profileSchema } from "@/server/actions/profile-schema";

export function ProfileForm({ initialValues }: { initialValues: ProfileFormValues }) {
  const [isPending, startTransition] = useTransition();
  const [gespeichert, setGespeichert] = useState(false);
  const [serverFehler, setServerFehler] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    defaultValues: initialValues,
    resolver: zodResolver(profileSchema),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "liabilities" });

  // useWatch statt form.watch(): Letzteres liefert eine nicht memoizierbare Funktion zurück
  // und lässt den React Compiler die Memoization für die ganze Komponente überspringen.
  const brutto = useWatch({ control, name: "bruttoEinkommenMonatlich" });
  const zvE = useWatch({ control, name: "zuVersteuerndesEinkommenJaehrlich" });
  const netto = useWatch({ control, name: "nettoEinkommenMonatlich" });
  const fixkosten = useWatch({ control, name: "fixkostenMonatlich" });

  const zvESchaetzung = useMemo(() => schaetzeZvEAusBrutto((Number(brutto) || 0) * 12), [brutto]);
  const grenzsteuersatz = useMemo(() => berechneGrenzsteuersatz(Number(zvE) || 0, new Date().getFullYear()), [zvE]);
  const verfuegbaresBudget = (Number(netto) || 0) - (Number(fixkosten) || 0);

  const onSubmit = handleSubmit((values) => {
    setServerFehler(null);
    startTransition(async () => {
      try {
        await upsertProfile(values);
        setGespeichert(true);
        setTimeout(() => setGespeichert(false), 2500);
      } catch (err) {
        setServerFehler(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
      }
    });
  });

  const fehlerListe = flattenErrors(errors);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {(fehlerListe.length > 0 || serverFehler) && (
        <Card className="border-red-900/50 bg-red-950/20">
          <p className="text-sm font-medium text-red-400">Bitte folgende Angaben korrigieren:</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-red-300">
            {serverFehler && <li>{serverFehler}</li>}
            {fehlerListe.map((meldung, i) => (
              <li key={i}>{meldung}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardTitle>Einkommen &amp; Budget</CardTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={
              <>
                Brutto-Einkommen (€/Monat) <InfoTooltip text={FIELD_HILFE.bruttoEinkommen} />
              </>
            }
            hint={`≈ ${formatEuro((Number(brutto) || 0) * 12)} pro Jahr`}
            error={errors.bruttoEinkommenMonatlich?.message}
          >
            <Input type="number" step="any" min={0} {...register("bruttoEinkommenMonatlich", { valueAsNumber: true })} />
          </Field>
          <Field
            label={
              <>
                Netto-Einkommen (€/Monat) <InfoTooltip text={FIELD_HILFE.nettoEinkommen} />
              </>
            }
            error={errors.nettoEinkommenMonatlich?.message}
          >
            <Input type="number" step="any" min={0} {...register("nettoEinkommenMonatlich", { valueAsNumber: true })} />
          </Field>
          <OverridableField
            label={
              <>
                Zu versteuerndes Einkommen (€/Jahr) <InfoTooltip text={FIELD_HILFE.zvE} />
              </>
            }
            control={control}
            register={register}
            valueField="zuVersteuerndesEinkommenJaehrlich"
            overrideField="zvEOverride"
            computedValue={zvESchaetzung}
            setValue={setValue}
          />
          <Field
            label={
              <>
                Fixkosten (€/Monat) <InfoTooltip text={FIELD_HILFE.fixkosten} />
              </>
            }
            error={errors.fixkostenMonatlich?.message}
          >
            <Input type="number" step="any" min={0} {...register("fixkostenMonatlich", { valueAsNumber: true })} />
          </Field>
          <Field label="Vorhandenes Eigenkapital (€)" error={errors.vorhandenesEigenkapital?.message}>
            <Input type="number" step="any" min={0} {...register("vorhandenesEigenkapital", { valueAsNumber: true })} />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-6 rounded-md bg-slate-950/60 p-4">
          <div>
            <div className="text-xs text-slate-500">Grenzsteuersatz (live)</div>
            <div className="text-lg font-semibold text-slate-100">{formatNumber(grenzsteuersatz)} %</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Verfügbares Budget (€/Monat)</div>
            <div className="text-lg font-semibold text-slate-100">{formatEuro(verfuegbaresBudget)}</div>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Affordability-Schwellen</CardTitle>
        <p className="mb-4 text-sm text-slate-400">
          Diese Werte steuern die Ampel bei jeder Objekt-Berechnung (&quot;kann ich mir das leisten?&quot;).
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={
              <>
                Max. Schuldendienstquote (%) <InfoTooltip text={FIELD_HILFE.maxSchuldendienstquote} />
              </>
            }
            error={errors.maxSchuldendienstquoteProzent?.message}
          >
            <Input type="number" step="any" min={0} max={100} {...register("maxSchuldendienstquoteProzent", { valueAsNumber: true })} />
          </Field>
          <Field
            label={
              <>
                Mindest-Liquiditätsreserve (€) <InfoTooltip text={FIELD_HILFE.mindestLiquiditaetsreserve} />
              </>
            }
            error={errors.mindestLiquiditaetsreserveEuro?.message}
          >
            <Input type="number" step="any" min={0} {...register("mindestLiquiditaetsreserveEuro", { valueAsNumber: true })} />
          </Field>
          <Field
            label={
              <>
                Mietanrechnung durch Bank (%) <InfoTooltip text={FIELD_HILFE.mietanrechnung} />
              </>
            }
            error={errors.mietanrechnungProzent?.message}
          >
            <Input type="number" step="any" min={0} max={100} {...register("mietanrechnungProzent", { valueAsNumber: true })} />
          </Field>
        </div>
      </Card>

      <Card>
        <CardTitle>Kapitaleffizienz-Schwellen</CardTitle>
        <p className="mb-4 text-sm text-slate-400">
          Eigenständiges Signal, ob eingesetztes Eigenkapital effizient arbeitet — unabhängig von Cashflow und
          Schuldendienstquote (relevant z. B. wenn viel EK statt eines größeren Kredits verwendet wird).
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={
              <>
                Mindest-Eigenkapitalrendite (%) <InfoTooltip text={FIELD_HILFE.mindestEigenkapitalrendite} />
              </>
            }
            error={errors.mindestEigenkapitalrenditeProzent?.message}
          >
            <Input type="number" step="any" {...register("mindestEigenkapitalrenditeProzent", { valueAsNumber: true })} />
          </Field>
          <Field
            label={
              <>
                Prüfschwelle EK-Einsatz (€) <InfoTooltip text={FIELD_HILFE.eigenkapitalPruefungAb} />
              </>
            }
            error={errors.eigenkapitalPruefungAbEuro?.message}
          >
            <Input type="number" step="any" min={0} {...register("eigenkapitalPruefungAbEuro", { valueAsNumber: true })} />
          </Field>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle className="mb-0">Bestehende Kredite</CardTitle>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append({ bezeichnung: "", monatlicheRate: 0, restschuld: 0 })}
          >
            + Kredit hinzufügen
          </Button>
        </div>

        {fields.length === 0 && <p className="text-sm text-slate-500">Keine bestehenden Kredite erfasst.</p>}

        <div className="flex flex-col gap-3">
          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-1 gap-3 rounded-md border border-slate-800 p-3 sm:grid-cols-[2fr_1fr_1fr_auto]">
              <Field label="Bezeichnung" error={errors.liabilities?.[index]?.bezeichnung?.message}>
                <Input {...register(`liabilities.${index}.bezeichnung` as const)} />
              </Field>
              <Field label="Rate (€/Monat)" error={errors.liabilities?.[index]?.monatlicheRate?.message}>
                <Input
                  type="number"
                  step="any"
                  min={0}
                  {...register(`liabilities.${index}.monatlicheRate` as const, { valueAsNumber: true })}
                />
              </Field>
              <Field label="Restschuld (€)" error={errors.liabilities?.[index]?.restschuld?.message}>
                <Input
                  type="number"
                  step="any"
                  min={0}
                  {...register(`liabilities.${index}.restschuld` as const, { valueAsNumber: true })}
                />
              </Field>
              <div className="flex items-end">
                <Button type="button" variant="danger" size="sm" onClick={() => remove(index)}>
                  Entfernen
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Speichert…" : "Profil speichern"}
        </Button>
        {gespeichert && <span className="text-sm text-emerald-400">Gespeichert.</span>}
      </div>
    </form>
  );
}

/** Sammelt alle react-hook-form-Fehlermeldungen (auch verschachtelte Array-Felder) in einer flachen Liste. */
function flattenErrors(errors: Record<string, unknown>): string[] {
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
