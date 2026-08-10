"use client";

import { useEffect, type ReactNode } from "react";
import { type Control, type FieldValues, type Path, type UseFormRegister, type UseFormSetValue, useWatch } from "react-hook-form";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";

/**
 * Ein Wert im "computed-with-override"-Muster: solange der Override-Schalter
 * aus ist, zeigt das Feld den live berechneten Vorschlag (deaktiviert) und
 * hält ihn synchron im Formular-State. Ist der Schalter an, wird das Feld
 * editierbar und der manuelle Wert gilt.
 */
export function OverridableField<T extends FieldValues>({
  label,
  control,
  register,
  valueField,
  overrideField,
  computedValue,
  setValue,
  step = "any",
}: {
  label: ReactNode;
  control: Control<T>;
  register: UseFormRegister<T>;
  valueField: Path<T>;
  overrideField: Path<T>;
  computedValue: number;
  setValue: UseFormSetValue<T>;
  step?: string;
}) {
  const override = useWatch({ control, name: overrideField }) as unknown as boolean;

  useEffect(() => {
    if (!override) {
      setValue(valueField, computedValue as never, { shouldDirty: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [override, computedValue]);

  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <Input type="number" step={step} disabled={!override} {...register(valueField, { valueAsNumber: true })} />
        <label className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
          <Switch {...register(overrideField)} />
          manuell
        </label>
      </div>
    </Field>
  );
}
