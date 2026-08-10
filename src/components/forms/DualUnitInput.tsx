"use client";

import { type Control, type FieldValues, type Path, useController } from "react-hook-form";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { euroZuProM2, proM2ZuEuro } from "@/hooks/useDualUnit";

export function DualUnitInput<T extends FieldValues>({
  control,
  name,
  label,
  wohnflaeche,
  unit = "€/Monat",
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
  wohnflaeche: number;
  unit?: string;
}) {
  const { field } = useController({ control, name });
  const absolut = Number(field.value) || 0;
  const proM2 = euroZuProM2(absolut, wohnflaeche);

  return (
    <Field label={label}>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <Input
            type="number"
            step="any"
            value={absolut}
            onChange={(e) => field.onChange(e.target.value === "" ? 0 : Number(e.target.value))}
            onBlur={field.onBlur}
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            {unit}
          </span>
        </div>
        <div className="relative">
          <Input
            type="number"
            step="any"
            value={proM2}
            onChange={(e) => field.onChange(proM2ZuEuro(e.target.value === "" ? 0 : Number(e.target.value), wohnflaeche))}
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            €/m²
          </span>
        </div>
      </div>
    </Field>
  );
}
