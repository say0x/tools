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
 * Mietsteigerung wird pauschal auf den gesamten Cashflow (vor wie nach
 * Steuer) angewandt (Kosten werden nicht separat fortgeschrieben) — für
 * einen groben Trendverlauf ausreichend, keine exakte Prognose.
 */
export function berechneVermoegensverlauf(input: VermoegensverlaufInput): VermoegensverlaufJahr[] {
  const wertsteigerungProzent = input.exit.geplant ? input.exit.wertsteigerungProzentJaehrlich : 0;

  let kumulierterCashflowVorSteuer = 0;
  let kumulierterCashflowNachSteuer = 0;

  return input.tilgungsplan.map((jahr) => {
    const immobilienwert = round2(
      input.kaufpreis * Math.pow(1 + wertsteigerungProzent / 100, jahr.jahr)
    );
    const restschuld = jahr.restschuldEnde;
    const eigenkapitalanteil = round2(immobilienwert - restschuld);

    const wachstumsfaktor = Math.pow(1 + input.mietsteigerungProzentJaehrlich / 100, jahr.jahr - 1);
    const cashflowVorSteuerJahr = round2(input.rendite.monatlicherCashflowVorSteuer * 12 * wachstumsfaktor);
    const cashflowNachSteuerJahr = round2(input.rendite.monatlicherCashflowNachSteuer * 12 * wachstumsfaktor);

    kumulierterCashflowVorSteuer = round2(kumulierterCashflowVorSteuer + cashflowVorSteuerJahr);
    kumulierterCashflowNachSteuer = round2(kumulierterCashflowNachSteuer + cashflowNachSteuerJahr);

    return {
      jahr: jahr.jahr,
      restschuld,
      immobilienwert,
      eigenkapitalanteil,
      cashflowVorSteuerJahr,
      cashflowNachSteuerJahr,
      kumulierterCashflowVorSteuer,
      kumulierterCashflowNachSteuer,
    };
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
