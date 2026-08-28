"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { aktualisiereStandardwerte } from "@/server/actions/reference-data";
import { BUNDESLAND_LABELS, FINANZIERUNGSART_LABELS } from "@/lib/labels";
import { BUNDESLAENDER, FINANZIERUNGSARTEN, type Bundesland, type Finanzierungsart } from "@/server/calc/types";
import type { Standardwerte } from "@/server/data/reference-data";

function NullableNumberField({
  label,
  value,
  onChange,
  step = "any",
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-slate-300">{label}</span>
      <Input
        type="number"
        step={step}
        placeholder="kein Standard"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      />
    </label>
  );
}

export function StandardwerteCard({ initialWerte }: { initialWerte: Standardwerte }) {
  const [werte, setWerte] = useState(initialWerte);
  const [savedWerte, setSavedWerte] = useState(initialWerte);
  const [isPending, startTransition] = useTransition();
  const [gespeichert, setGespeichert] = useState(false);
  const [serverFehler, setServerFehler] = useState<string | null>(null);
  const isDirty = JSON.stringify(werte) !== JSON.stringify(savedWerte);

  const save = () => {
    setServerFehler(null);
    startTransition(async () => {
      try {
        await aktualisiereStandardwerte({
          standardBundesland: werte.bundesland,
          standardZinssatzProzent: werte.zinssatzProzent,
          standardTilgungProzent: werte.tilgungProzent,
          standardZinsbindungJahre: werte.zinsbindungJahre,
          standardFinanzierungsart: werte.finanzierungsart,
          standardMietsteigerungProzent: werte.mietsteigerungProzent,
          standardWertsteigerungProzent: werte.wertsteigerungProzent,
          standardKostensteigerungProzent: werte.kostensteigerungProzent,
          standardLeerstandsquoteProzent: werte.leerstandsquoteProzent,
          standardAnschlusszinsAufschlagProzent: werte.anschlusszinsAufschlagProzent,
          standardSondertilgungProzent: werte.sondertilgungProzent,
          standardSondertilgungMaxProzent: werte.sondertilgungMaxProzent,
        });
        setSavedWerte(werte);
        setGespeichert(true);
        setTimeout(() => setGespeichert(false), 2000);
      } catch (err) {
        setServerFehler(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-400">
        Füllt diese Felder bei jedem neuen Objekt vor, damit du verschiedene Objekte mit denselben Annahmen effizient
        vergleichen kannst — bleibt pro Objekt frei überschreibbar. Leer lassen = kein Standard, dann gilt der
        eingebaute Fallback-Wert.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-300">Bundesland</span>
          <Select
            value={werte.bundesland ?? ""}
            onChange={(e) => setWerte((w) => ({ ...w, bundesland: (e.target.value || null) as Bundesland | null }))}
          >
            <option value="">Kein Standard</option>
            {BUNDESLAENDER.map((b) => (
              <option key={b} value={b}>
                {BUNDESLAND_LABELS[b]}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-300">Finanzierungsart</span>
          <Select
            value={werte.finanzierungsart ?? ""}
            onChange={(e) => setWerte((w) => ({ ...w, finanzierungsart: (e.target.value || null) as Finanzierungsart | null }))}
          >
            <option value="">Kein Standard</option>
            {FINANZIERUNGSARTEN.map((f) => (
              <option key={f} value={f}>
                {FINANZIERUNGSART_LABELS[f]}
              </option>
            ))}
          </Select>
        </label>

        <NullableNumberField
          label="Zinssatz (%)"
          value={werte.zinssatzProzent}
          onChange={(v) => setWerte((w) => ({ ...w, zinssatzProzent: v }))}
        />
        <NullableNumberField
          label="Anfängliche Tilgung (%)"
          value={werte.tilgungProzent}
          onChange={(v) => setWerte((w) => ({ ...w, tilgungProzent: v }))}
        />
        <NullableNumberField
          label="Zinsbindung (Jahre)"
          value={werte.zinsbindungJahre}
          onChange={(v) => setWerte((w) => ({ ...w, zinsbindungJahre: v }))}
          step="1"
        />
        <NullableNumberField
          label="Anschlusszins-Aufschlag (Prozentpunkte)"
          value={werte.anschlusszinsAufschlagProzent}
          onChange={(v) => setWerte((w) => ({ ...w, anschlusszinsAufschlagProzent: v }))}
        />
        <NullableNumberField
          label="Sondertilgung (%/Jahr)"
          value={werte.sondertilgungProzent}
          onChange={(v) => setWerte((w) => ({ ...w, sondertilgungProzent: v }))}
        />
        <NullableNumberField
          label="Max. Sondertilgung laut Vertrag (%/Jahr)"
          value={werte.sondertilgungMaxProzent}
          onChange={(v) => setWerte((w) => ({ ...w, sondertilgungMaxProzent: v }))}
        />
        <NullableNumberField
          label="Mietsteigerung (%/Jahr)"
          value={werte.mietsteigerungProzent}
          onChange={(v) => setWerte((w) => ({ ...w, mietsteigerungProzent: v }))}
        />
        <NullableNumberField
          label="Wertsteigerung (%/Jahr)"
          value={werte.wertsteigerungProzent}
          onChange={(v) => setWerte((w) => ({ ...w, wertsteigerungProzent: v }))}
        />
        <NullableNumberField
          label="Kostensteigerung (%/Jahr)"
          value={werte.kostensteigerungProzent}
          onChange={(v) => setWerte((w) => ({ ...w, kostensteigerungProzent: v }))}
        />
        <NullableNumberField
          label="Leerstandsquote (%)"
          value={werte.leerstandsquoteProzent}
          onChange={(v) => setWerte((w) => ({ ...w, leerstandsquoteProzent: v }))}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" size="sm" disabled={isPending} onClick={save}>
          {isPending ? "Speichert…" : "Speichern"}
        </Button>
        {gespeichert && <span className="text-sm text-emerald-400">Gespeichert.</span>}
        {!gespeichert && isDirty && <span className="text-sm text-amber-400">Ungespeicherte Änderungen</span>}
        {serverFehler && <span className="text-sm text-red-400">{serverFehler}</span>}
      </div>
    </div>
  );
}
