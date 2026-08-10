import type { FinanzierungResult, PropertyFinancingInput } from "../types";

export interface GesamtinvestitionInput {
  kaufpreis: number;
  kaufnebenkostenEuro: number;
  sofortinvestitionEuro: number;
}

export function berechneGesamtinvestition(input: GesamtinvestitionInput): number {
  return round2(input.kaufpreis + input.kaufnebenkostenEuro + input.sofortinvestitionEuro);
}

/**
 * Leitet die Darlehenssumme aus der gewählten Finanzierungsart ab.
 * - FINANZIERUNG_100: Bank finanziert nur den Kaufpreis, EK deckt Nebenkosten + Sofortinvestition.
 * - FINANZIERUNG_110: Bank finanziert Kaufpreis + Kaufnebenkosten, EK deckt nur die Sofortinvestition.
 * - MANUELL: Darlehen = Gesamtinvestition − (Gesamtinvestition × EK-Quote).
 */
export function berechneFinanzierung(
  financing: PropertyFinancingInput,
  gesamtinvestitionInput: GesamtinvestitionInput
): FinanzierungResult {
  const gesamtinvestitionEuro = berechneGesamtinvestition(gesamtinvestitionInput);
  const { kaufpreis, kaufnebenkostenEuro } = gesamtinvestitionInput;

  let darlehenssummeEuro: number;

  switch (financing.finanzierungsart) {
    case "FINANZIERUNG_100":
      darlehenssummeEuro = kaufpreis;
      break;
    case "FINANZIERUNG_110":
      darlehenssummeEuro = kaufpreis + kaufnebenkostenEuro;
      break;
    case "MANUELL":
    default: {
      const ekQuote = (financing.eigenkapitalquoteManuellProzent ?? 20) / 100;
      darlehenssummeEuro = gesamtinvestitionEuro * (1 - ekQuote);
      break;
    }
  }

  darlehenssummeEuro = round2(Math.max(0, darlehenssummeEuro));
  const eigenkapitalEinsatzEuro = round2(Math.max(0, gesamtinvestitionEuro - darlehenssummeEuro));

  return { gesamtinvestitionEuro, darlehenssummeEuro, eigenkapitalEinsatzEuro };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
