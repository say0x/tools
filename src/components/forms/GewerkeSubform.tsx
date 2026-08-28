import { useFieldArray, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import {
  EIGENTUMSTYPEN,
  GEWERKE,
  VERGLASUNGSARTEN,
  type CalculationResult,
  type ReferenceDataSnapshot,
} from "@/server/calc/types";
import type { PropertyFormValues } from "@/server/actions/property";
import { EIGENTUMSTYP_LABELS, GEWERK_LABELS, VERGLASUNG_LABELS, ZUSTAND_LABELS } from "@/lib/labels";
import { GEWERK_ZUSTAND_BESCHREIBUNG } from "@/lib/gewerk-zustand-beschreibungen";
import { formatEuro } from "@/lib/format";
import { FIELD_HILFE } from "@/lib/field-hilfe";
import { ZUSTANDSFAKTOR } from "@/server/calc/constants";

export function GewerkeSubform({
  register,
  fieldArray,
  result,
  referenceData,
  wohnflaeche,
  watched,
  errors,
}: {
  register: UseFormRegister<PropertyFormValues>;
  fieldArray: ReturnType<typeof useFieldArray<PropertyFormValues, "gewerke">>;
  result: CalculationResult | null;
  referenceData: ReferenceDataSnapshot;
  wohnflaeche: number;
  watched: { gewerke?: { gewerk?: string; zustand?: number }[]; gebaeudeWohnflaecheGesamt?: number | null };
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
            sofortSanieren: true,
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
          <div key={field.id} className="grid grid-cols-1 gap-3 rounded-md border border-slate-800 p-3 sm:grid-cols-[1.2fr_1fr_1.2fr_1fr_1fr_1fr_auto]">
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
            <Field
              label={
                <>
                  Sofort sanieren <InfoTooltip text={FIELD_HILFE.gewerkSofortSanieren} />
                </>
              }
            >
              <div className="flex h-[38px] items-center">
                <Switch bare {...register(`gewerke.${index}.sofortSanieren` as const)} />
              </div>
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
              className="sm:col-span-7"
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
                      const istGemeinschaftseigentumMitAnteil =
                        posten.eigentumsTyp === "GEMEINSCHAFTSEIGENTUM" && watched.gebaeudeWohnflaecheGesamt;
                      const flaechenBasis = istGemeinschaftseigentumMitAnteil ? watched.gebaeudeWohnflaecheGesamt : wohnflaeche;
                      const anteilTeil = istGemeinschaftseigentumMitAnteil
                        ? ` × ${result?.gewerke.miteigentumsanteilProzentEffektiv ?? 100}% Miteigentumsanteil`
                        : "";
                      return `(${kosten.min}+${kosten.max})/2=${mittelwert}€/m² × ${flaechenBasis}m² (${istGemeinschaftseigentumMitAnteil ? "Gesamtwohnfläche Gebäude" : "Wohnfläche"}) × ${faktor * 100}% Zustand${verglasungTeil}${anteilTeil} = ${formatEuro(posten.geschaetzteKostenEuro)}${alterTeil}`;
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
        <div className="text-sm text-slate-400">
          <p>
            Summe Sanierung: <span className="text-slate-200">{formatEuro(result.gewerke.summeGesamtEuro)}</span> · Risiko-Score:{" "}
            <span className="text-slate-200">{result.gewerke.risikoScore.toFixed(1)}</span>
          </p>
          <p className="mt-1">
            Davon sofort fällig (Sofortinvestition): <span className="text-slate-200">{formatEuro(result.gewerke.summeSofortEuro)}</span>
            {result.gewerke.summeSpaeterEuro > 0 && (
              <>
                {" "}
                · für später eingeplant: <span className="text-slate-200">{formatEuro(result.gewerke.summeSpaeterEuro)}</span>{" "}
                <span className="text-slate-500">(nicht in der Sofortinvestition enthalten, über die Instandhaltungsrücklage vorgesehen)</span>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
