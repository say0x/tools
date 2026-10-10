"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/cn";
import { erstelleEigenesLebensmittel, erstelleMahlzeiten } from "@/server/actions/fitness";
import { naehrwerteFuerMenge } from "@/server/calc/fitness/tagesbilanz";
import { MAHLZEITEN, type Mahlzeit } from "@/server/calc/fitness/types";
import type { LebensmittelOption } from "@/server/data/fitness";
import { MAHLZEIT_LABELS, formatGramm, formatKcal } from "@/lib/fitness-labels";
import { LoeschenButton } from "../_components/LoeschenButton";
import { zahlOderNull } from "../_components/zahl";
import { FotoAnalyse } from "./FotoAnalyse";

type Modus = "foto" | "datenbank" | "manuell" | "eigene";

/** Vorbelegung nach Uhrzeit — spart beim schnellen Eintragen einen Klick. */
function mahlzeitNachUhrzeit(): Mahlzeit {
  const h = new Date().getHours();
  if (h < 10) return "FRUEHSTUECK";
  if (h < 15) return "MITTAGESSEN";
  if (h >= 17 && h < 21) return "ABENDESSEN";
  return "SNACK";
}

export function ErnaehrungClient({ datum, katalog, kiVerfuegbar }: { datum: string; katalog: LebensmittelOption[]; kiVerfuegbar: boolean }) {
  const [modus, setModus] = useState<Modus>(kiVerfuegbar ? "foto" : "datenbank");
  const [mahlzeit, setMahlzeit] = useState<Mahlzeit>(mahlzeitNachUhrzeit);

  const tabs: { id: Modus; label: string }[] = [
    { id: "foto", label: "Foto (KI)" },
    { id: "datenbank", label: "Lebensmittel-Datenbank" },
    { id: "manuell", label: "Manuell" },
    { id: "eigene", label: "Eigene Lebensmittel" },
  ];

  return (
    <Card>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div role="tablist" aria-label="Erfassungsart" className="flex flex-wrap gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={modus === t.id}
              onClick={() => setModus(t.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                modus === t.id ? "bg-slate-800 text-slate-100" : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {modus !== "eigene" && (
          <Field label="Mahlzeit" className="sm:w-44">
            <Select value={mahlzeit} onChange={(e) => setMahlzeit(e.target.value as Mahlzeit)}>
              {MAHLZEITEN.map((m) => (
                <option key={m} value={m}>
                  {MAHLZEIT_LABELS[m]}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      {modus === "foto" && <FotoAnalyse datum={datum} mahlzeit={mahlzeit} verfuegbar={kiVerfuegbar} />}
      {modus === "datenbank" && <DatenbankModus datum={datum} mahlzeit={mahlzeit} katalog={katalog} />}
      {modus === "manuell" && <ManuellModus datum={datum} mahlzeit={mahlzeit} />}
      {modus === "eigene" && <EigeneModus eigene={katalog.filter((k) => k.eigenes)} />}
    </Card>
  );
}

function Meldung({ meldung }: { meldung: { ok: boolean; text: string } | null }) {
  if (!meldung) return null;
  return (
    <span role="status" className={meldung.ok ? "text-sm text-emerald-400" : "text-sm text-red-400"}>
      {meldung.text}
    </span>
  );
}

function DatenbankModus({ datum, mahlzeit, katalog }: { datum: string; mahlzeit: Mahlzeit; katalog: LebensmittelOption[] }) {
  const [suche, setSuche] = useState("");
  const [auswahl, setAuswahl] = useState<LebensmittelOption | null>(null);
  const [menge, setMenge] = useState("");
  const [isPending, startTransition] = useTransition();
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);

  const treffer = useMemo(() => {
    const s = suche.trim().toLowerCase();
    const liste = s ? katalog.filter((k) => k.bezeichnung.toLowerCase().includes(s) || k.kategorie.toLowerCase().includes(s)) : katalog;
    return liste.slice(0, 30);
  }, [suche, katalog]);

  const mengeG = zahlOderNull(menge);
  const werte = auswahl && mengeG != null && mengeG > 0 ? naehrwerteFuerMenge(auswahl, mengeG) : null;

  const waehle = (l: LebensmittelOption) => {
    setAuswahl(l);
    setMenge(String(l.standardPortionG));
    setMeldung(null);
  };

  const hinzufuegen = () => {
    if (!auswahl || !werte || mengeG == null) return;
    startTransition(async () => {
      const r = await erstelleMahlzeiten([
        {
          datum,
          mahlzeit,
          bezeichnung: auswahl.bezeichnung,
          mengeG,
          kcal: Math.round(werte.kcal),
          proteinG: Math.round(werte.proteinG * 10) / 10,
          kohlenhydrateG: Math.round(werte.kohlenhydrateG * 10) / 10,
          fettG: Math.round(werte.fettG * 10) / 10,
          quelle: "LEBENSMITTEL_DB",
        },
      ]);
      setMeldung(r.success ? { ok: true, text: `${auswahl.bezeichnung} eingetragen.` } : { ok: false, text: r.error });
      if (r.success) setAuswahl(null);
    });
  };

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Field label="Suchen">
          <Input value={suche} onChange={(e) => setSuche(e.target.value)} placeholder="z. B. Haferflocken, Banane, Obst …" />
        </Field>
        <ul className="max-h-72 overflow-y-auto rounded-md border border-slate-800" aria-label="Suchergebnisse">
          {treffer.length === 0 && <li className="px-3 py-2 text-sm text-slate-400">Nichts gefunden — „Manuell“ oder „Eigene Lebensmittel“ nutzen.</li>}
          {treffer.map((l) => (
            <li key={`${l.eigenes ? "e" : "r"}-${l.id}`}>
              <button
                type="button"
                onClick={() => waehle(l)}
                aria-pressed={auswahl?.id === l.id}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-800",
                  auswahl?.id === l.id && "bg-slate-800"
                )}
              >
                <span className="text-slate-200">
                  {l.bezeichnung} <span className="text-xs text-slate-400">· {l.kategorie}</span>
                </span>
                <span className="shrink-0 tabular-nums text-xs text-slate-400">{Math.round(l.kcalPro100g)} kcal/100 g</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        {!auswahl ? (
          <p className="text-sm text-slate-400">Lebensmittel links auswählen, dann Menge anpassen.</p>
        ) : (
          <>
            <div className="text-sm font-medium text-slate-100">{auswahl.bezeichnung}</div>
            <Field label="Menge (g bzw. ml)" hint={`Standardportion: ${formatGramm(auswahl.standardPortionG)}`}>
              <Input inputMode="decimal" value={menge} onChange={(e) => setMenge(e.target.value)} />
            </Field>
            {werte && (
              <dl className="grid grid-cols-4 gap-2 rounded-md border border-slate-800 p-3 text-center text-sm">
                <Wert label="kcal" wert={Math.round(werte.kcal)} />
                <Wert label="Protein" wert={`${Math.round(werte.proteinG)} g`} />
                <Wert label="KH" wert={`${Math.round(werte.kohlenhydrateG)} g`} />
                <Wert label="Fett" wert={`${Math.round(werte.fettG)} g`} />
              </dl>
            )}
            <div className="flex items-center gap-3">
              <Button type="button" onClick={hinzufuegen} disabled={!werte || isPending}>
                {isPending ? "Speichert…" : `Zu ${MAHLZEIT_LABELS[mahlzeit]} hinzufügen`}
              </Button>
            </div>
          </>
        )}
        <Meldung meldung={meldung} />
      </div>
    </div>
  );
}

function Wert({ label, wert }: { label: string; wert: string | number }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="font-medium tabular-nums text-slate-100">{wert}</dd>
    </div>
  );
}

function ManuellModus({ datum, mahlzeit }: { datum: string; mahlzeit: Mahlzeit }) {
  const leer = { bezeichnung: "", menge: "", kcal: "", protein: "", kh: "", fett: "" };
  const [f, setF] = useState(leer);
  const [isPending, startTransition] = useTransition();
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const feld = (k: keyof typeof leer) => ({ value: f[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value })) });

  const speichern = () =>
    startTransition(async () => {
      const r = await erstelleMahlzeiten([
        {
          datum,
          mahlzeit,
          bezeichnung: f.bezeichnung,
          mengeG: zahlOderNull(f.menge),
          kcal: zahlOderNull(f.kcal),
          proteinG: zahlOderNull(f.protein) ?? 0,
          kohlenhydrateG: zahlOderNull(f.kh) ?? 0,
          fettG: zahlOderNull(f.fett) ?? 0,
        },
      ]);
      setMeldung(r.success ? { ok: true, text: "Eingetragen." } : { ok: false, text: r.error });
      if (r.success) setF(leer);
    });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Bezeichnung" className="col-span-2 sm:col-span-2">
          <Input {...feld("bezeichnung")} placeholder="z. B. Kantinenessen Lasagne" />
        </Field>
        <Field label="Menge (g, optional)">
          <Input inputMode="decimal" {...feld("menge")} />
        </Field>
        <Field label="Kalorien (kcal)">
          <Input inputMode="decimal" {...feld("kcal")} />
        </Field>
        <Field label="Protein (g)">
          <Input inputMode="decimal" {...feld("protein")} placeholder="0" />
        </Field>
        <Field label="Kohlenhydrate (g)">
          <Input inputMode="decimal" {...feld("kh")} placeholder="0" />
        </Field>
        <Field label="Fett (g)">
          <Input inputMode="decimal" {...feld("fett")} placeholder="0" />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={speichern} disabled={isPending}>
          {isPending ? "Speichert…" : `Zu ${MAHLZEIT_LABELS[mahlzeit]} hinzufügen`}
        </Button>
        <Meldung meldung={meldung} />
      </div>
    </div>
  );
}

function EigeneModus({ eigene }: { eigene: LebensmittelOption[] }) {
  const leer = { bezeichnung: "", kcal: "", protein: "", kh: "", fett: "", portion: "100" };
  const [f, setF] = useState(leer);
  const [isPending, startTransition] = useTransition();
  const [meldung, setMeldung] = useState<{ ok: boolean; text: string } | null>(null);
  const feld = (k: keyof typeof leer) => ({ value: f[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setF((x) => ({ ...x, [k]: e.target.value })) });

  const speichern = () =>
    startTransition(async () => {
      const r = await erstelleEigenesLebensmittel({
        bezeichnung: f.bezeichnung,
        kcalPro100g: zahlOderNull(f.kcal),
        proteinPro100g: zahlOderNull(f.protein) ?? 0,
        kohlenhydratePro100g: zahlOderNull(f.kh) ?? 0,
        fettPro100g: zahlOderNull(f.fett) ?? 0,
        standardPortionG: zahlOderNull(f.portion) ?? 100,
      });
      setMeldung(r.success ? { ok: true, text: "Gespeichert — jetzt in der Lebensmittel-Datenbank auswählbar." } : { ok: false, text: r.error });
      if (r.success) setF(leer);
    });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-400">Eigene Produkte oder Rezepte mit Nährwerten je 100 g (z. B. von der Verpackung) — erscheinen danach ganz oben in der Suche.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Bezeichnung" className="col-span-2 sm:col-span-3">
          <Input {...feld("bezeichnung")} placeholder="z. B. Mein Proteinriegel" />
        </Field>
        <Field label="kcal je 100 g">
          <Input inputMode="decimal" {...feld("kcal")} />
        </Field>
        <Field label="Protein je 100 g">
          <Input inputMode="decimal" {...feld("protein")} placeholder="0" />
        </Field>
        <Field label="KH je 100 g">
          <Input inputMode="decimal" {...feld("kh")} placeholder="0" />
        </Field>
        <Field label="Fett je 100 g">
          <Input inputMode="decimal" {...feld("fett")} placeholder="0" />
        </Field>
        <Field label="Standardportion (g)">
          <Input inputMode="decimal" {...feld("portion")} />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={speichern} disabled={isPending}>
          Lebensmittel speichern
        </Button>
        <Meldung meldung={meldung} />
      </div>
      {eigene.length > 0 && (
        <ul className="divide-y divide-slate-800/60 rounded-md border border-slate-800">
          {eigene.map((l) => (
            <li key={l.id} className="flex items-center justify-between gap-2 px-3 py-1.5 text-sm">
              <span className="text-slate-200">{l.bezeichnung}</span>
              <span className="flex items-center gap-2">
                <span className="tabular-nums text-xs text-slate-400">
                  {formatKcal(l.kcalPro100g)}/100 g · Portion {formatGramm(l.standardPortionG)}
                </span>
                <LoeschenButton art="lebensmittel" id={l.id} bezeichnung={l.bezeichnung} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
