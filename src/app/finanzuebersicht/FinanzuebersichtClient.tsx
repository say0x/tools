"use client";

// Referenz (Cashflow-only-Philosophie, Besitzstatus-System): docs/tools/finanzuebersicht-und-szenarien.md

import Link from "next/link";
import dynamic from "next/dynamic";
import { useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { BesitzstatusBadge } from "@/components/ui/Badge";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatEuro } from "@/lib/format";
import { SPARPOSITION_ART_LABELS } from "@/lib/labels";
import { flattenFormErrors } from "@/lib/form-errors";
import {
  BESITZSTAENDE,
  BESITZSTATUS_HILFE,
  BESITZSTATUS_LABELS,
  BESITZSTATUS_ZAEHLT_IM_VERMOEGEN,
  type Besitzstatus,
} from "@/lib/asset";
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
import { setAssetBesitzstatus } from "@/server/actions/asset";
import type { ImmobilienPosition } from "@/server/data/vermoegen";

export type { ImmobilienPosition } from "@/server/data/vermoegen";

const FinanzuebersichtChart = dynamic(
  () => import("@/components/charts/FinanzuebersichtChart").then((m) => m.FinanzuebersichtChart),
  { ssr: false, loading: () => <Skeleton className="h-[280px] w-full" /> }
);
const VergleichVermoegensChart = dynamic(
  () => import("@/components/charts/VergleichVermoegensChart").then((m) => m.VergleichVermoegensChart),
  { ssr: false, loading: () => <Skeleton className="h-[260px] w-full" /> }
);

