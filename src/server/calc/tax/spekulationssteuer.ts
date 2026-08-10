import { SPEKULATIONSFRIST_JAHRE } from "../constants";

export interface SpekulationssteuerInput {
  geplant: boolean;
  haltedauerJahre: number;
  anschaffungskostenEuro: number;
  kumulierteAfaEuro: number;
  verkaufspreisEuro: number;
  grenzsteuersatzProzent: number;
}

export interface SpekulationssteuerResult {
  pflichtig: boolean;
  veraeusserungsgewinnEuro: number;
  steuerEuro: number;
}

/** Grobe Näherung: bei Verkauf < 10 Jahre nach Kauf wird der Gewinn aus §23 EStG mit dem Grenzsteuersatz besteuert. */
export function berechneSpekulationssteuer(input: SpekulationssteuerInput): SpekulationssteuerResult {
  const pflichtig = input.geplant && input.haltedauerJahre < SPEKULATIONSFRIST_JAHRE;

  const buchwert = input.anschaffungskostenEuro - input.kumulierteAfaEuro;
  const veraeusserungsgewinnEuro = round2(Math.max(0, input.verkaufspreisEuro - buchwert));

  const steuerEuro = pflichtig
    ? round2(veraeusserungsgewinnEuro * (input.grenzsteuersatzProzent / 100))
    : 0;

  return { pflichtig, veraeusserungsgewinnEuro, steuerEuro };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
