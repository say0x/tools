"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { speichereFitnessProfil } from "@/server/actions/fitness";
import { berechneEnergiebedarf, PAL_FAKTOR } from "@/server/calc/fitness/energiebedarf";
import { AKTIVITAETSLEVEL, FITNESS_ZIELE, GESCHLECHTER, type FitnessProfilInput } from "@/server/calc/fitness/types";
import {
  AKTIVITAETSLEVEL_LABELS,
  BMI_KATEGORIE_LABELS,
  FITNESS_ZIEL_LABELS,
  GESCHLECHT_LABELS,
  formatGramm,
  formatKcal,
  formatLiter,
} from "@/lib/fitness-labels";
import { formatNumber } from "@/lib/format";
import { zahlAlsText, zahlOderNull } from "../_components/zahl";

type Werte = FitnessProfilInput & { aktuellesGewichtKg: number | null };

export function FitnessProfilForm({ initial, bezugsjahr }: { initial: Werte; bezugsjahr: number }) {
  const router = useRouter();
  const [werte, setWerte] = useState<Werte>(initial);
  const [texte, setTexte] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);

  const setze = <K extends keyof Werte>(feld: K, wert: Werte[K]) => setWerte((w) => ({ ...w, [feld]: wert }));

  // Zahlenfelder: Rohtext getrennt halten, damit "1," beim Tippen nicht sofort verschwindet.
  const zahlFeld = (feld: keyof Werte, props: { step?: string; placeholder?: string } = {}) => ({
    type: "text" as const,
    inputMode: "decimal" as const,
    value: texte[feld] ?? zahlAlsText(werte[feld] as number | null),
    placeholder: props.placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setTexte((t) => ({ ...t, [feld]: e.target.value }));
      setze(feld, zahlOderNull(e.target.value) as never);
    },
  });

  const vorschau = useMemo(() => {
    if (!werte.aktuellesGewichtKg || werte.aktuellesGewichtKg < 20 || !werte.groesseCm || werte.groesseCm < 100) return null;
    return berechneEnergiebedarf(werte, werte.aktuellesGewichtKg, bezugsjahr);
  }, [werte, bezugsjahr]);

  const speichern = () => {
    setMeldung(null);
    startTransition(async () => {
      const result = await speichereFitnessProfil(werte);
      if (result.success) {
        setMeldung({ ok: true, text: "Gespeichert." });
        router.refresh();
      } else {
        setMeldung({ ok: false, text: result.error });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-6">
        <Card>
          <CardTitle>Körperdaten</CardTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Größe (cm)">
              <Input {...zahlFeld("groesseCm")} />
            </Field>
            <Field label="Geburtsjahr">
              <Input {...zahlFeld("geburtsjahr")} />
            </Field>
            <Field label="Geschlecht" hint="Für die Grundumsatz-Formel (Mifflin-St Jeor)">
              <Select value={werte.geschlecht} onChange={(e) => setze("geschlecht", e.target.value as Werte["geschlecht"])}>
                {GESCHLECHTER.map((g) => (
                  <option key={g} value={g}>
                    {GESCHLECHT_LABELS[g]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Aktuelles Gewicht (kg)" hint="Wird als heutiger Gewichtseintrag gespeichert">
              <Input {...zahlFeld("aktuellesGewichtKg", { placeholder: "z. B. 82,5" })} />
            </Field>
            <Field
              className="sm:col-span-2"
              label={
                <>
                  <span>Alltagsaktivität (ohne Sport)</span>
                  <InfoTooltip text="Nur Beruf und Alltagswege — Sport trägst du separat unter „Training“ ein, er wird dann auf dein Tagesbudget aufgeschlagen. So wird Bewegung nicht doppelt gezählt." />
                </>
              }
            >
              <Select value={werte.aktivitaetslevel} onChange={(e) => setze("aktivitaetslevel", e.target.value as Werte["aktivitaetslevel"])}>
                {AKTIVITAETSLEVEL.map((a) => (
                  <option key={a} value={a}>
                    {AKTIVITAETSLEVEL_LABELS[a]} (PAL {formatNumber(PAL_FAKTOR[a], 2)})
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        <Card>
          <CardTitle>Ziel</CardTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Ziel">
              <Select value={werte.ziel} onChange={(e) => setze("ziel", e.target.value as Werte["ziel"])}>
                {FITNESS_ZIELE.map((z) => (
                  <option key={z} value={z}>
                    {FITNESS_ZIEL_LABELS[z]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tempo (kg pro Woche)" hint="Empfohlen: 0,25–0,75 kg/Woche">
              <Input {...zahlFeld("zielTempoKgProWoche")} disabled={werte.ziel === "HALTEN"} />
            </Field>
            <Field label="Zielgewicht (kg, optional)" hint="Für die Prognose unter „Gewicht“">
              <Input {...zahlFeld("zielGewichtKg", { placeholder: "optional" })} />
            </Field>
            <Field label="Schritteziel pro Tag">
              <Input {...zahlFeld("schritteZiel")} />
            </Field>
          </div>
        </Card>

        <Card>
          <CardTitle>Kalorien & Makros</CardTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <Switch bare checked={werte.kalorienzielOverride} onChange={(e) => setze("kalorienzielOverride", e.target.checked)} />
                Kalorienziel manuell festlegen (statt automatisch berechnen)
              </label>
              {werte.kalorienzielOverride && (
                <Field label="Eigenes Kalorienziel (kcal/Tag)">
                  <Input {...zahlFeld("kalorienzielKcal", { placeholder: vorschau ? String(vorschau.kalorienzielBerechnet) : "" })} />
                </Field>
              )}
            </div>
            <Field label="Protein (g je kg Körpergewicht)" hint="1,6–2,2 bei Krafttraining/Diät, 0,8 Mindestbedarf">
              <Input {...zahlFeld("proteinGProKg")} />
            </Field>
            <Field label="Fettanteil (% der Kalorien)" hint="Üblich: 25–35 %">
              <Input {...zahlFeld("fettAnteilProzent")} />
            </Field>
            <Field label="Wasserziel (ml, optional)" hint="Leer = 35 ml je kg Körpergewicht">
              <Input {...zahlFeld("wasserZielMl", { placeholder: vorschau ? String(vorschau.wasserZielMl) : "automatisch" })} />
            </Field>
            <label className="flex items-center gap-3 self-end pb-2 text-sm text-slate-300">
              <Switch bare checked={werte.trainingskalorienAnrechnen} onChange={(e) => setze("trainingskalorienAnrechnen", e.target.checked)} />
              Trainingsverbrauch aufs Tagesbudget anrechnen
            </label>
          </div>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="button" onClick={speichern} disabled={isPending}>
            {isPending ? "Speichert…" : "Speichern"}
          </Button>
          {meldung && (
            <span role="status" className={meldung.ok ? "text-sm text-emerald-400" : "text-sm text-red-400"}>
              {meldung.text}
            </span>
          )}
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:self-start">
        <Card>
          <CardTitle>Dein Bedarf</CardTitle>
          {!vorschau ? (
            <p className="text-sm text-slate-400">Größe und aktuelles Gewicht eintragen, um den Bedarf zu berechnen.</p>
          ) : (
            <div className="flex flex-col gap-3 text-sm">
              <Zeile label="Grundumsatz" wert={formatKcal(vorschau.grundumsatz)} hinweis={`Mifflin-St Jeor, ${vorschau.alter} Jahre`} />
              <Zeile label="Gesamtumsatz ohne Sport" wert={formatKcal(vorschau.gesamtumsatz)} hinweis={`× PAL ${formatNumber(vorschau.palFaktor, 2)}`} />
              {vorschau.zielAnpassungKcal !== 0 && (
                <Zeile
                  label={vorschau.zielAnpassungKcal < 0 ? "Defizit" : "Überschuss"}
                  wert={formatKcal(Math.abs(vorschau.zielAnpassungKcal))}
                  hinweis="pro Tag (7.700 kcal ≈ 1 kg)"
                />
              )}
              <div className="rounded-md border border-blue-900/60 bg-blue-950/20 p-3">
                <div className="text-xs text-slate-400">Kalorienziel</div>
                <div className="text-2xl font-semibold text-slate-100">{formatKcal(vorschau.kalorienziel)}</div>
                {vorschau.defizitBegrenzt && (
                  <p className="mt-1 text-xs text-amber-400">
                    Auf {formatKcal(vorschau.untergrenze)} angehoben — ein größeres Defizit läge unter deinem Grundumsatz.
                  </p>
                )}
                {vorschau.unterUntergrenze && !vorschau.defizitBegrenzt && (
                  <p className="mt-1 text-xs text-amber-400">
                    Liegt unter der empfohlenen Untergrenze von {formatKcal(vorschau.untergrenze)}.
                  </p>
                )}
              </div>
              <Zeile label="Protein" wert={formatGramm(vorschau.makros.proteinG)} />
              <Zeile label="Fett" wert={formatGramm(vorschau.makros.fettG)} />
              <Zeile label="Kohlenhydrate" wert={formatGramm(vorschau.makros.kohlenhydrateG)} />
              {vorschau.makros.kohlenhydrateAufNullBegrenzt && (
                <p className="text-xs text-amber-400">Protein + Fett schöpfen das Kalorienziel bereits aus.</p>
              )}
              <Zeile label="Wasser" wert={formatLiter(vorschau.wasserZielMl)} />
              <Zeile
                label="BMI"
                wert={formatNumber(vorschau.bmi, 1)}
                hinweis={`${BMI_KATEGORIE_LABELS[vorschau.bmiKategorie]} — grobe Orientierung, unterscheidet nicht zwischen Muskel und Fett`}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Zeile({ label, wert, hinweis }: { label: string; wert: string; hinweis?: string }) {
  return (
    <div>
      <div className="flex justify-between gap-2">
        <span className="text-slate-400">{label}</span>
        <span className="font-medium tabular-nums text-slate-100">{wert}</span>
      </div>
      {hinweis && <p className="text-xs text-slate-400">{hinweis}</p>}
    </div>
  );
}
