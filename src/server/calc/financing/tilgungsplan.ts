import { VERMOEGENSVERLAUF_MAX_JAHRE } from "../constants";
import type { TilgungsplanJahr } from "../types";

/**
 * Annuitätendarlehen, Jahresraster. Nach Ablauf der Zinsbindung (zinsbindungJahre)
 * wird EINMALIG eine Anschlussfinanzierung simuliert: neuer Zins = zinssatzProzent
 * + anschlusszinsAufschlagProzent, die Annuität wird mit gleichem Tilgungssatz auf
 * die dann aktuelle Restschuld neu berechnet. Vereinfachende Annahme: nur dieser
 * eine Zinssprung wird abgebildet, keine wiederkehrende Anschlussfinanzierung bei
 * mehrfachem Zinsbindungsablauf innerhalb des Betrachtungszeitraums.
 *
 * Zusätzlich kann eine jährliche Sondertilgung angesetzt werden: ein fester
 * Betrag (sondertilgungProzent % der URSPRÜNGLICHEN Darlehenssumme — die
 * übliche vertragliche Definition des Sondertilgungsrechts, nicht % der
 * jeweils aktuellen Restschuld) wird jedes Jahr zusätzlich zur regulären
 * Tilgung vom Restschuld abgezogen. sondertilgungProzent wird defensiv auf
 * sondertilgungMaxProzent gedeckelt, auch wenn das bereits auf Schema-Ebene
 * validiert sein sollte. Die Sondertilgung fließt NICHT in tilgungszahlung
 * ein (separates Feld sondertilgungBetrag) und wirkt sich damit bewusst
 * nicht auf die laufende Cashflow-/Schuldendienst-Berechnung aus — sie wird
 * wie eine zusätzliche Kapitaleinlage behandelt, nicht wie eine laufende
 * Kostenposition.
 */
export function berechneTilgungsplan(
  darlehenssummeEuro: number,
  zinssatzProzent: number,
  anfaenglicheTilgungProzent: number,
  horizontJahre: number = VERMOEGENSVERLAUF_MAX_JAHRE,
  zinsbindungJahre: number = Infinity,
  anschlusszinsAufschlagProzent: number = 0,
  sondertilgungProzent: number = 0,
  sondertilgungMaxProzent: number = 100
): TilgungsplanJahr[] {
  const jahre: TilgungsplanJahr[] = [];

  const sondertilgungProzentEffektiv = Math.min(Math.max(0, sondertilgungProzent), Math.max(0, sondertilgungMaxProzent));
  const sondertilgungBetragJahr = round2(darlehenssummeEuro * (sondertilgungProzentEffektiv / 100));

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

    const sondertilgungBetrag = round2(Math.min(sondertilgungBetragJahr, Math.max(0, restschuldStart - tilgungszahlung)));

    const restschuldEnde = round2(Math.max(0, restschuldStart - tilgungszahlung - sondertilgungBetrag));

    jahre.push({ jahr, restschuldStart, zinszahlung, tilgungszahlung, restschuldEnde, zinssatzProzent: zinssatzAktuell, sondertilgungBetrag });
    restschuld = restschuldEnde;
  }

  // Ist das Darlehen vor Horizontende getilgt, den Rest des Horizonts mit
  // Restschuld 0 auffüllen, damit der Vermögensverlauf-Chart eine durchgehende Reihe hat.
  for (let jahr = jahre.length + 1; jahr <= horizontJahre; jahr++) {
    jahre.push({ jahr, restschuldStart: 0, zinszahlung: 0, tilgungszahlung: 0, restschuldEnde: 0, zinssatzProzent: 0, sondertilgungBetrag: 0 });
  }

  return jahre;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
