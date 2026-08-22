"use client";

import { useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useFieldArray, useForm, useWatch, type FieldPath } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatEuro } from "@/lib/format";
import { SZENARIO_AENDERUNG_TYP_HILFE, SZENARIO_AENDERUNG_TYP_LABELS } from "@/lib/labels";
import { leereSzenarioAenderung } from "@/lib/szenario-form-defaults";
import { BETRACHTUNGSZEITRAUM_PRESETS } from "@/server/calc/constants";
import {
  berechneEinmaligeAnschaffungVerlauf,
  berechneImmobilienCashflowverlauf,
  berechneImmobilienEigenkapitalverlauf,
  berechnePortfolioverlauf,
  berechneSparpositionsverlauf,
  wendeImmobilienverkaufAn,
  type PortfolioPositionVerlauf,
} from "@/server/calc/rendite/portfolioverlauf";
import type { SzenarioFormValues } from "@/server/actions/szenario";
import { szenarioSchema, SZENARIO_AENDERUNG_TYPEN } from "@/server/actions/szenario-schema";
import type { ImmobilienPosition, SparpositionPosition } from "@/server/data/vermoegen";

const SzenarioVergleichChart = dynamic(
  () => import("@/components/charts/SzenarioVergleichChart").then((m) => m.SzenarioVergleichChart),
  { ssr: false, loading: () => <Skeleton className="h-[260px] w-full" /> }
);

