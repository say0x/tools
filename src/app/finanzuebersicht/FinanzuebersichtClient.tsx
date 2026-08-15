"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { FinanzuebersichtChart } from "@/components/charts/FinanzuebersichtChart";
import { VergleichVermoegensChart } from "@/components/charts/VergleichVermoegensChart";
import { formatEuro } from "@/lib/format";
import { SPARPOSITION_ART_LABELS } from "@/lib/labels";
import { BETRACHTUNGSZEITRAUM_PRESETS } from "@/server/calc/constants";
import {
  berechneImmobilienEigenkapitalverlauf,
  berechnePortfolioverlauf,
  berechneSparpositionsverlauf,
  type PortfolioPositionVerlauf,
} from "@/server/calc/rendite/portfolioverlauf";
import {
  speichereFinanzuebersicht,
  type FinanzuebersichtFormValues,
} from "@/server/actions/finanzuebersicht";
import { finanzuebersichtSchema, SPARPOSITION_ARTEN } from "@/server/actions/finanzuebersicht-schema";

export interface ImmobilienPosition {
  id: string;
  name: string;
  jahreSeitKauf: number;
  eigenkapitalBeiKauf: number;
  eigenkapitalanteilProJahrSeitKauf: number[];
}

function leereSparposition(sparplanSteigerungVorschlag: number) {
  return {
    art: "WERTPAPIERDEPOT" as const,
    name: "",
    betrag: 0,
    renditeProzentJaehrlich: 7,
    sparplanBetragMonatlich: 0,
    sparplanSteigerungProzentJaehrlich: sparplanSteigerungVorschlag,
  };
}

