// Grobe Schätzung des zu versteuernden Einkommens (zvE) aus dem Brutto-
// Jahreseinkommen für Arbeitnehmer ohne weitere Angaben — Pauschbeträge statt
// einer echten Veranlagung. Nur eine Näherung für den Grenzsteuersatz in der
// Investitionsrechnung, keine Steuererklärung. Das echte zvE (z. B. aus dem
// Steuerbescheid) ist über den Override immer genauer.

const WERBUNGSKOSTEN_PAUSCHALE = 1230; // §9a EStG, Arbeitnehmer-Pauschbetrag (Stand 2024)
const SONDERAUSGABEN_PAUSCHALE = 36; // §10c EStG, Einzelveranlagung
const VORSORGEAUFWENDUNGEN_SCHAETZUNG_PROZENT = 20; // grobe Näherung: RV+KV+PV+AV-Arbeitnehmeranteil

export function schaetzeZvEAusBrutto(bruttoJaehrlich: number): number {
  const vorsorgeaufwendungen = bruttoJaehrlich * (VORSORGEAUFWENDUNGEN_SCHAETZUNG_PROZENT / 100);
  const zvE = bruttoJaehrlich - WERBUNGSKOSTEN_PAUSCHALE - SONDERAUSGABEN_PAUSCHALE - vorsorgeaufwendungen;
  return round2(Math.max(0, zvE));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
