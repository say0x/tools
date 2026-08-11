import { VERMOEGENSVERLAUF_MAX_JAHRE } from "../constants";
import type { TilgungsplanJahr } from "../types";

/**
 * Annuitätendarlehen, Jahresraster. Nach Ablauf der Zinsbindung (zinsbindungJahre)
 * wird EINMALIG eine Anschlussfinanzierung simuliert: neuer Zins = zinssatzProzent
 * + anschlusszinsAufschlagProzent, die Annuität wird mit gleichem Tilgungssatz auf
 * die dann aktuelle Restschuld neu berechnet. Vereinfachende Annahme: nur dieser
 * eine Zinssprung wird abgebildet, keine wiederkehrende Anschlussfinanzierung bei
 * mehrfachem Zinsbindungsablauf innerhalb des Betrachtungszeitraums.
 */
export function berechneTilgungsplan(
  darlehenssummeEuro: number,
  zinssatzProzent: number,
  anfaenglicheTilgungProzent: number,
  horizontJahre: number = VERMOEGENSVERLAUF_MAX_JAHRE,
  zinsbindungJahre: number = Infinity,
  anschlusszinsAufschlagProzent: number = 0
): TilgungsplanJahr[] {
  const jahre: TilgungsplanJahr[] = [];

  let restschuld = darlehenssummeEuro;
  let zinssatzAktuell = zinssatzProzent;
  let annuitaet = darlehenssummeEuro * ((zinssatzProzent + anfaenglicheTilgungProzent) / 100);

  for (let jahr = 1; jahr <= horizontJahre && restschuld > 0.01; jahr++) {
    // Annuität nur neu ansetzen, wenn sich der Zins tatsächlich ändert — bei
    // Aufschlag 0 bleibt der Tilgungsplan sonst identisch zum durchgehenden
    // Darlehen (kein künstlicher Knick durch bloßes Neu-Ansetzen der Formel).
    if (jahr === zinsbindungJahre + 1 && anschlusszinsAufschlagProzent !== 0) {
      zinssatzAktuell = zinssatzProzent + anschlusszinsAufschlagProzent;
      annuitaet = restschuld * ((zinssatzAktuell + anfaenglicheTilgungProzent) / 100);
    }

    const restschuldStart = restschuld;
    const zinszahlung = round2(restschuldStart * (zinssatzAktuell / 100));
    let tilgungszahlung = round2(annuitaet - zinszahlung);
    if (tilgungszahlung > restschuldStart) tilgungszahlung = restschuldStart;

    const restschuldEnde = round2(Math.max(0, restschuldStart - tilgungszahlung));

    jahre.push({ jahr, restschuldStart, zinszahlung, tilgungszahlung, restschuldEnde, zinssatzProzent: zinssatzAktuell });
    restschuld = restschuldEnde;
  }

  // Ist das Darlehen vor Horizontende getilgt, den Rest des Horizonts mit
  // Restschuld 0 auffüllen, damit der Vermögensverlauf-Chart eine durchgehende Reihe hat.
  for (let jahr = jahre.length + 1; jahr <= horizontJahre; jahr++) {
    jahre.push({ jahr, restschuldStart: 0, zinszahlung: 0, tilgungszahlung: 0, restschuldEnde: 0, zinssatzProzent: 0 });
  }

  return jahre;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
