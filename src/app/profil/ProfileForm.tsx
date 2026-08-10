"use client";

import { useMemo, useState, useTransition } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { OverridableField } from "@/components/forms/OverridableField";
import { berechneGrenzsteuersatz } from "@/server/calc/tax/grenzsteuersatz";
import { schaetzeZvEAusBrutto } from "@/server/calc/tax/zve-schaetzung";
import { formatEuro } from "@/lib/format";
import { FIELD_HILFE } from "@/lib/field-hilfe";
import { type ProfileFormValues, upsertProfile } from "@/server/actions/profile";

export function ProfileForm({ initialValues }: { initialValues: ProfileFormValues }) {
  const [isPending, startTransition] = useTransition();
  const [gespeichert, setGespeichert] = useState(false);

  const { register, control, handleSubmit, watch, setValue } = useForm<ProfileFormValues>({
    defaultValues: initialValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: "liabilities" });

  const brutto = watch("bruttoEinkommenMonatlich");
  const zvE = watch("zuVersteuerndesEinkommenJaehrlich");
  const netto = watch("nettoEinkommenMonatlich");
  const fixkosten = watch("fixkostenMonatlich");

  const zvESchaetzung = useMemo(() => schaetzeZvEAusBrutto((Number(brutto) || 0) * 12), [brutto]);
  const grenzsteuersatz = useMemo(() => berechneGrenzsteuersatz(Number(zvE) || 0, new Date().getFullYear()), [zvE]);
  const verfuegbaresBudget = (Number(netto) || 0) - (Number(fixkosten) || 0);

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      await upsertProfile(values);
      setGespeichert(true);
      setTimeout(() => setGespeichert(false), 2500);
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
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
          >
            <Input type="number" step="any" {...register("bruttoEinkommenMonatlich")} />
          </Field>
          <Field
            label={
              <>
                Netto-Einkommen (€/Monat) <InfoTooltip text={FIELD_HILFE.nettoEinkommen} />
              </>
            }
          >
            <Input type="number" step="any" {...register("nettoEinkommenMonatlich")} />
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
          >
            <Input type="number" step="any" {...register("fixkostenMonatlich")} />
          </Field>
          <Field label="Vorhandenes Eigenkapital (€)">
            <Input type="number" step="any" {...register("vorhandenesEigenkapital")} />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap gap-6 rounded-md bg-slate-950/60 p-4">
          <div>
            <div className="text-xs text-slate-500">Grenzsteuersatz (live)</div>
            <div className="text-lg font-semibold text-slate-100">{grenzsteuersatz.toFixed(2)} %</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Verfügbares Budget (€/Monat)</div>
            <div className="text-lg font-semibold text-slate-100">{verfuegbaresBudget.toFixed(2)} €</div>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Affordability-Schwellen</CardTitle>
        <p className="mb-4 text-sm text-slate-400">
          Diese Werte steuern die Ampel bei jeder Objekt-Berechnung ("kann ich mir das leisten?").
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label={
              <>
                Max. Schuldendienstquote (%) <InfoTooltip text={FIELD_HILFE.maxSchuldendienstquote} />
              </>
            }
          >
            <Input type="number" step="any" {...register("maxSchuldendienstquoteProzent")} />
          </Field>
          <Field
            label={
              <>
                Mindest-Liquiditätsreserve (€) <InfoTooltip text={FIELD_HILFE.mindestLiquiditaetsreserve} />
              </>
            }
          >
            <Input type="number" step="any" {...register("mindestLiquiditaetsreserveEuro")} />
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
              <Field label="Bezeichnung">
                <Input {...register(`liabilities.${index}.bezeichnung` as const)} />
              </Field>
              <Field label="Rate (€/Monat)">
                <Input type="number" step="any" {...register(`liabilities.${index}.monatlicheRate` as const)} />
              </Field>
              <Field label="Restschuld (€)">
                <Input type="number" step="any" {...register(`liabilities.${index}.restschuld` as const)} />
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
