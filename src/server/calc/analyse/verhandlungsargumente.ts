import { ZUSTANDSFAKTOR } from "../constants";
import type {
  EigentumsTyp,
  GewerkKostenResult,
  Gewerk,
  InstandhaltungResultForCalc,
  Lagetyp,
  Objekttyp,
  ReferenceDataSnapshot,
} from "../types";

const ZUSTAND_RISIKO_SCHWELLE = 5; // "schlecht" (5) oder "sehr schlecht" (6)
const INSTANDHALTUNG_UNTERDECKUNG_SCHWELLE_EURO = 20; // Bagatellgrenze gegen Rundungsrauschen
const KAUFPREISFAKTOR_ABWEICHUNG_SCHWELLE_PROZENT = 10; // ab wann die Abweichung als Argument zählt

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

export interface VerhandlungsargumentKaufpreisfaktorUeberReferenz {
  typ: "KAUFPREISFAKTOR_UEBER_REFERENZ";
  objekttyp: Objekttyp;
  lagetyp: Lagetyp;
  kaufpreisfaktorAktuell: number;
  kaufpreisfaktorReferenz: number;
  abweichungProzent: number;
  bruttomietrenditeAktuellProzent: number;
  bruttomietrenditeReferenzProzent: number;
  aktuellerKaufpreis: number;
  fairerKaufpreisEuro: number;
}

export interface VerhandlungsargumentGewerkAlter {
  typ: "GEWERK_ALTER";
  gewerk: Gewerk;
  eigentumsTyp: EigentumsTyp;
  baujahr: number;
  alterJahre: number;
  nutzungsdauerJahre: number;
  jahreUeberNutzungsdauer: number;
}

export type Verhandlungsargument =
  | VerhandlungsargumentGewerkRisiko
  | VerhandlungsargumentInstandhaltungUnterdeckung
  | VerhandlungsargumentCashflowNegativ
  | VerhandlungsargumentKaufpreisfaktorUeberReferenz
  | VerhandlungsargumentGewerkAlter;

export interface VerhandlungsargumenteInput {
  gewerkePosten: GewerkKostenResult[];
  gewerkKostenReferenz: ReferenceDataSnapshot["gewerkKosten"];
  nutzungsdauerJahreByGewerk: ReferenceDataSnapshot["nutzungsdauerJahreByGewerk"];
  wohnflaeche: number;
  instandhaltung: InstandhaltungResultForCalc;
  cashflowNachSteuerMonatlich: number;
  aktuellerKaufpreis: number;
  breakevenKaufpreis: number | null;
  differenzZuAktuellemKaufpreis: number | null;
  objekttyp: Objekttyp;
  lagetyp: Lagetyp;
  kaufpreisfaktorAktuell: number;
  bruttomietrenditeAktuellProzent: number;
  jahreskaltmiete: number;
  kaufpreisfaktorReferenzByObjekttypLagetyp: ReferenceDataSnapshot["kaufpreisfaktorReferenzByObjekttypLagetyp"];
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
    if (posten.zustand >= ZUSTAND_RISIKO_SCHWELLE) {
      const kosten = input.gewerkKostenReferenz[posten.gewerk];
      if (kosten) {
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
    } else if (posten.baujahr != null && posten.alterJahre != null) {
      // Nur relevant, wenn der Zustand selbst noch keinen GEWERK_RISIKO-Eintrag ausgelöst hat
      // (sonst doppelte Meldung für dasselbe Gewerk).
      const nutzungsdauerJahre = input.nutzungsdauerJahreByGewerk[posten.gewerk];
      if (nutzungsdauerJahre && posten.alterJahre > nutzungsdauerJahre) {
        argumente.push({
          typ: "GEWERK_ALTER",
          gewerk: posten.gewerk,
          eigentumsTyp: posten.eigentumsTyp,
          baujahr: posten.baujahr,
          alterJahre: posten.alterJahre,
          nutzungsdauerJahre,
          jahreUeberNutzungsdauer: posten.alterJahre - nutzungsdauerJahre,
        });
      }
    }
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

  const kaufpreisfaktorReferenz =
    input.kaufpreisfaktorReferenzByObjekttypLagetyp[`${input.objekttyp}:${input.lagetyp}`];
  if (
    kaufpreisfaktorReferenz &&
    kaufpreisfaktorReferenz > 0 &&
    input.kaufpreisfaktorAktuell > kaufpreisfaktorReferenz * (1 + KAUFPREISFAKTOR_ABWEICHUNG_SCHWELLE_PROZENT / 100)
  ) {
    argumente.push({
      typ: "KAUFPREISFAKTOR_UEBER_REFERENZ",
      objekttyp: input.objekttyp,
      lagetyp: input.lagetyp,
      kaufpreisfaktorAktuell: input.kaufpreisfaktorAktuell,
      kaufpreisfaktorReferenz,
      abweichungProzent: round1((input.kaufpreisfaktorAktuell / kaufpreisfaktorReferenz - 1) * 100),
      bruttomietrenditeAktuellProzent: input.bruttomietrenditeAktuellProzent,
      bruttomietrenditeReferenzProzent: round2(100 / kaufpreisfaktorReferenz),
      aktuellerKaufpreis: input.aktuellerKaufpreis,
      fairerKaufpreisEuro: round2(kaufpreisfaktorReferenz * input.jahreskaltmiete),
    });
  }

  return argumente.sort((a, b) => gewicht(b) - gewicht(a));
}

function gewicht(a: Verhandlungsargument): number {
  if (a.typ === "GEWERK_RISIKO") return a.geschaetzteKostenEuro;
  if (a.typ === "INSTANDHALTUNG_UNTERDECKUNG") return a.differenzMonatlich * 12;
  if (a.typ === "KAUFPREISFAKTOR_UEBER_REFERENZ") return Math.abs(a.aktuellerKaufpreis - a.fairerKaufpreisEuro);
  if (a.typ === "GEWERK_ALTER") return a.jahreUeberNutzungsdauer * 500; // grobe Vergleichsskala zu den €-basierten Gewichten
  return Math.abs(a.differenzZuAktuellemKaufpreis ?? a.cashflowNachSteuerMonatlich * 12);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