export function FinanzuebersichtClient({
  immobilien,
  sparpositionenInitial,
  bruttoEinkommenMonatlichInitial,
  gehaltssteigerungProzentJaehrlichInitial,
  inflationProzentJaehrlichInitial,
  maxHorizontJahre,
  startjahr,
}: {
  immobilien: ImmobilienPosition[];
  sparpositionenInitial: FinanzuebersichtFormValues["sparpositionen"];
  bruttoEinkommenMonatlichInitial: number;
  gehaltssteigerungProzentJaehrlichInitial: number;
  inflationProzentJaehrlichInitial: number;
  maxHorizontJahre: number;
  startjahr: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [gespeichert, setGespeichert] = useState(false);
  const [serverFehler, setServerFehler] = useState<string | null>(null);
  const [horizontJahre, setHorizontJahre] = useState(30);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FinanzuebersichtFormValues>({
    defaultValues: {
      bruttoEinkommenMonatlich: bruttoEinkommenMonatlichInitial,
      gehaltssteigerungProzentJaehrlich: gehaltssteigerungProzentJaehrlichInitial,
      inflationProzentJaehrlich: inflationProzentJaehrlichInitial,
      sparpositionen: sparpositionenInitial,
    },
    resolver: zodResolver(finanzuebersichtSchema),
  });

  const { fields, append, remove } = useFieldArray({ control, name: "sparpositionen" });
  const watched = useWatch({ control });

  const gehaltssteigerungProzentJaehrlich = Number(watched.gehaltssteigerungProzentJaehrlich) || 0;
  const inflationProzentJaehrlich = Number(watched.inflationProzentJaehrlich) || 0;
  const bruttoEinkommenJaehrlich = (Number(watched.bruttoEinkommenMonatlich) || 0) * 12;

  const horizontEffektiv = Math.min(horizontJahre, maxHorizontJahre);
  const presets = BETRACHTUNGSZEITRAUM_PRESETS.filter((jahr) => jahr <= maxHorizontJahre);

  const { positionen, portfolioverlauf } = useMemo(() => {
    const sparpositionenWatched = watched.sparpositionen ?? [];

    const wertpapierPositionen: PortfolioPositionVerlauf[] = sparpositionenWatched.map((p, i) => ({
      id: fields[i]?.id ?? `position-${i}`,
      name: p?.name?.trim() || SPARPOSITION_ART_LABELS[p?.art ?? "WERTPAPIERDEPOT"],
      verlauf: berechneSparpositionsverlauf(
        {
          betrag: Number(p?.betrag) || 0,
          renditeProzentJaehrlich: Number(p?.renditeProzentJaehrlich) || 0,
          sparplanBetragMonatlich: Number(p?.sparplanBetragMonatlich) || 0,
          sparplanSteigerungProzentJaehrlich: Number(p?.sparplanSteigerungProzentJaehrlich) || 0,
        },
        horizontEffektiv
      ),
    }));

    const immobilienPositionen: PortfolioPositionVerlauf[] = immobilien.map((imm) => ({
      id: imm.id,
      name: imm.name,
      verlauf: berechneImmobilienEigenkapitalverlauf(
        imm.eigenkapitalanteilProJahrSeitKauf,
        imm.jahreSeitKauf,
        imm.eigenkapitalBeiKauf,
        horizontEffektiv
      ),
    }));

    const alle = [...immobilienPositionen, ...wertpapierPositionen];

    return {
      positionen: alle,
      portfolioverlauf: berechnePortfolioverlauf(alle, horizontEffektiv, inflationProzentJaehrlich, startjahr),
    };
  }, [watched.sparpositionen, fields, immobilien, horizontEffektiv, inflationProzentJaehrlich, startjahr]);

  const heute = portfolioverlauf[0];
  const amEnde = portfolioverlauf[portfolioverlauf.length - 1];

  const submit = handleSubmit((values) => {
    setServerFehler(null);
    startTransition(async () => {
      try {
        await speichereFinanzuebersicht(values);
        setGespeichert(true);
        setTimeout(() => setGespeichert(false), 2500);
      } catch (err) {
        setServerFehler(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
      }
    });
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Finanzübersicht</h1>
        <p className="mt-1 text-slate-400">
          Aggregierte Sicht über Immobilien, Wertpapiere und Tagesgeld — wie viel Vermögen ist in wie vielen Jahren
          erreichbar?
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-6">
        {(serverFehler || Object.keys(errors).length > 0) && (
          <Card className="border-red-900/50 bg-red-950/20">
            <p className="text-sm font-medium text-red-400">Bitte folgende Angaben korrigieren:</p>
            {serverFehler && <p className="mt-2 text-sm text-red-300">{serverFehler}</p>}
          </Card>
        )}

        <Card>
          <CardTitle>Gehalt &amp; Annahmen</CardTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Brutto-Einkommen (€/Monat)"
              hint={`≈ ${formatEuro(bruttoEinkommenJaehrlich)} pro Jahr`}
              error={errors.bruttoEinkommenMonatlich?.message}
            >
              <Input type="number" step="any" min={0} {...register("bruttoEinkommenMonatlich", { valueAsNumber: true })} />
            </Field>
            <Field
              label="Gehaltssteigerung (%/Jahr)"
              hint="Rein informativ — Vorschlagswert für die Sparplan-Steigerung neuer Positionen."
              error={errors.gehaltssteigerungProzentJaehrlich?.message}
            >
              <Input type="number" step="any" min={0} {...register("gehaltssteigerungProzentJaehrlich", { valueAsNumber: true })} />
            </Field>
            <Field
              label="Inflation (%/Jahr)"
              hint="Bestimmt die inflationsbereinigte (reale) Linie im Chart."
              error={errors.inflationProzentJaehrlich?.message}
            >
              <Input type="number" step="any" min={0} {...register("inflationProzentJaehrlich", { valueAsNumber: true })} />
            </Field>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle className="mb-0">Immobilien im Portfolio</CardTitle>
            <Link href="/immobilien/objekte" className="text-sm text-blue-400 hover:underline">
              Objekte verwalten →
            </Link>
          </div>
          {immobilien.length === 0 ? (
            <p className="text-sm text-slate-500">
              Noch keine Immobilien erfasst. <Link href="/immobilien/objekte/neu" className="text-blue-400 hover:underline">Jetzt anlegen</Link>.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {immobilien.map((imm) => (
                <div
                  key={imm.id}
                  className="flex flex-col gap-1 rounded-md border border-slate-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link href={`/immobilien/objekte/${imm.id}`} className="font-medium text-slate-100 hover:underline">
                      {imm.name}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {imm.jahreSeitKauf === 0 ? "Kauf in diesem Jahr" : `Seit ${imm.jahreSeitKauf} Jahr(en) im Portfolio`}
                    </div>
                  </div>
                  <div className="text-sm text-slate-300">
                    Heutiger EK-Anteil: <span className="font-medium text-slate-100">{formatEuro(imm.eigenkapitalanteilProJahrSeitKauf[Math.max(0, imm.jahreSeitKauf - 1)] ?? imm.eigenkapitalBeiKauf)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle className="mb-0">Wertpapiere &amp; Tagesgeld</CardTitle>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => append(leereSparposition(gehaltssteigerungProzentJaehrlich))}
            >
              + Position hinzufügen
            </Button>
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-slate-500">
              Noch keine Position erfasst — z. B. ein Aktien-/ETF-Depot oder ein Tagesgeldkonto.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 gap-3 rounded-md border border-slate-800 p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto]"
              >
                <Field label="Art">
                  <Select {...register(`sparpositionen.${index}.art` as const)}>
                    {SPARPOSITION_ARTEN.map((art) => (
                      <option key={art} value={art}>
                        {SPARPOSITION_ART_LABELS[art]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Bezeichnung" error={errors.sparpositionen?.[index]?.name?.message}>
                  <Input {...register(`sparpositionen.${index}.name` as const)} placeholder="z. B. ETF-Weltportfolio" />
                </Field>
                <Field label="Betrag heute (€)" error={errors.sparpositionen?.[index]?.betrag?.message}>
                  <Input type="number" step="any" min={0} {...register(`sparpositionen.${index}.betrag` as const, { valueAsNumber: true })} />
                </Field>
                <Field label="Rendite/Zins (%/Jahr)" error={errors.sparpositionen?.[index]?.renditeProzentJaehrlich?.message}>
                  <Input type="number" step="any" {...register(`sparpositionen.${index}.renditeProzentJaehrlich` as const, { valueAsNumber: true })} />
                </Field>
                <Field label="Sparplan (€/Monat)" error={errors.sparpositionen?.[index]?.sparplanBetragMonatlich?.message}>
                  <Input type="number" step="any" min={0} {...register(`sparpositionen.${index}.sparplanBetragMonatlich` as const, { valueAsNumber: true })} />
                </Field>
                <Field
                  label="Sparplan-Steigerung (%/Jahr)"
                  error={errors.sparpositionen?.[index]?.sparplanSteigerungProzentJaehrlich?.message}
                >
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    {...register(`sparpositionen.${index}.sparplanSteigerungProzentJaehrlich` as const, { valueAsNumber: true })}
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
            {isPending ? "Speichert…" : "Finanzübersicht speichern"}
          </Button>
          {gespeichert && <span className="text-sm text-emerald-400">Gespeichert.</span>}
        </div>
      </form>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="mb-0">Vermögensverlauf</CardTitle>
          <Field label="Betrachtungszeitraum" className="w-40">
            <Select value={horizontJahre} onChange={(e) => setHorizontJahre(Number(e.target.value))}>
              {presets.map((jahr) => (
                <option key={jahr} value={jahr}>
                  {jahr} Jahre
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mb-4 flex flex-wrap gap-6 rounded-md bg-slate-950/60 p-4">
          <Stat label="Vermögen heute" value={formatEuro(heute?.gesamtNominal ?? 0)} />
          <Stat
            label={`Vermögen in ${horizontEffektiv} Jahren (nominal)`}
            value={formatEuro(amEnde?.gesamtNominal ?? 0)}
          />
          <Stat
            label={`Vermögen in ${horizontEffektiv} Jahren (real, heutige Kaufkraft)`}
            value={formatEuro(amEnde?.gesamtReal ?? 0)}
          />
        </div>

        {positionen.length === 0 ? (
          <p className="text-sm text-slate-500">
            Noch keine Positionen erfasst — Immobilien, Wertpapiere oder Tagesgeld hinzufügen, um den Vermögensverlauf
            zu sehen.
          </p>
        ) : (
          <FinanzuebersichtChart data={portfolioverlauf} />
        )}
      </Card>

      {positionen.length > 1 && (
        <Card>
          <CardTitle>Positionen im Vergleich (nominal)</CardTitle>
          <VergleichVermoegensChart
            objekte={positionen.map((p) => ({ id: p.id, name: p.name, eigenkapitalanteilProJahr: p.verlauf.slice(1) }))}
            jahre={horizontEffektiv}
          />
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-semibold text-slate-100">{value}</div>
    </div>
  );
}
