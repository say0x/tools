/**
 * €/Monat ↔ €/m²-Umrechnung. Der kanonische, gespeicherte Wert ist immer der
 * absolute Betrag; €/m² ist rein abgeleitet, aber bidirektional editierbar.
 */
export function euroZuProM2(absolut: number, wohnflaeche: number): number {
  if (!wohnflaeche || wohnflaeche <= 0) return 0;
  return round2(absolut / wohnflaeche);
}

export function proM2ZuEuro(proM2: number, wohnflaeche: number): number {
  return round2(proM2 * (wohnflaeche || 0));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