function leereSparposition(sparplanSteigerungVorschlag: number) {
  return {
    art: "WERTPAPIERDEPOT" as const,
    name: "",
    besitzstatus: BESITZSTATUS_ZAEHLT_IM_VERMOEGEN,
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
  const [immobilienStatus, setImmobilienStatus] = useState<Record<string, Besitzstatus>>(() =>
    Object.fromEntries(immobilien.map((imm) => [imm.id, imm.besitzstatus]))
  );
  const [offeneImmobilien, setOffeneImmobilien] = useState<Record<string, boolean>>({});

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
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

  const aendereImmobilienStatus = (imm: ImmobilienPosition, status: Besitzstatus) => {
    const vorherigerStatus = immobilienStatus[imm.id] ?? imm.besitzstatus;
    setImmobilienStatus((prev) => ({ ...prev, [imm.id]: status }));
    setServerFehler(null);
    startTransition(async () => {
      try {
        await setAssetBesitzstatus(imm.assetId, status);
      } catch (err) {
        // Optimistisches Update zurücknehmen — sonst zeigt die UI einen Status, der nie
        // gespeichert wurde, bis ein Reload den echten (unveränderten) Serverwert nachlädt.
        setImmobilienStatus((prev) => ({ ...prev, [imm.id]: vorherigerStatus }));
        setServerFehler(
          `Status von "${imm.name}" konnte nicht geändert werden: ${err instanceof Error ? err.message : "unbekannter Fehler"}. Bitte erneut versuchen.`
        );
      }
    });
  };

  const { positionen, portfolioverlauf } = useMemo(() => {
    const sparpositionenWatched = watched.sparpositionen ?? [];

    const wertpapierPositionen: PortfolioPositionVerlauf[] = sparpositionenWatched
      .filter((p) => p?.besitzstatus === BESITZSTATUS_ZAEHLT_IM_VERMOEGEN)
      .map((p, i) => ({
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
      .filter((imm) => immobilienStatus[imm.id] === BESITZSTATUS_ZAEHLT_IM_VERMOEGEN)
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
  }, [watched.sparpositionen, fields, immobilien, immobilienStatus, horizontEffektiv, inflationProzentJaehrlich, startjahr]);

  const heute = portfolioverlauf[0];
  const amEnde = portfolioverlauf[portfolioverlauf.length - 1];
  const ausgewaehlteAnzahl = immobilien.filter((imm) => immobilienStatus[imm.id] === BESITZSTATUS_ZAEHLT_IM_VERMOEGEN).length;

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

  const fehlerListe = flattenFormErrors(errors);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Finanzübersicht</h1>
        <p className="mt-1 text-slate-400">
          Wie viel Geld hast du in wie vielen Jahren tatsächlich zur Verfügung — Wertpapiere, Tagesgeld und der
          Cashflow deiner Immobilien mit Status „Besitze ich&quot;. Immobilienwerte selbst sind nur eine Referenz und
          zählen nicht mit, da das Geld im Objekt steckt und nicht verfügbar ist.
        </p>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-6">
        {(serverFehler || fehlerListe.length > 0) && (
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
              hint='Wird NICHT automatisch verrechnet — nur ein Vorschlagswert, der beim Klick auf "+ Position hinzufügen" in die Sparplan-Steigerung der neuen Position übernommen wird.'
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
          <p className="mb-4 text-xs text-slate-400">
            {ausgewaehlteAnzahl} von {immobilien.length} Objekt(en) mit Status „Besitze ich&quot;. Nur diese zählen mit
            ihrem Cashflow nach Steuer in die Finanzübersicht — der Immobilienwert selbst ist nur eine Referenz.
          </p>
          {immobilien.length === 0 ? (
            <p className="text-sm text-slate-400">
              Noch keine Immobilien erfasst. <Link href="/immobilien/objekte/neu" className="text-blue-400 hover:underline">Jetzt anlegen</Link>.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {immobilien.map((imm) => {
                const cashflowJaehrlich = aktuellerJahresCashflow(imm);
                const status = immobilienStatus[imm.id] ?? imm.besitzstatus;
                const offen = !!offeneImmobilien[imm.id];
                return (
                  <div
                    key={imm.id}
                    className={`flex flex-col gap-2 rounded-md border px-4 py-3 ${
                      status === BESITZSTATUS_ZAEHLT_IM_VERMOEGEN ? "border-slate-700 bg-slate-950/40" : "border-slate-800 opacity-80"
                    }`}
                  >
                    {/* Bewusst kein <details>/<summary> mehr: der Objekt-Link stand vorher innerhalb von
                        <summary>, was axe-core als "nested-interactive" meldet (ein interaktives Element
                        — der Link — innerhalb eines anderen — summary — verwirrt Screenreader/Tastatur-Fokus).
                        Link und Toggle-Button stehen jetzt als Geschwister nebeneinander. */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <Link href={`/immobilien/objekte/${imm.id}`} className="font-medium text-slate-100 hover:underline">
                          {imm.name}
                        </Link>
                        <div className="text-xs text-slate-400">
                          {imm.jahreSeitKauf < 0
                            ? `Kauf geplant in ${Math.abs(imm.jahreSeitKauf)} Jahr(en)`
                            : imm.jahreSeitKauf === 0
                              ? "Kauf in diesem Jahr"
                              : `Seit ${imm.jahreSeitKauf} Jahr(en) im Portfolio`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOffeneImmobilien((prev) => ({ ...prev, [imm.id]: !prev[imm.id] }))}
                        aria-expanded={offen}
                        className="flex items-center gap-3 text-sm"
                      >
                        <BesitzstatusBadge status={status} />
                        <div className="text-left sm:text-right">
                          Cashflow n. Steuer:{" "}
                          <span className="font-medium text-slate-100">
                            {cashflowJaehrlich === null ? "—" : `${formatEuro(cashflowJaehrlich / 12)}/Monat`}
                          </span>
                        </div>
                        <svg
                          viewBox="0 0 24 24"
                          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${offen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    {offen && (
                      <>
                        <div className="flex flex-wrap items-center gap-3 border-t border-slate-800 pt-3">
                          <label className="flex items-center gap-2 text-sm text-slate-400">
                            Status ändern
                            <Select
                              value={status}
                              onChange={(e) => aendereImmobilienStatus(imm, e.target.value as Besitzstatus)}
                              className="w-auto"
                            >
                              {BESITZSTAENDE.map((s) => (
                                <option key={s} value={s}>
                                  {BESITZSTATUS_LABELS[s]}
                                </option>
                              ))}
                            </Select>
                            <InfoTooltip text={BESITZSTATUS_HILFE[status]} />
                          </label>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-800 pt-3 text-sm sm:grid-cols-4">
                          <DetailStat label="Kaufpreis" value={formatEuro(imm.kaufpreis)} />
                          <DetailStat label="Marktwert heute (Referenz)" value={formatEuro(imm.immobilienwertHeuteReferenz)} />
                          <DetailStat label="EK-Anteil heute (Referenz)" value={formatEuro(imm.eigenkapitalanteilHeuteReferenz)} />
                          <DetailStat
                            label="Cashflow n. Steuer/Jahr"
                            value={cashflowJaehrlich === null ? "—" : formatEuro(cashflowJaehrlich)}
                          />
                        </div>
                        <p className="text-xs text-slate-400">
                          Kaufpreis, Marktwert und EK-Anteil sind reine Referenzwerte — sie stecken im Objekt und zählen
                          nicht in die Finanzübersicht-Summe. Nur der Cashflow nach Steuer fließt ein, und nur bei Status
                          „Besitze ich&quot;.
                        </p>
                      </>
                    )}
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
          <p className="mb-4 text-xs text-slate-400">
            Jede Position verzinst sich automatisch jährlich mit ihrer eigenen Rendite/Zins (Zinseszins) — plus dem
            optionalen Sparplan, der ebenfalls automatisch jedes Jahr mit der hinterlegten Steigerung wächst. Nur
            Positionen mit Status „Besitze ich&quot; zählen in die Finanzübersicht-Summe.
          </p>

          {fields.length === 0 && (
            <p className="text-sm text-slate-400">
              Noch keine Position erfasst — z. B. ein Aktien-/ETF-Depot oder ein Tagesgeldkonto.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-col gap-3 rounded-md border border-slate-800 p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto]">
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
                <Field label="Status">
                  <Select {...register(`sparpositionen.${index}.besitzstatus` as const)} className="max-w-xs">
                    {BESITZSTAENDE.map((status) => (
                      <option key={status} value={status}>
                        {BESITZSTATUS_LABELS[status]}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Speichert…" : "Finanzübersicht speichern"}
          </Button>
          {gespeichert && <span className="text-sm text-emerald-400">Gespeichert.</span>}
          {!gespeichert && isDirty && !isPending && (
            <span className="text-sm text-amber-400">Ungespeicherte Änderungen</span>
          )}
        </div>
      </form>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CardTitle className="mb-0">Verfügbares Geld</CardTitle>
            <Link href="/szenarien" className="text-sm text-blue-400 hover:underline">
              Als Szenario weiterplanen →
            </Link>
          </div>
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
          <p className="text-sm text-slate-400">
            Noch keine Positionen mit Status „Besitze ich&quot; — Wertpapiere/Tagesgeld hinzufügen oder eine Immobilie oben
            entsprechend markieren, um den Verlauf zu sehen.
          </p>
        ) : (
          <FinanzuebersichtChart data={portfolioverlauf} />
        )}
      </Card>

      {positionen.length > 1 && (
        <Card>
          <CardTitle>Positionen im Vergleich (nominal)</CardTitle>
          <p className="mb-4 text-xs text-slate-400">
            Bei Immobilien: akkumulierter Cashflow nach Steuer ab heute — nicht der Immobilienwert.
          </p>
          <VergleichVermoegensChart
            ariaLabel="Liniendiagramm: akkumulierter Cashflow bzw. Kapitalverlauf je Position im Vergleich über die Jahre"
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
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-lg font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="font-medium text-slate-200">{value}</div>
    </div>
  );
}
