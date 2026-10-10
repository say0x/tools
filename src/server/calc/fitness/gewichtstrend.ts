import { addiereTage, tageZwischen } from "./datum";
import type { GewichtMesswert, IsoDatum } from "./types";

/**
 * Gewichtsverlauf mit Glättung, Trend und Ziel-Prognose. Tagesgewichte
 * schwanken durch Wasser/Darminhalt um ±1 kg — Aussagen deshalb immer über
 * den 7-Tage-Durchschnitt bzw. die Regressionsgerade, nie über Einzelwerte.
 */

export const GLAETTUNG_TAGE = 7;
export const TREND_FENSTER_TAGE = 28;
/** Unterhalb ~35 g/Woche gilt der Verlauf als stagnierend (Messrauschen). */
const STAGNATION_KG_PRO_TAG = 0.005;
/** Prognosen über 3 Jahre hinaus sind bedeutungslos. */
const MAX_PROGNOSE_TAGE = 3 * 365;

export interface GewichtsPunkt extends GewichtMesswert {
  durchschnitt7: number;
}

export type PrognoseStatus = "KEIN_ZIEL" | "ZU_WENIG_DATEN" | "ERREICHT" | "IN_RICHTUNG" | "FALSCHE_RICHTUNG" | "STAGNATION";

export interface Gewichtsverlauf {
  punkte: GewichtsPunkt[];
  aktuellKg: number | null;
  aktuellGeglaettetKg: number | null;
  veraenderung7TageKg: number | null;
  veraenderung30TageKg: number | null;
  veraenderungGesamtKg: number | null;
  trendKgProWoche: number | null;
  prognose: { status: PrognoseStatus; datum: IsoDatum | null; tage: number | null };
}

function sortiert(messwerte: GewichtMesswert[]): GewichtMesswert[] {
  return [...messwerte].sort((a, b) => a.datum.localeCompare(b.datum));
}

export function glaetteGewichte(messwerte: GewichtMesswert[], fensterTage = GLAETTUNG_TAGE): GewichtsPunkt[] {
  const liste = sortiert(messwerte);
  return liste.map((m) => {
    const fensterStart = addiereTage(m.datum, -(fensterTage - 1));
    const imFenster = liste.filter((x) => x.datum >= fensterStart && x.datum <= m.datum);
    const durchschnitt7 = imFenster.reduce((s, x) => s + x.gewichtKg, 0) / imFenster.length;
    return { ...m, durchschnitt7 };
  });
}

/**
 * Steigung (kg/Tag) der Regressionsgeraden über die letzten `fensterTage`.
 * Braucht ≥3 Messungen, die ≥7 Tage auseinanderliegen — sonst null.
 */
export function berechneTrendKgProTag(messwerte: GewichtMesswert[], bisDatum: IsoDatum, fensterTage = TREND_FENSTER_TAGE): number | null {
  const start = addiereTage(bisDatum, -(fensterTage - 1));
  const fenster = sortiert(messwerte).filter((m) => m.datum >= start && m.datum <= bisDatum);
  if (fenster.length < 3) return null;
  if (tageZwischen(fenster[0].datum, fenster[fenster.length - 1].datum) < 7) return null;

  const xs = fenster.map((m) => tageZwischen(start, m.datum));
  const ys = fenster.map((m) => m.gewichtKg);
  const n = xs.length;
  const mx = xs.reduce((s, x) => s + x, 0) / n;
  const my = ys.reduce((s, y) => s + y, 0) / n;
  let zaehler = 0;
  let nenner = 0;
  for (let i = 0; i < n; i++) {
    zaehler += (xs[i] - mx) * (ys[i] - my);
    nenner += (xs[i] - mx) ** 2;
  }
  return nenner === 0 ? null : zaehler / nenner;
}

function geglaettetAmOderVor(punkte: GewichtsPunkt[], datum: IsoDatum): number | null {
  for (let i = punkte.length - 1; i >= 0; i--) {
    if (punkte[i].datum <= datum) return punkte[i].durchschnitt7;
  }
  return null;
}

export function berechneGewichtsverlauf(messwerte: GewichtMesswert[], zielGewichtKg: number | null, heute: IsoDatum): Gewichtsverlauf {
  const punkte = glaetteGewichte(messwerte.filter((m) => m.datum <= heute));
  const letzter = punkte.at(-1) ?? null;

  if (!letzter) {
    return {
      punkte,
      aktuellKg: null,
      aktuellGeglaettetKg: null,
      veraenderung7TageKg: null,
      veraenderung30TageKg: null,
      veraenderungGesamtKg: null,
      trendKgProWoche: null,
      prognose: { status: zielGewichtKg == null ? "KEIN_ZIEL" : "ZU_WENIG_DATEN", datum: null, tage: null },
    };
  }

  const vergleich = (tage: number) => {
    const frueher = geglaettetAmOderVor(punkte, addiereTage(letzter.datum, -tage));
    return frueher == null ? null : letzter.durchschnitt7 - frueher;
  };

  const trendProTag = berechneTrendKgProTag(punkte, letzter.datum);

  let prognose: Gewichtsverlauf["prognose"];
  if (zielGewichtKg == null) {
    prognose = { status: "KEIN_ZIEL", datum: null, tage: null };
  } else {
    const differenz = zielGewichtKg - letzter.durchschnitt7;
    if (Math.abs(differenz) < 0.3) {
      prognose = { status: "ERREICHT", datum: null, tage: null };
    } else if (trendProTag == null) {
      prognose = { status: "ZU_WENIG_DATEN", datum: null, tage: null };
    } else if (Math.abs(trendProTag) < STAGNATION_KG_PRO_TAG) {
      prognose = { status: "STAGNATION", datum: null, tage: null };
    } else if (Math.sign(trendProTag) !== Math.sign(differenz)) {
      prognose = { status: "FALSCHE_RICHTUNG", datum: null, tage: null };
    } else {
      const tage = Math.ceil(differenz / trendProTag);
      prognose =
        tage > MAX_PROGNOSE_TAGE
          ? { status: "STAGNATION", datum: null, tage: null }
          : { status: "IN_RICHTUNG", datum: addiereTage(letzter.datum, tage), tage };
    }
  }

  return {
    punkte,
    aktuellKg: letzter.gewichtKg,
    aktuellGeglaettetKg: letzter.durchschnitt7,
    veraenderung7TageKg: vergleich(7),
    veraenderung30TageKg: vergleich(30),
    veraenderungGesamtKg: punkte.length > 1 ? letzter.durchschnitt7 - punkte[0].durchschnitt7 : null,
    trendKgProWoche: trendProTag == null ? null : trendProTag * 7,
    prognose,
  };
}

/**
 * Aktuellstes Gewicht am oder vor `datum` — Basis für Energiebedarf und
 * Trainingsverbrauch. null, wenn noch nie gewogen wurde.
 */
export function gewichtAmDatum(messwerte: GewichtMesswert[], datum: IsoDatum): number | null {
  const vorher = sortiert(messwerte).filter((m) => m.datum <= datum);
  return vorher.at(-1)?.gewichtKg ?? null;
}
