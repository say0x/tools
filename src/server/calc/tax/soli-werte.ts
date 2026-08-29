// Freigrenzen des Solidaritätszuschlags, Jahr für Jahr gepflegt (analog zu
// estg-zonen.ts) — nur die Grundtabelle (Einzelveranlagung), da dieser
// Rechner keine Splittingtabelle/Ehegattenveranlagung modelliert.
//
// WICHTIG: Werte vor produktivem Einsatz gegen die aktuelle BMF-Veröffentlichung
// verifizieren — Steuerjahre ohne Eintrag fallen auf das jüngste bekannte Jahr
// zurück (siehe soli.ts), was für eine grobe Näherung reicht, aber keine
// Steuerberatung ersetzt.

export const SOLI_FREIGRENZEN: Record<number, number> = {
  2024: 18130,
  2025: 19950,
  2026: 20350,
};

export function resolveSoliFreigrenze(jahr: number): { jahr: number; freigrenze: number } {
  if (SOLI_FREIGRENZEN[jahr] != null) return { jahr, freigrenze: SOLI_FREIGRENZEN[jahr] };
  const jahre = Object.keys(SOLI_FREIGRENZEN).map(Number).sort((a, b) => a - b);
  const naechstes = jahre.filter((j) => j <= jahr).pop() ?? jahre[jahre.length - 1];
  return { jahr: naechstes, freigrenze: SOLI_FREIGRENZEN[naechstes] };
}
