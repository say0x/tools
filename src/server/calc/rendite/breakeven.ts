import type { BreakevenResult } from "../types";

/**
 * Sucht per Bisektion den Kaufpreis, bei dem `evaluate(kaufpreis) >= zielwert`
 * gilt (z. B. Cashflow nach Steuer ≥ 0). Kein geschlossener Ausdruck möglich,
 * da Kaufnebenkosten und Darlehenssumme selbst vom Kaufpreis abhängen.
 * Nimmt an, dass die Metrik mit sinkendem Kaufpreis monoton steigt.
 */
export function berechneBreakevenKaufpreis(
  aktuellerKaufpreis: number,
  evaluate: (kaufpreis: number) => number,
  zielwert: number = 0
): BreakevenResult {
  if (evaluate(aktuellerKaufpreis) >= zielwert) {
    return { erreichbar: true, breakevenKaufpreis: aktuellerKaufpreis, differenzZuAktuellemKaufpreis: 0 };
  }

  let lo = 0;
  let hi = aktuellerKaufpreis;

  if (evaluate(lo) < zielwert) {
    return { erreichbar: false, breakevenKaufpreis: null, differenzZuAktuellemKaufpreis: null };
  }

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (evaluate(mid) >= zielwert) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const breakevenKaufpreis = round2(lo);
  return {
    erreichbar: true,
    breakevenKaufpreis,
    differenzZuAktuellemKaufpreis: round2(aktuellerKaufpreis - breakevenKaufpreis),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
