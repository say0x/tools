import type { KaufnebenkostenResult, PropertyInput, ReferenceDataSnapshot } from "../types";

const MAKLERPROVISION_DEFAULT_PROZENT = 3.57; // üblicher Käuferanteil inkl. USt., grober Richtwert

/**
 * Berechnet die vier Kaufnebenkosten-Positionen (Grunderwerbsteuer, Notar,
 * Grundbuch, Makler). Jede Position folgt dem computed-with-override-Muster:
 * ist *Override false, wird der Satz aus Referenzdaten/Defaults hergeleitet,
 * sonst gilt der gespeicherte Wert.
 */
export function berechneKaufnebenkosten(
  property: Pick<
    PropertyInput,
    | "kaufpreis"
    | "bundesland"
    | "grunderwerbsteuerProzent"
    | "grunderwerbsteuerOverride"
    | "notarProzent"
    | "notarOverride"
    | "grundbuchProzent"
    | "grundbuchOverride"
    | "maklerprovisionProzent"
    | "maklerprovisionOverride"
  >,
  referenceData: Pick<ReferenceDataSnapshot, "grunderwerbsteuerByBundesland" | "notarProzentDefault" | "grundbuchProzentDefault">
): KaufnebenkostenResult {
  const grunderwerbsteuerProzent = property.grunderwerbsteuerOverride
    ? property.grunderwerbsteuerProzent
    : referenceData.grunderwerbsteuerByBundesland[property.bundesland] ?? 0;

  const notarProzent = property.notarOverride ? property.notarProzent : referenceData.notarProzentDefault;

  const grundbuchProzent = property.grundbuchOverride ? property.grundbuchProzent : referenceData.grundbuchProzentDefault;

  const maklerprovisionProzent = property.maklerprovisionOverride
    ? property.maklerprovisionProzent
    : MAKLERPROVISION_DEFAULT_PROZENT;

  const grunderwerbsteuerEuro = round2(property.kaufpreis * (grunderwerbsteuerProzent / 100));
  const notarEuro = round2(property.kaufpreis * (notarProzent / 100));
  const grundbuchEuro = round2(property.kaufpreis * (grundbuchProzent / 100));
  const maklerprovisionEuro = round2(property.kaufpreis * (maklerprovisionProzent / 100));

  return {
    grunderwerbsteuerProzent,
    grunderwerbsteuerEuro,
    notarProzent,
    notarEuro,
    grundbuchProzent,
    grundbuchEuro,
    maklerprovisionProzent,
    maklerprovisionEuro,
    summeEuro: round2(grunderwerbsteuerEuro + notarEuro + grundbuchEuro + maklerprovisionEuro),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