export function SzenarioClient({
  onSubmit,
  nameInitial,
  startjahrInitial,
  notizenInitial,
  aenderungenInitial,
  immobilien,
  sparpositionen,
  maxHorizontJahre,
  aktuellesJahr,
}: {
  onSubmit: (values: SzenarioFormValues) => Promise<void>;
  nameInitial: string;
  startjahrInitial: number;
  notizenInitial: string;
  aenderungenInitial: SzenarioFormValues["aenderungen"];
  immobilien: ImmobilienPosition[];
  sparpositionen: SparpositionPosition[];
  maxHorizontJahre: number;
  aktuellesJahr: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [gespeichert, setGespeichert] = useState(false);
  const [serverFehler, setServerFehler] = useState<string | null>(null);
  const [horizontJahre, setHorizontJahre] = useState(30);

  // Kein zodResolver hier bewusst: das Formular hält "jahrAbHeute" als
  // Kalenderjahr (UI-Feld "Jahr"), das Schema validiert aber das
  // Speicherformat (Jahre ab heute, siehe submit unten) — beide teilen sich
  // denselben Feldnamen mit unterschiedlicher Bedeutung, ein Resolver auf
  // den rohen Formularwerten würde also am falschen Wert validieren.
  // Validierung läuft stattdessen nach der Umrechnung, direkt vor dem Absenden.
  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<SzenarioFormValues>({
    defaultValues: { name: nameInitial, startjahr: startjahrInitial, notizen: notizenInitial, aenderungen: aenderungenInitial },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "aenderungen" });
  const watched = useWatch({ control });

  const horizontEffektiv = Math.min(horizontJahre, maxHorizontJahre);
  const presets = BETRACHTUNGSZEITRAUM_PRESETS.filter((jahr) => jahr <= maxHorizontJahre);

  const immobilienZumAufnehmen = immobilien.filter((imm) => imm.besitzstatus !== "BESITZE_ICH");
  const immobilienZumVerkaufen = immobilien.filter((imm) => imm.besitzstatus === "BESITZE_ICH");
  const sparpositionenBesessen = sparpositionen.filter((sp) => sp.besitzstatus === "BESITZE_ICH");

  const { verlaufOhneSzenario, verlaufMitSzenario, mehrfachBetroffeneNamen, immobilienwertVerlauf, immobilienImSzenarioAnzahl } = useMemo(() => {
    const startjahrWatched = Number(watched.startjahr) || aktuellesJahr;
    const aenderungenWatched = watched.aenderungen ?? [];

    const basis = new Map<string, PortfolioPositionVerlauf>();
    for (const imm of immobilien) {
      if (imm.besitzstatus !== "BESITZE_ICH") continue;
      basis.set(imm.assetId, {
        id: imm.assetId,
        name: imm.name,
        verlauf: berechneImmobilienCashflowverlauf(
          {
            cashflowNachSteuerProJahrSeitKauf: imm.cashflowNachSteuerProJahrSeitKauf,
            jahreSeitKauf: imm.jahreSeitKauf,
            eigenkapitalEinsatzBeiKauf: imm.eigenkapitalEinsatzBeiKauf,
          },
          horizontEffektiv
        ),
      });
    }
    for (const sp of sparpositionen) {
      if (sp.besitzstatus !== "BESITZE_ICH") continue;
      basis.set(sp.assetId, {
        id: sp.assetId,
        name: sp.name,
        verlauf: berechneSparpositionsverlauf(
          {
            betrag: sp.betrag,
            renditeProzentJaehrlich: sp.renditeProzentJaehrlich,
            sparplanBetragMonatlich: sp.sparplanBetragMonatlich,
            sparplanSteigerungProzentJaehrlich: sp.sparplanSteigerungProzentJaehrlich,
          },
          horizontEffektiv
        ),
      });
    }

    const mitSzenario = new Map(basis);
    const betroffeneIds: string[] = [];

    aenderungenWatched.forEach((a, index) => {
      if (!a) return;
      const rowId = fields[index]?.id ?? `aenderung-${index}`;

      if (a.typ === "IMMOBILIE_AUFNEHMEN" && a.assetId) {
        const imm = immobilien.find((i) => i.assetId === a.assetId);
        if (imm) {
          betroffeneIds.push(imm.assetId);
          mitSzenario.set(imm.assetId, {
            id: imm.assetId,
            name: `${imm.name} (Szenario)`,
            verlauf: berechneImmobilienCashflowverlauf(
              {
                cashflowNachSteuerProJahrSeitKauf: imm.cashflowNachSteuerProJahrSeitKauf,
                jahreSeitKauf: imm.jahreSeitKauf,
                eigenkapitalEinsatzBeiKauf: imm.eigenkapitalEinsatzBeiKauf,
              },
              horizontEffektiv
            ),
          });
        }
      } else if (a.typ === "IMMOBILIE_VERKAUFEN" && a.assetId && a.jahrAbHeute != null) {
        const imm = immobilien.find((i) => i.assetId === a.assetId);
        const bestehende = mitSzenario.get(a.assetId);
        if (imm && bestehende) {
          betroffeneIds.push(a.assetId);
          mitSzenario.set(a.assetId, {
            id: a.assetId,
            name: `${imm.name} (verkauft ${a.jahrAbHeute})`,
            verlauf: wendeImmobilienverkaufAn(bestehende.verlauf, a.jahrAbHeute - aktuellesJahr, imm.immobilienwertHeuteReferenz),
          });
        }
      } else if (a.typ === "SPARRATE_AENDERN" && a.assetId && a.neueSparrateMonatlich != null) {
        const sp = sparpositionen.find((s) => s.assetId === a.assetId);
        if (sp) {
          betroffeneIds.push(sp.assetId);
          mitSzenario.set(sp.assetId, {
            id: sp.assetId,
            name: `${sp.name} (angepasst)`,
            verlauf: berechneSparpositionsverlauf(
              {
                betrag: sp.betrag,
                renditeProzentJaehrlich: sp.renditeProzentJaehrlich,
                sparplanBetragMonatlich: sp.sparplanBetragMonatlich,
                sparplanSteigerungProzentJaehrlich: sp.sparplanSteigerungProzentJaehrlich,
              },
              horizontEffektiv,
              { abJahr: startjahrWatched - aktuellesJahr, neueSparrateMonatlich: a.neueSparrateMonatlich }
            ),
          });
        }
      } else if (a.typ === "EINMALIGE_ANSCHAFFUNG" && a.betrag != null && a.jahrAbHeute != null) {
        mitSzenario.set(rowId, {
          id: rowId,
          name: a.bezeichnung?.trim() || "Anschaffung",
          verlauf: berechneEinmaligeAnschaffungVerlauf({ betrag: a.betrag, jahrAbHeute: a.jahrAbHeute - aktuellesJahr }, horizontEffektiv),
        });
      }
    });

    const doppelt = betroffeneIds.filter((id, i) => betroffeneIds.indexOf(id) !== i);
    const mehrfachBetroffeneNamen = [...new Set(doppelt)]
      .map((id) => immobilien.find((i) => i.assetId === id)?.name ?? sparpositionen.find((s) => s.assetId === id)?.name)
      .filter((name): name is string => !!name);

    // Immobilienwert-Referenzverlauf (EK-Anteil, summiert über alle im "mit Szenario"-Zustand
    // vorhandenen Immobilien) — reine Zusatzinfo neben dem Cashflow-Vergleich oben, zeigt wie
    // viel Vermögen zusätzlich im Objekt selbst steckt (fließt NICHT in gesamtNominal ein,
    // exakt wie in der Finanzübersicht). Nach einem Verkauf im Szenario zählt der Wert des
    // verkauften Objekts nicht mehr mit (der Erlös steckt stattdessen schon im Cashflow oben).
    const verkaufsjahrNachAssetId = new Map<string, number>();
    aenderungenWatched.forEach((a) => {
      if (a?.typ === "IMMOBILIE_VERKAUFEN" && a.assetId && a.jahrAbHeute != null) {
        verkaufsjahrNachAssetId.set(a.assetId, a.jahrAbHeute - aktuellesJahr);
      }
    });
    const immobilienImSzenario = new Map<string, ImmobilienPosition>();
    for (const imm of immobilien) {
      if (imm.besitzstatus === "BESITZE_ICH") immobilienImSzenario.set(imm.assetId, imm);
    }
    aenderungenWatched.forEach((a) => {
      if (a?.typ === "IMMOBILIE_AUFNEHMEN" && a.assetId) {
        const imm = immobilien.find((i) => i.assetId === a.assetId);
        if (imm) immobilienImSzenario.set(imm.assetId, imm);
      }
    });
    const immobilienwertVerlauf = Array.from({ length: horizontEffektiv + 1 }, () => 0);
    for (const [assetId, imm] of immobilienImSzenario) {
      const ekVerlauf = berechneImmobilienEigenkapitalverlauf(
        imm.eigenkapitalanteilProJahrSeitKauf,
        imm.jahreSeitKauf,
        imm.eigenkapitalEinsatzBeiKauf,
        horizontEffektiv
      );
      const verkaufsjahr = verkaufsjahrNachAssetId.get(assetId);
      ekVerlauf.forEach((wert, i) => {
        if (verkaufsjahr != null && i >= verkaufsjahr) return;
        immobilienwertVerlauf[i] += wert;
      });
    }

    return {
      verlaufOhneSzenario: berechnePortfolioverlauf(Array.from(basis.values()), horizontEffektiv, 0, aktuellesJahr),
      verlaufMitSzenario: berechnePortfolioverlauf(Array.from(mitSzenario.values()), horizontEffektiv, 0, aktuellesJahr),
      mehrfachBetroffeneNamen,
      immobilienwertVerlauf,
      immobilienImSzenarioAnzahl: immobilienImSzenario.size,
    };
  }, [watched.aenderungen, watched.startjahr, fields, immobilien, sparpositionen, horizontEffektiv, aktuellesJahr]);

  const heuteOhne = verlaufOhneSzenario[0]?.gesamtNominal ?? 0;
  const amEndeOhne = verlaufOhneSzenario[verlaufOhneSzenario.length - 1]?.gesamtNominal ?? 0;
  const amEndeMit = verlaufMitSzenario[verlaufMitSzenario.length - 1]?.gesamtNominal ?? 0;
  const differenz = amEndeMit - amEndeOhne;

  const immobilienwertHeute = immobilienwertVerlauf[0] ?? 0;
  const immobilienwertAmEnde = immobilienwertVerlauf[immobilienwertVerlauf.length - 1] ?? 0;

  const submit = handleSubmit((values) => {
    setServerFehler(null);
    clearErrors();

    // Kalenderjahr (UI) -> Jahre ab heute (Speicherformat) — erst danach validieren,
    // da das Schema das Speicherformat prüft (siehe Kommentar bei useForm oben).
    const werte: SzenarioFormValues = {
      ...values,
      aenderungen: values.aenderungen.map((a) => ({
        ...a,
        jahrAbHeute: a.jahrAbHeute == null ? null : a.jahrAbHeute - aktuellesJahr,
      })),
    };

    const result = szenarioSchema.safeParse(werte);
    if (!result.success) {
      for (const issue of result.error.issues) {
        setError(issue.path.join(".") as FieldPath<SzenarioFormValues>, { type: "manual", message: issue.message });
      }
      setServerFehler("Bitte die markierten Angaben korrigieren.");
      return;
    }

    startTransition(async () => {
      try {
        await onSubmit(result.data);
        setGespeichert(true);
        setTimeout(() => setGespeichert(false), 2500);
      } catch (err) {
        setServerFehler(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
      }
    });
  });

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={submit} className="flex flex-col gap-6">
        {(serverFehler || Object.keys(errors).length > 0) && (
          <Card className="border-red-900/50 bg-red-950/20">
            <p className="text-sm font-medium text-red-400">Bitte folgende Angaben korrigieren:</p>
            {serverFehler && <p className="mt-2 text-sm text-red-300">{serverFehler}</p>}
          </Card>
        )}

        <Card>
          <CardTitle>Szenario</CardTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Name" className="sm:col-span-2" error={errors.name?.message}>
              <Input {...register("name")} />
            </Field>
            <Field
              label="Startjahr"
              hint="Gilt für Sparraten-Änderungen. Käufe/Verkäufe/Anschaffungen haben ihr eigenes Jahr."
              error={errors.startjahr?.message}
            >
              <Input type="number" {...register("startjahr", { valueAsNumber: true })} />
            </Field>
            <Field label="Notizen" className="sm:col-span-3" error={errors.notizen?.message}>
              <Textarea {...register("notizen")} rows={2} />
            </Field>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <CardTitle className="mb-0">Was soll passieren?</CardTitle>
            <Button type="button" variant="secondary" size="sm" onClick={() => append(leereSzenarioAenderung())}>
              + Änderung hinzufügen
            </Button>
          </div>

          {mehrfachBetroffeneNamen.length > 0 && (
            <p className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
              Mehrere Änderungen betreffen dasselbe Objekt ({mehrfachBetroffeneNamen.join(", ")}) — nur die letzte Änderung zählt.
            </p>
          )}

          {fields.length === 0 && (
            <p className="text-sm text-slate-500">
              Noch keine Änderung — z. B. „Immobilie kaufen“, „Sparrate erhöhen“ oder „Auto kaufen“.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => {
              const typ = watched.aenderungen?.[index]?.typ ?? "IMMOBILIE_AUFNEHMEN";
              return (
                <div key={field.id} className="rounded-md border border-slate-800 p-3">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="flex flex-1 items-center gap-2 text-sm text-slate-300">
                      <Select {...register(`aenderungen.${index}.typ` as const)} className="max-w-xs">
                        {SZENARIO_AENDERUNG_TYPEN.map((t) => (
                          <option key={t} value={t}>
                            {SZENARIO_AENDERUNG_TYP_LABELS[t]}
                          </option>
                        ))}
                      </Select>
                      <InfoTooltip text={SZENARIO_AENDERUNG_TYP_HILFE[typ]} />
                    </label>
                    <Button type="button" variant="danger" size="sm" onClick={() => remove(index)}>
                      Entfernen
                    </Button>
                  </div>

                  {typ === "IMMOBILIE_AUFNEHMEN" && (
                    <Field label="Immobilie" error={errors.aenderungen?.[index]?.assetId?.message}>
                      <Select {...register(`aenderungen.${index}.assetId` as const)}>
                        <option value="">— auswählen —</option>
                        {immobilienZumAufnehmen.map((imm) => (
                          <option key={imm.assetId} value={imm.assetId}>
                            {imm.name} ({formatEuro(imm.kaufpreis)})
                          </option>
                        ))}
                      </Select>
                      {immobilienZumAufnehmen.length === 0 && (
                        <p className="mt-1 text-xs text-slate-500">
                          Keine Immobilie mit Status „Potenzielle Anschaffung“ oder „Spekulation“ vorhanden.
                        </p>
                      )}
                    </Field>
                  )}

                  {typ === "IMMOBILIE_VERKAUFEN" && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Immobilie" error={errors.aenderungen?.[index]?.assetId?.message}>
                        <Select {...register(`aenderungen.${index}.assetId` as const)}>
                          <option value="">— auswählen —</option>
                          {immobilienZumVerkaufen.map((imm) => (
                            <option key={imm.assetId} value={imm.assetId}>
                              {imm.name}
                            </option>
                          ))}
                        </Select>
                        {immobilienZumVerkaufen.length === 0 && (
                          <p className="mt-1 text-xs text-slate-500">Keine Immobilie mit Status „Besitze ich“ vorhanden.</p>
                        )}
                      </Field>
                      <Field label="Verkaufsjahr" error={errors.aenderungen?.[index]?.jahrAbHeute?.message}>
                        <Input
                          type="number"
                          {...register(`aenderungen.${index}.jahrAbHeute` as const, { valueAsNumber: true })}
                        />
                      </Field>
                    </div>
                  )}

                  {typ === "SPARRATE_AENDERN" && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Position" error={errors.aenderungen?.[index]?.assetId?.message}>
                        <Select {...register(`aenderungen.${index}.assetId` as const)}>
                          <option value="">— auswählen —</option>
                          {sparpositionenBesessen.map((sp) => (
                            <option key={sp.assetId} value={sp.assetId}>
                              {sp.name} ({formatEuro(sp.sparplanBetragMonatlich)}/Monat aktuell)
                            </option>
                          ))}
                        </Select>
                        {sparpositionenBesessen.length === 0 && (
                          <p className="mt-1 text-xs text-slate-500">Keine Position mit Status „Besitze ich“ vorhanden.</p>
                        )}
                      </Field>
                      <Field label="Neue Sparrate (€/Monat)" error={errors.aenderungen?.[index]?.neueSparrateMonatlich?.message}>
                        <Input
                          type="number"
                          step="any"
                          min={0}
                          {...register(`aenderungen.${index}.neueSparrateMonatlich` as const, { valueAsNumber: true })}
                        />
                      </Field>
                    </div>
                  )}

                  {typ === "EINMALIGE_ANSCHAFFUNG" && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <Field label="Bezeichnung" error={errors.aenderungen?.[index]?.bezeichnung?.message}>
                        <Input {...register(`aenderungen.${index}.bezeichnung` as const)} placeholder="z. B. Auto" />
                      </Field>
                      <Field label="Betrag (€)" error={errors.aenderungen?.[index]?.betrag?.message}>
                        <Input type="number" step="any" min={0} {...register(`aenderungen.${index}.betrag` as const, { valueAsNumber: true })} />
                      </Field>
                      <Field label="Jahr" error={errors.aenderungen?.[index]?.jahrAbHeute?.message}>
                        <Input type="number" {...register(`aenderungen.${index}.jahrAbHeute` as const, { valueAsNumber: true })} />
                      </Field>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Speichert…" : "Szenario speichern"}
          </Button>
          {gespeichert && <span className="text-sm text-emerald-400">Gespeichert.</span>}
        </div>
      </form>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="mb-0">Auswirkung auf mein Vermögen</CardTitle>
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

        <div className="mb-4 grid grid-cols-2 gap-4 rounded-md bg-slate-950/60 p-4 sm:grid-cols-4">
          <Stat label="Heute" value={formatEuro(heuteOhne)} />
          <Stat label="Ohne Szenario" value={formatEuro(amEndeOhne)} />
          <Stat label="Mit Szenario" value={formatEuro(amEndeMit)} />
          <Stat label="Differenz" value={`${differenz >= 0 ? "+" : ""}${formatEuro(differenz)}`} accent={differenz >= 0 ? "positiv" : "negativ"} />
        </div>

        <SzenarioVergleichChart
          ohneSzenario={verlaufOhneSzenario}
          mitSzenario={verlaufMitSzenario}
          immobilienwertVerlauf={immobilienImSzenarioAnzahl > 0 ? immobilienwertVerlauf : undefined}
        />

        {immobilienImSzenarioAnzahl > 0 && (
          <div className="mt-4 rounded-md border border-slate-800 bg-slate-950/40 p-4">
            <p className="mb-3 text-sm text-slate-400">
              Zusätzlich zum Cashflow oben steckt bei {immobilienImSzenarioAnzahl === 1 ? "der Immobilie" : "den Immobilien"} im
              Szenario noch Vermögen im Objekt selbst (Eigenkapitalanteil = Marktwert abzüglich Restschuld) — das zählt hier
              bewusst NICHT zur Differenz oben, ist als eigene, gepunktete Linie im Chart aber sichtbar.
            </p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
              <Stat label="Immobilienwert heute (Referenz)" value={formatEuro(immobilienwertHeute)} />
              <Stat label={`Immobilienwert nach ${horizontEffektiv} Jahren (Referenz)`} value={formatEuro(immobilienwertAmEnde)} />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "positiv" | "negativ" }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div
        className={`text-lg font-semibold ${
          accent === "positiv" ? "text-emerald-400" : accent === "negativ" ? "text-red-400" : "text-slate-100"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
