import type { KaufnebenkostenResult, PropertyInput, ReferenceDataSnapshot } from "../types";

const MAKLERPROVISION_DEFAULT_PROZENT = 3.57; // üblicher Käuferanteil inkl. USt., grober Richtwert

/**
 * Berechnet die drei Kaufnebenkosten-Positionen. Jede Position folgt dem
 * computed-with-override-Muster: ist *Override false, wird der Satz aus
 * Referenzdaten/Defaults hergeleitet, sonst gilt der gespeicherte Wert.
 */
export function berechneKaufnebenkosten(
  property: Pick<
    PropertyInput,
    | "kaufpreis"
    | "bundesland"
    | "grunderwerbsteuerProzent"
    | "grunderwerbsteuerOverride"
    | "notarGrundbuchProzent"
    | "notarGrundbuchOverride"
    | "maklerprovisionProzent"
    | "maklerprovisionOverride"
  >,
  referenceData: Pick<ReferenceDataSnapshot, "grunderwerbsteuerByBundesland">
): KaufnebenkostenResult {
  const grunderwerbsteuerProzent = property.grunderwerbsteuerOverride
    ? property.grunderwerbsteuerProzent
    : referenceData.grunderwerbsteuerByBundesland[property.bundesland] ?? 0;

  const notarGrundbuchProzent = property.notarGrundbuchOverride
    ? property.notarGrundbuchProzent
    : 1.75;

  const maklerprovisionProzent = property.maklerprovisionOverride
    ? property.maklerprovisionProzent
    : MAKLERPROVISION_DEFAULT_PROZENT;

  const grunderwerbsteuerEuro = round2(property.kaufpreis * (grunderwerbsteuerProzent / 100));
  const notarGrundbuchEuro = round2(property.kaufpreis * (notarGrundbuchProzent / 100));
  const maklerprovisionEuro = round2(property.kaufpreis * (maklerprovisionProzent / 100));

  return {
    grunderwerbsteuerProzent,
    grunderwerbsteuerEuro,
    notarGrundbuchProzent,
    notarGrundbuchEuro,
    maklerprovisionProzent,
    maklerprovisionEuro,
    summeEuro: round2(grunderwerbsteuerEuro + notarGrundbuchEuro + maklerprovisionEuro),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
