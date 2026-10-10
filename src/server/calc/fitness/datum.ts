import type { IsoDatum } from "./types";

const ISO_DATUM = /^\d{4}-\d{2}-\d{2}$/;

export function istIsoDatum(wert: string): boolean {
  if (!ISO_DATUM.test(wert)) return false;
  const d = new Date(`${wert}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === wert;
}

export function isoZuUtcDate(datum: IsoDatum): Date {
  return new Date(`${datum}T00:00:00.000Z`);
}

export function utcDateZuIso(datum: Date): IsoDatum {
  return datum.toISOString().slice(0, 10);
}

export function addiereTage(datum: IsoDatum, tage: number): IsoDatum {
  const d = isoZuUtcDate(datum);
  d.setUTCDate(d.getUTCDate() + tage);
  return utcDateZuIso(d);
}

/** Ganze Tage von `von` bis `bis` (positiv, wenn `bis` später liegt). */
export function tageZwischen(von: IsoDatum, bis: IsoDatum): number {
  return Math.round((isoZuUtcDate(bis).getTime() - isoZuUtcDate(von).getTime()) / 86_400_000);
}

/** Alle Kalendertage von `von` bis einschließlich `bis`, aufsteigend. */
export function tageImBereich(von: IsoDatum, bis: IsoDatum): IsoDatum[] {
  const tage: IsoDatum[] = [];
  for (let d = von; d <= bis; d = addiereTage(d, 1)) tage.push(d);
  return tage;
}

/**
 * Heutiges Datum in der angegebenen Zeitzone (Default Europe/Berlin) — der
 * Docker-Container läuft in UTC; zwischen 0 und 2 Uhr deutscher Zeit wäre
 * "heute" sonst noch gestern.
 */
export function heuteIso(timeZone = "Europe/Berlin", jetzt: Date = new Date()): IsoDatum {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(jetzt);
}
