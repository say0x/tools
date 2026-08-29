import { VERMOEGENSVERLAUF_MAX_JAHRE } from "../constants";
import type { TilgungsplanJahr } from "../types";

/**
 * Annuitätendarlehen, Jahresraster. Nach jedem Ablauf der Zinsbindung (zinsbindungJahre,
 * 2×zinsbindungJahre, 3×zinsbindungJahre, …) wird eine Anschlussfinanzierung simuliert:
 * der Zins steigt gegenüber dem zuletzt gültigen Zins erneut um anschlusszinsAufschlagProzent
 * (kumulativ über mehrere Zinsbindungsabläufe hinweg — dieselbe "künftiger Zins unbekannt,
 * X Prozentpunkte mehr"-Annahme wird bei jeder Anschlussfinanzierung erneut angewandt), die
 * Annuität wird mit gleichem Tilgungssatz auf die dann aktuelle Restschuld neu berechnet.
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
    // Zinsbindungsablauf: jahr = zinsbindungJahre+1, dann erneut alle zinsbindungJahre
    // Jahre danach (2×+1, 3×+1, …). Number.isFinite schließt den Default Infinity aus,
    // ohne den (jahr - zinsbindungJahre - 1) % zinsbindungJahre-Ausdruck mit Infinity
    // auszuwerten (JS-Modulo mit Infinity wäre zwar wohldefiniert, aber unnötig fragil).
    const istZinsbindungsablauf =
      Number.isFinite(zinsbindungJahre) &&
      zinsbindungJahre > 0 &&
      jahr > zinsbindungJahre &&
      (jahr - zinsbindungJahre - 1) % zinsbindungJahre === 0;

    // Annuität nur neu ansetzen, wenn sich der Zins tatsächlich ändert — bei
    // Aufschlag 0 bleibt der Tilgungsplan sonst identisch zum durchgehenden
    // Darlehen (kein künstlicher Knick durch bloßes Neu-Ansetzen der Formel).
    if (istZinsbindungsablauf && anschlusszinsAufschlagProzent !== 0) {
      zinssatzAktuell = zinssatzAktuell + anschlusszinsAufschlagProzent;
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
