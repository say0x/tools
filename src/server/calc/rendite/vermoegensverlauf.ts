import type { RenditeKennzahlen, TilgungsplanJahr, VermoegensverlaufJahr } from "../types";

export interface VermoegensverlaufInput {
  kaufpreis: number;
  wertsteigerungProzentJaehrlich: number;
  kostensteigerungProzentJaehrlich: number;
  tilgungsplan: TilgungsplanJahr[];
  rendite: RenditeKennzahlen;
  mietsteigerungProzentJaehrlich: number;
}

/**
 * Jahresreihe für den Vermögensverlauf-Chart. Miete und laufende Kosten
 * werden mit getrennten Raten fortgeschrieben (Mietsteigerung bzw.
 * Kostensteigerung/Inflation), die Finanzierungsrate stammt Jahr für Jahr
 * aus dem tatsächlichen Tilgungsplan (kein pauschaler Wachstumsfaktor auf
 * den gesamten Cashflow mehr). Vereinfachungen, die bleiben: der
 * Grenzsteuersatz und die AfA werden über die gesamte Laufzeit konstant
 * gehalten, eine Anschlussfinanzierung nach Ablauf der Zinsbindung wird
 * nicht simuliert (Zins bleibt konstant).
 */
export function berechneVermoegensverlauf(input: VermoegensverlaufInput): VermoegensverlaufJahr[] {
  let kumulierterCashflowVorSteuer = 0;
  let kumulierterCashflowNachSteuer = 0;

  return input.tilgungsplan.map((jahr) => {
    const immobilienwert = round2(
      input.kaufpreis * Math.pow(1 + input.wertsteigerungProzentJaehrlich / 100, jahr.jahr)
    );
    const restschuld = jahr.restschuldEnde;
    const eigenkapitalanteil = round2(immobilienwert - restschuld);

    const inflationsfaktor = Math.pow(1 + input.kostensteigerungProzentJaehrlich / 100, jahr.jahr);
    const immobilienwertReal = round2(immobilienwert / inflationsfaktor);
    const eigenkapitalanteilReal = round2(eigenkapitalanteil / inflationsfaktor);

    const mietWachstumsfaktor = Math.pow(1 + input.mietsteigerungProzentJaehrlich / 100, jahr.jahr - 1);
    const kostenWachstumsfaktor = Math.pow(1 + input.kostensteigerungProzentJaehrlich / 100, jahr.jahr - 1);

    const mieteJahr = input.rendite.effektiveJahresmiete * mietWachstumsfaktor;
    const kostenJahr = input.rendite.laufendeKostenJaehrlich * kostenWachstumsfaktor;
    const finanzierungsrateJahr = jahr.zinszahlung + jahr.tilgungszahlung;

    const cashflowVorSteuerJahr = round2(mieteJahr - kostenJahr - finanzierungsrateJahr);

    const steuerlichesErgebnisJahr = mieteJahr - kostenJahr - jahr.zinszahlung - input.rendite.afaJaehrlich;
    const steuerJahr = steuerlichesErgebnisJahr * (input.rendite.grenzsteuersatzProzent / 100);
    const cashflowNachSteuerJahr = round2(cashflowVorSteuerJahr - steuerJahr);

    kumulierterCashflowVorSteuer = round2(kumulierterCashflowVorSteuer + cashflowVorSteuerJahr);
    kumulierterCashflowNachSteuer = round2(kumulierterCashflowNachSteuer + cashflowNachSteuerJahr);

    return {
      jahr: jahr.jahr,
      restschuld,
      immobilienwert,
      eigenkapitalanteil,
      immobilienwertReal,
      eigenkapitalanteilReal,
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
