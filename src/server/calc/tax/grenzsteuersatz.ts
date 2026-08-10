import { resolveEstgZone } from "./estg-zonen";

/** Tarifliche Einkommensteuer nach §32a EStG (Grundtabelle) für ein gegebenes zvE. */
export function berechneEinkommensteuer(zvE: number, jahr: number): number {
  const { zone } = resolveEstgZone(jahr);
  const x = Math.max(0, Math.floor(zvE));

  if (x <= zone.grundfreibetrag) return 0;

  if (x <= zone.zone2Ende) {
    const y = (x - zone.grundfreibetrag) / 10000;
    return round2((zone.zone2.a * y + zone.zone2.b) * y);
  }

  if (x <= zone.zone3Ende) {
    const z = (x - zone.zone2Ende) / 10000;
    return round2((zone.zone3.a * z + zone.zone3.b) * z + zone.zone3.c);
  }

  if (x <= zone.zone4Ende) {
    return round2(zone.zone4.satz * x - zone.zone4.abzug);
  }

  return round2(zone.zone5.satz * x - zone.zone5.abzug);
}

/**
 * Grenzsteuersatz: die Steuerbelastung des nächsten Euro zvE, ermittelt über
 * die Ableitung der stückweisen Formel bei kleinem Delta. Praktisch nutzbar,
 * um den Steuereffekt zusätzlicher Immobilien-Erträge/-Verluste abzuschätzen.
 */
export function berechneGrenzsteuersatz(zvE: number, jahr: number): number {
  const delta = 100;
  const steuerBasis = berechneEinkommensteuer(zvE, jahr);
  const steuerPlusDelta = berechneEinkommensteuer(zvE + delta, jahr);
  const satz = (steuerPlusDelta - steuerBasis) / delta;
  return round2(Math.max(0, Math.min(45, satz * 100)));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
