import { berechneSpekulationssteuer, type SpekulationssteuerResult } from "../tax/spekulationssteuer";
import type { VermoegensverlaufJahr } from "../types";

export interface ExitSzenarioInput {
  geplant: boolean;
  haltedauerJahre: number;
  vermoegensverlauf: VermoegensverlaufJahr[];
  anschaffungskostenEuro: number;
  afaJaehrlich: number;
  grenzsteuersatzProzent: number;
}

export interface ExitSzenarioResult {
  haltedauerJahre: number;
  verkaufspreisEuro: number;
  restschuldEuro: number;
  erloesVorSteuerEuro: number;
  kumulierteAfaEuro: number;
  spekulationssteuer: SpekulationssteuerResult;
  erloesNachSteuerEuro: number;
}

/**
 * Bewertet den geplanten Verkauf am Ende der Haltedauer: Verkaufspreis und
 * Restschuld werden dem Vermögensverlauf-Zieljahr entnommen, der
 * Veräußerungsgewinn und die Spekulationssteuer (§23 EStG) daraus
 * abgeleitet. Referenz: docs/tools/immobilien-rechner.md
 */
export function berechneExitSzenario(input: ExitSzenarioInput): ExitSzenarioResult | null {
  if (!input.geplant || input.haltedauerJahre <= 0) return null;

  const index = Math.min(input.haltedauerJahre, input.vermoegensverlauf.length) - 1;
  const jahr = input.vermoegensverlauf[index];
  if (!jahr) return null;

  const kumulierteAfaEuro = round2(input.afaJaehrlich * input.haltedauerJahre);

  const spekulationssteuer = berechneSpekulationssteuer({
    geplant: input.geplant,
    haltedauerJahre: input.haltedauerJahre,
    anschaffungskostenEuro: input.anschaffungskostenEuro,
    kumulierteAfaEuro,
    verkaufspreisEuro: jahr.immobilienwert,
    grenzsteuersatzProzent: input.grenzsteuersatzProzent,
  });

  const erloesVorSteuerEuro = round2(jahr.immobilienwert - jahr.restschuld);
  const erloesNachSteuerEuro = round2(erloesVorSteuerEuro - spekulationssteuer.steuerEuro);

  return {
    haltedauerJahre: input.haltedauerJahre,
    verkaufspreisEuro: jahr.immobilienwert,
    restschuldEuro: jahr.restschuld,
    erloesVorSteuerEuro,
    kumulierteAfaEuro,
    spekulationssteuer,
    erloesNachSteuerEuro,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
