import { ZUSTANDSFAKTOR } from "../constants";
import type { EigentumsTyp, GewerkKostenResult, Gewerk, InstandhaltungResultForCalc, ReferenceDataSnapshot } from "../types";

const ZUSTAND_RISIKO_SCHWELLE = 5; // "schlecht" (5) oder "sehr schlecht" (6)
const INSTANDHALTUNG_UNTERDECKUNG_SCHWELLE_EURO = 20; // Bagatellgrenze gegen Rundungsrauschen

export interface VerhandlungsargumentGewerkRisiko {
  typ: "GEWERK_RISIKO";
  gewerk: Gewerk;
  zustand: number;
  eigentumsTyp: EigentumsTyp;
  istOverride: boolean;
  geschaetzteKostenEuro: number;
  kostenMinProM2: number;
  kostenMaxProM2: number;
  mittelwertProM2: number;
  zustandsfaktorProzent: number;
  wohnflaeche: number;
}

export interface VerhandlungsargumentInstandhaltungUnterdeckung {
  typ: "INSTANDHALTUNG_UNTERDECKUNG";
  empfohleneRuecklageMonatlich: number;
  tatsaechlicheRuecklageMonatlich: number;
  differenzMonatlich: number;
}

export interface VerhandlungsargumentCashflowNegativ {
  typ: "CASHFLOW_NEGATIV";
  cashflowNachSteuerMonatlich: number;
  aktuellerKaufpreis: number;
  breakevenKaufpreis: number | null;
  differenzZuAktuellemKaufpreis: number | null;
}

export type Verhandlungsargument =
  | VerhandlungsargumentGewerkRisiko
  | VerhandlungsargumentInstandhaltungUnterdeckung
  | VerhandlungsargumentCashflowNegativ;

export interface VerhandlungsargumenteInput {
  gewerkePosten: GewerkKostenResult[];
  gewerkKostenReferenz: ReferenceDataSnapshot["gewerkKosten"];
  wohnflaeche: number;
  instandhaltung: InstandhaltungResultForCalc;
  cashflowNachSteuerMonatlich: number;
  aktuellerKaufpreis: number;
  breakevenKaufpreis: number | null;
  differenzZuAktuellemKaufpreis: number | null;
}

/**
 * Leitet aus den bereits berechneten Kennzahlen konkrete, mit echten Zahlen
 * belegte Verhandlungsargumente ab (z. B. für ein Gespräch mit Verkäufer
 * oder Makler). Reine Fakten aus dem eigenen Modell — keine erfundenen
 * Marktvergleiche oder Richtwerte von außen.
 */
export function ermittleVerhandlungsargumente(input: VerhandlungsargumenteInput): Verhandlungsargument[] {
  const argumente: Verhandlungsargument[] = [];

  for (const posten of input.gewerkePosten) {
    if (posten.zustand < ZUSTAND_RISIKO_SCHWELLE) continue;
    const kosten = input.gewerkKostenReferenz[posten.gewerk];
    if (!kosten) continue;

    const mittelwertProM2 = round1((kosten.min + kosten.max) / 2);
    const zustandsfaktorProzent = round1((ZUSTANDSFAKTOR[posten.zustand] ?? ZUSTANDSFAKTOR[3]) * 100);

    argumente.push({
      typ: "GEWERK_RISIKO",
      gewerk: posten.gewerk,
      zustand: posten.zustand,
      eigentumsTyp: posten.eigentumsTyp,
      istOverride: posten.istOverride,
      geschaetzteKostenEuro: posten.geschaetzteKostenEuro,
      kostenMinProM2: kosten.min,
      kostenMaxProM2: kosten.max,
      mittelwertProM2,
      zustandsfaktorProzent,
      wohnflaeche: input.wohnflaeche,
    });
  }

  const differenzMonatlich = round2(
    input.instandhaltung.empfohleneRuecklageMonatlich - input.instandhaltung.tatsaechlichMonatlich
  );
  if (differenzMonatlich > INSTANDHALTUNG_UNTERDECKUNG_SCHWELLE_EURO) {
    argumente.push({
      typ: "INSTANDHALTUNG_UNTERDECKUNG",
      empfohleneRuecklageMonatlich: input.instandhaltung.empfohleneRuecklageMonatlich,
      tatsaechlicheRuecklageMonatlich: input.instandhaltung.tatsaechlichMonatlich,
      differenzMonatlich,
    });
  }

  if (input.cashflowNachSteuerMonatlich < 0) {
    argumente.push({
      typ: "CASHFLOW_NEGATIV",
      cashflowNachSteuerMonatlich: input.cashflowNachSteuerMonatlich,
      aktuellerKaufpreis: input.aktuellerKaufpreis,
      breakevenKaufpreis: input.breakevenKaufpreis,
      differenzZuAktuellemKaufpreis: input.differenzZuAktuellemKaufpreis,
    });
  }

  return argumente.sort((a, b) => gewicht(b) - gewicht(a));
}

function gewicht(a: Verhandlungsargument): number {
  if (a.typ === "GEWERK_RISIKO") return a.geschaetzteKostenEuro;
  if (a.typ === "INSTANDHALTUNG_UNTERDECKUNG") return a.differenzMonatlich * 12;
  return Math.abs(a.differenzZuAktuellemKaufpreis ?? a.cashflowNachSteuerMonatlich * 12);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
