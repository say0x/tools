import { VERMOEGENSVERLAUF_STANDARD_JAHRE } from "../constants";
import type { TilgungsplanJahr } from "../types";

/**
 * Annuitätendarlehen, Jahresraster. Vereinfachende Annahme: konstanter Zins
 * über den gesamten Betrachtungszeitraum (keine Anschlussfinanzierung nach
 * Ablauf der Zinsbindung abgebildet — bewusste Vereinfachung für v1).
 */
export function berechneTilgungsplan(
  darlehenssummeEuro: number,
  zinssatzProzent: number,
  anfaenglicheTilgungProzent: number,
  horizontJahre: number = VERMOEGENSVERLAUF_STANDARD_JAHRE
): TilgungsplanJahr[] {
  const annuitaet = darlehenssummeEuro * ((zinssatzProzent + anfaenglicheTilgungProzent) / 100);
  const jahre: TilgungsplanJahr[] = [];

  let restschuld = darlehenssummeEuro;

  for (let jahr = 1; jahr <= horizontJahre && restschuld > 0.01; jahr++) {
    const restschuldStart = restschuld;
    const zinszahlung = round2(restschuldStart * (zinssatzProzent / 100));
    let tilgungszahlung = round2(annuitaet - zinszahlung);
    if (tilgungszahlung > restschuldStart) tilgungszahlung = restschuldStart;

    const restschuldEnde = round2(Math.max(0, restschuldStart - tilgungszahlung));

    jahre.push({ jahr, restschuldStart, zinszahlung, tilgungszahlung, restschuldEnde });
    restschuld = restschuldEnde;
  }

  // Ist das Darlehen vor Horizontende getilgt, den Rest des Horizonts mit
  // Restschuld 0 auffüllen, damit der Vermögensverlauf-Chart eine durchgehende Reihe hat.
  for (let jahr = jahre.length + 1; jahr <= horizontJahre; jahr++) {
    jahre.push({ jahr, restschuldStart: 0, zinszahlung: 0, tilgungszahlung: 0, restschuldEnde: 0 });
  }

  return jahre;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
