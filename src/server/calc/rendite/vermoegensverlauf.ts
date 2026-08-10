import type { PropertyExitInput, RenditeKennzahlen, TilgungsplanJahr, VermoegensverlaufJahr } from "../types";

export interface VermoegensverlaufInput {
  kaufpreis: number;
  exit: PropertyExitInput;
  tilgungsplan: TilgungsplanJahr[];
  rendite: RenditeKennzahlen;
  mietsteigerungProzentJaehrlich: number;
}

/**
 * Jahresreihe für den Vermögensverlauf-Chart. Vereinfachung: die
 * Mietsteigerung wird pauschal auf den gesamten Nach-Steuer-Cashflow
 * angewandt (Kosten werden nicht separat fortgeschrieben) — für einen
 * groben Trendverlauf ausreichend, keine exakte Prognose.
 */
export function berechneVermoegensverlauf(input: VermoegensverlaufInput): VermoegensverlaufJahr[] {
  const wertsteigerungProzent = input.exit.geplant ? input.exit.wertsteigerungProzentJaehrlich : 0;

  let kumulierterCashflow = 0;

  return input.tilgungsplan.map((jahr) => {
    const immobilienwert = round2(
      input.kaufpreis * Math.pow(1 + wertsteigerungProzent / 100, jahr.jahr)
    );
    const restschuld = jahr.restschuldEnde;
    const eigenkapitalanteil = round2(immobilienwert - restschuld);

    const cashflowJahr =
      input.rendite.monatlicherCashflowNachSteuer *
      12 *
      Math.pow(1 + input.mietsteigerungProzentJaehrlich / 100, jahr.jahr - 1);
    kumulierterCashflow = round2(kumulierterCashflow + cashflowJahr);

    return {
      jahr: jahr.jahr,
      restschuld,
      immobilienwert,
      eigenkapitalanteil,
      kumulierterCashflow,
    };
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
