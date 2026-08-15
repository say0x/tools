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
import { Switch } from "@/components/ui/Switch";
import { FinanzuebersichtChart } from "@/components/charts/FinanzuebersichtChart";
import { VergleichVermoegensChart } from "@/components/charts/VergleichVermoegensChart";
import { formatEuro } from "@/lib/format";
import { SPARPOSITION_ART_LABELS } from "@/lib/labels";
import { BETRACHTUNGSZEITRAUM_PRESETS } from "@/server/calc/constants";
import {
  berechneImmobilienCashflowverlauf,
  berechnePortfolioverlauf,
  berechneSparpositionsverlauf,
  type PortfolioPositionVerlauf,
} from "@/server/calc/rendite/portfolioverlauf";
import {
  speichereFinanzuebersicht,
  type FinanzuebersichtFormValues,
} from "@/server/actions/finanzuebersicht";
import { finanzuebersichtSchema, SPARPOSITION_ARTEN } from "@/server/actions/finanzuebersicht-schema";
import { setImmobilieInFinanzuebersicht } from "@/server/actions/property";

export interface ImmobilienPosition {
  id: string;
  name: string;
  inFinanzuebersicht: boolean;
  /** Jahre seit Kauf, ab heute — negativ bei einem geplanten (zukünftigen) Kauf. */
  jahreSeitKauf: number;
  eigenkapitalEinsatzBeiKauf: number;
  cashflowNachSteuerProJahrSeitKauf: number[];
  /** Reiner Referenzwert (heutiger Eigenkapitalanteil) — fließt NICHT in die Summe ein. */
  eigenkapitalanteilHeuteReferenz: number;
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

function aktuellerJahresCashflow(imm: ImmobilienPosition): number | null {
  if (imm.jahreSeitKauf < 0) return null;
  const index = Math.min(Math.max(imm.jahreSeitKauf, 1), imm.cashflowNachSteuerProJahrSeitKauf.length) - 1;
  return imm.cashflowNachSteuerProJahrSeitKauf[index] ?? null;
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
  const [ausgewaehlt, setAusgewaehlt] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(immobilien.map((imm) => [imm.id, imm.inFinanzuebersicht]))
  );

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

  const toggleImmobilie = (id: string, value: boolean) => {
    setAusgewaehlt((prev) => ({ ...prev, [id]: value }));
    startTransition(async () => {
      await setImmobilieInFinanzuebersicht(id, value);
    });
  };

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

    const immobilienPositionen: PortfolioPositionVerlauf[] = immobilien
      .filter((imm) => ausgewaehlt[imm.id])
      .map((imm) => ({
        id: imm.id,
        name: imm.name,
        verlauf: berechneImmobilienCashflowverlauf(
          {
            cashflowNachSteuerProJahrSeitKauf: imm.cashflowNachSteuerProJahrSeitKauf,
            jahreSeitKauf: imm.jahreSeitKauf,
            eigenkapitalEinsatzBeiKauf: imm.eigenkapitalEinsatzBeiKauf,
          },
          horizontEffektiv
        ),
      }));

    const alle = [...immobilienPositionen, ...wertpapierPositionen];

    return {
      positionen: alle,
      portfolioverlauf: berechnePortfolioverlauf(alle, horizontEffektiv, inflationProzentJaehrlich, startjahr),
    };
  }, [watched.sparpositionen, fields, immobilien, ausgewaehlt, horizontEffektiv, inflationProzentJaehrlich, startjahr]);

  const heute = portfolioverlauf[0];
  const amEnde = portfolioverlauf[portfolioverlauf.length - 1];
  const ausgewaehlteAnzahl = immobilien.filter((imm) => ausgewaehlt[imm.id]).length;

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
          Wie viel Geld hast du in wie vielen Jahren tatsächlich zur Verfügung — Wertpapiere, Tagesgeld und der
          Cashflow deiner ausgewählten Immobilien. Immobilienwerte selbst sind nur eine Referenz und zählen nicht mit,
          da das Geld im Objekt steckt und nicht verfügbar ist.
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
          <div className="mb-1 flex items-center justify-between">
            <CardTitle className="mb-0">Immobilien</CardTitle>
            <Link href="/immobilien/objekte" className="text-sm text-blue-400 hover:underline">
              Objekte verwalten →
            </Link>
          </div>
          <p className="mb-4 text-xs text-slate-500">
            {ausgewaehlteAnzahl} von {immobilien.length} Objekt(en) ausgewählt. Nur ausgewählte Objekte zählen mit
            ihrem Cashflow nach Steuer in die Finanzübersicht — der Immobilienwert selbst ist nur eine Referenz.
          </p>
          {immobilien.length === 0 ? (
            <p className="text-sm text-slate-500">
              Noch keine Immobilien erfasst. <Link href="/immobilien/objekte/neu" className="text-blue-400 hover:underline">Jetzt anlegen</Link>.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {immobilien.map((imm) => {
                const cashflowJaehrlich = aktuellerJahresCashflow(imm);
                return (
                  <div
                    key={imm.id}
                    className={`flex flex-col gap-2 rounded-md border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                      ausgewaehlt[imm.id] ? "border-slate-700 bg-slate-950/40" : "border-slate-800 opacity-70"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Switch checked={!!ausgewaehlt[imm.id]} onChange={(e) => toggleImmobilie(imm.id, e.target.checked)} />
                      <div>
                        <Link href={`/immobilien/objekte/${imm.id}`} className="font-medium text-slate-100 hover:underline">
                          {imm.name}
                        </Link>
                        <div className="text-xs text-slate-500">
                          {imm.jahreSeitKauf < 0
                            ? `Kauf geplant in ${Math.abs(imm.jahreSeitKauf)} Jahr(en)`
                            : imm.jahreSeitKauf === 0
                              ? "Kauf in diesem Jahr"
                              : `Seit ${imm.jahreSeitKauf} Jahr(en) im Portfolio`}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-start gap-0.5 text-sm sm:items-end">
                      <div>
                        Cashflow n. Steuer:{" "}
                        <span className="font-medium text-slate-100">
                          {cashflowJaehrlich === null ? "—" : `${formatEuro(cashflowJaehrlich / 12)}/Monat`}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Referenz — EK-Anteil heute: {formatEuro(imm.eigenkapitalanteilHeuteReferenz)}
                      </div>
                    </div>
                  </div>
                );
              })}
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
          <CardTitle className="mb-0">Verfügbares Geld</CardTitle>
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
          <Stat label="Verfügbares Geld heute" value={formatEuro(heute?.gesamtNominal ?? 0)} />
          <Stat
            label={`Verfügbares Geld in ${horizontEffektiv} Jahren (nominal)`}
            value={formatEuro(amEnde?.gesamtNominal ?? 0)}
          />
          <Stat
            label={`Verfügbares Geld in ${horizontEffektiv} Jahren (real, heutige Kaufkraft)`}
            value={formatEuro(amEnde?.gesamtReal ?? 0)}
          />
        </div>

        {positionen.length === 0 ? (
          <p className="text-sm text-slate-500">
            Noch keine Positionen erfasst — Wertpapiere, Tagesgeld hinzufügen oder eine Immobilie oben auswählen, um
            den Verlauf zu sehen.
          </p>
        ) : (
          <FinanzuebersichtChart data={portfolioverlauf} />
        )}
      </Card>

      {positionen.length > 1 && (
        <Card>
          <CardTitle>Positionen im Vergleich (nominal)</CardTitle>
          <p className="mb-4 text-xs text-slate-500">
            Bei Immobilien: akkumulierter Cashflow nach Steuer ab heute — nicht der Immobilienwert.
          </p>
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
