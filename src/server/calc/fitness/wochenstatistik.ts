import { tageImBereich, addiereTage } from "./datum";
import type { IsoDatum, Naehrwerte, TagesAktivitaetInput } from "./types";

/**
 * Aggregation über einen Zeitraum (typisch 7 oder 30 Tage) — "Wie lief die
 * Woche?". Durchschnitte nur über Tage MIT Daten, sonst würden vergessene
 * Einträge den Schnitt künstlich drücken.
 */

export interface TagesWerte {
  datum: IsoDatum;
  /** null = an diesem Tag nichts protokolliert (nicht: 0 kcal gegessen). */
  zugefuehrt: Naehrwerte | null;
  budget: number;
  trainingMinuten: number;
  trainingKcal: number;
  trainingAnzahl: number;
  aktivitaet: TagesAktivitaetInput | null;
}

export interface Zeitraumstatistik {
  tage: number;
  tageMitErnaehrung: number;
  /** Tage, an denen die Zufuhr höchstens 10 % vom Budget abwich. */
  tageImZielkorridor: number;
  durchschnittKcal: number | null;
  durchschnittProteinG: number | null;
  durchschnittBudget: number | null;
  /** Summe (zugeführt − Budget) über protokollierte Tage; negativ = Defizit. */
  bilanzKcal: number;
  /** bilanzKcal / 7700 — rechnerische Gewichtsveränderung aus der Energiebilanz. */
  rechnerischeVeraenderungKg: number;
  trainingAnzahl: number;
  trainingMinuten: number;
  trainingKcal: number;
  durchschnittSchritte: number | null;
  durchschnittWasserMl: number | null;
  durchschnittSchlafStunden: number | null;
}

function durchschnitt(werte: (number | null | undefined)[]): number | null {
  const vorhanden = werte.filter((w): w is number => w != null);
  return vorhanden.length === 0 ? null : vorhanden.reduce((s, w) => s + w, 0) / vorhanden.length;
}

export function berechneZeitraumstatistik(tage: TagesWerte[]): Zeitraumstatistik {
  const mitErnaehrung = tage.filter((t) => t.zugefuehrt != null && t.zugefuehrt.kcal > 0);
  const bilanzKcal = mitErnaehrung.reduce((s, t) => s + (t.zugefuehrt!.kcal - t.budget), 0);

  return {
    tage: tage.length,
    tageMitErnaehrung: mitErnaehrung.length,
    tageImZielkorridor: mitErnaehrung.filter((t) => t.budget > 0 && Math.abs(t.zugefuehrt!.kcal - t.budget) <= t.budget * 0.1).length,
    durchschnittKcal: durchschnitt(mitErnaehrung.map((t) => t.zugefuehrt!.kcal)),
    durchschnittProteinG: durchschnitt(mitErnaehrung.map((t) => t.zugefuehrt!.proteinG)),
    durchschnittBudget: durchschnitt(mitErnaehrung.map((t) => t.budget)),
    bilanzKcal,
    rechnerischeVeraenderungKg: bilanzKcal / 7700,
    trainingAnzahl: tage.reduce((s, t) => s + t.trainingAnzahl, 0),
    trainingMinuten: tage.reduce((s, t) => s + t.trainingMinuten, 0),
    trainingKcal: tage.reduce((s, t) => s + t.trainingKcal, 0),
    durchschnittSchritte: durchschnitt(tage.map((t) => t.aktivitaet?.schritte)),
    durchschnittWasserMl: durchschnitt(tage.map((t) => t.aktivitaet?.wasserMl)),
    durchschnittSchlafStunden: durchschnitt(tage.map((t) => t.aktivitaet?.schlafStunden)),
  };
}

/** Die letzten `anzahl` Kalendertage bis einschließlich `bis`. */
export function letzteTage(bis: IsoDatum, anzahl: number): IsoDatum[] {
  return tageImBereich(addiereTage(bis, -(anzahl - 1)), bis);
}
