import { resolveSoliFreigrenze } from "./soli-werte";

/**
 * Solidaritätszuschlag (5,5 % der Einkommensteuer) — seit 2021 nur noch für
 * Einkommen oberhalb der Freigrenze. In der Milderungszone direkt oberhalb der
 * Freigrenze wird er schrittweise statt sprunghaft fällig: höchstens 11,9 %
 * des Betrags über der Freigrenze, gedeckelt auf die vollen 5,5 % der
 * Einkommensteuer. Nur Grundtabelle (Einzelveranlagung) — Splitting/
 * Ehegattenveranlagung wird hier nicht modelliert.
 */
export function berechneSolidaritaetszuschlag(einkommensteuer: number, jahr: number): number {
  const { freigrenze } = resolveSoliFreigrenze(jahr);
  if (einkommensteuer <= freigrenze) return 0;

  const milderungszone = 0.119 * (einkommensteuer - freigrenze);
  const vollerSatz = 0.055 * einkommensteuer;
  return round2(Math.min(milderungszone, vollerSatz));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
