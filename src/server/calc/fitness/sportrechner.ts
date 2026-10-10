/**
 * Freistehende Sport-Rechner (kein Speichern, rein clientseitig nutzbar):
 * Lauf-Pace, Wettkampfprognose (Riegel), Herzfrequenzzonen (Karvonen) und
 * Maximalkraft-Schätzung (1RM).
 */

export const WETTKAMPF_DISTANZEN_KM = [
  { label: "5 km", km: 5 },
  { label: "10 km", km: 10 },
  { label: "Halbmarathon", km: 21.0975 },
  { label: "Marathon", km: 42.195 },
] as const;

/** Pace in Sekunden pro km. */
export function paceSekundenProKm(distanzKm: number, zeitSekunden: number): number {
  if (distanzKm <= 0) return 0;
  return zeitSekunden / distanzKm;
}

export function geschwindigkeitKmh(distanzKm: number, zeitSekunden: number): number {
  if (zeitSekunden <= 0) return 0;
  return distanzKm / (zeitSekunden / 3600);
}

/** Riegel-Formel (1977): T2 = T1 · (D2/D1)^1,06 — gilt gut für 3–42 km bei passendem Training. */
export function riegelPrognoseSekunden(distanzKm: number, zeitSekunden: number, zielDistanzKm: number, exponent = 1.06): number {
  if (distanzKm <= 0 || zeitSekunden <= 0) return 0;
  return zeitSekunden * Math.pow(zielDistanzKm / distanzKm, exponent);
}

/** "h:mm:ss" bzw. "m:ss" — für Pace (pro km) und Zielzeiten. */
export function formatDauer(sekundenGesamt: number): string {
  const gerundet = Math.round(sekundenGesamt);
  const h = Math.floor(gerundet / 3600);
  const m = Math.floor((gerundet % 3600) / 60);
  const s = gerundet % 60;
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** Parst "h:mm:ss", "mm:ss" oder reine Minuten ("45") in Sekunden; null bei ungültiger Eingabe. */
export function parseDauer(eingabe: string): number | null {
  const teile = eingabe.trim().split(":");
  if (teile.length === 0 || teile.length > 3 || teile.some((t) => t === "" || !/^\d+([.,]\d+)?$/.test(t))) return null;
  const zahlen = teile.map((t) => Number(t.replace(",", ".")));
  if (zahlen.length === 1) return zahlen[0] * 60;
  if (zahlen.length === 2) return zahlen[0] * 60 + zahlen[1];
  return zahlen[0] * 3600 + zahlen[1] * 60 + zahlen[2];
}

/** HFmax nach Tanaka et al. (2001): 208 − 0,7 · Alter — genauer als die alte 220 − Alter. */
export function maximalpulsTanaka(alter: number): number {
  return Math.round(208 - 0.7 * alter);
}

export interface Herzfrequenzzone {
  zone: number;
  name: string;
  vonProzent: number;
  bisProzent: number;
  vonBpm: number;
  bisBpm: number;
}

const ZONEN = [
  { zone: 1, name: "Regeneration", von: 50, bis: 60 },
  { zone: 2, name: "Grundlagenausdauer", von: 60, bis: 70 },
  { zone: 3, name: "Aerober Bereich", von: 70, bis: 80 },
  { zone: 4, name: "Schwelle", von: 80, bis: 90 },
  { zone: 5, name: "Maximal", von: 90, bis: 100 },
];

/**
 * Mit Ruhepuls: Karvonen (Herzfrequenzreserve), sonst Prozent von HFmax.
 */
export function berechneHerzfrequenzzonen(maxPuls: number, ruhepuls: number | null): Herzfrequenzzone[] {
  const bpm = (prozent: number) =>
    Math.round(ruhepuls != null && ruhepuls > 0 ? ruhepuls + (prozent / 100) * (maxPuls - ruhepuls) : (prozent / 100) * maxPuls);
  return ZONEN.map((z) => ({ zone: z.zone, name: z.name, vonProzent: z.von, bisProzent: z.bis, vonBpm: bpm(z.von), bisBpm: bpm(z.bis) }));
}

export interface EinerMaximum {
  epley: number;
  brzycki: number | null;
  mittelwert: number;
}

/** 1RM-Schätzung aus Gewicht × Wiederholungen. Brzycki nur bis 36 Wdh. definiert. */
export function schaetzeEinerMaximum(gewichtKg: number, wiederholungen: number): EinerMaximum {
  if (wiederholungen <= 1) return { epley: gewichtKg, brzycki: gewichtKg, mittelwert: gewichtKg };
  const epley = gewichtKg * (1 + wiederholungen / 30);
  const brzycki = wiederholungen < 37 ? gewichtKg * (36 / (37 - wiederholungen)) : null;
  return { epley, brzycki, mittelwert: brzycki == null ? epley : (epley + brzycki) / 2 };
}

/** Trainingsgewicht für eine Wiederholungszahl aus dem 1RM (Epley invertiert). */
export function gewichtFuerWiederholungen(einerMax: number, wiederholungen: number): number {
  return wiederholungen <= 1 ? einerMax : einerMax / (1 + wiederholungen / 30);
}
