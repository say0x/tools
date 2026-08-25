import type { KapitaleffizienzResult } from "../types";

export interface KapitaleffizienzInput {
  eigenkapitalrenditeProzent: number | null;
  eigenkapitalEinsatzEuro: number;
  mindestEigenkapitalrenditeProzent: number;
  eigenkapitalPruefungAbEuro: number;
}

/**
 * Eigenständiges Signal dafür, ob das eingesetzte Eigenkapital effizient
 * arbeitet — unabhängig von Cashflow und Finanzierbarkeit (die kann bei
 * niedriger EK-Rendite trotzdem grün sein, z.B. wenn viel EK statt eines
 * größeren Kredits eingesetzt wird). Greift bewusst erst ab einer
 * Mindest-EK-Einsatzsumme, da die %-Rendite bei sehr kleinem EK-Einsatz
 * (z.B. nahe 100%-Finanzierung) stark schwankt und wenig aussagekräftig ist.
 */
export function berechneKapitaleffizienz(input: KapitaleffizienzInput): KapitaleffizienzResult {
  const { eigenkapitalrenditeProzent, eigenkapitalEinsatzEuro, mindestEigenkapitalrenditeProzent, eigenkapitalPruefungAbEuro } = input;

  if (eigenkapitalrenditeProzent === null) {
    return {
      ampel: "GRUEN",
      begruendung: [
        `Kein Eigenkapital eingesetzt (${eigenkapitalEinsatzEuro} €) — die EK-Rendite ist damit rechnerisch nicht definiert und wird hier nicht bewertet.`,
      ],
    };
  }

  if (eigenkapitalEinsatzEuro < eigenkapitalPruefungAbEuro) {
    return {
      ampel: "GRUEN",
      begruendung: [
        `EK-Einsatz von ${eigenkapitalEinsatzEuro} € liegt unter der Prüfschwelle von ${eigenkapitalPruefungAbEuro} € — Kapitaleffizienz wird hier nicht separat bewertet.`,
      ],
    };
  }

  if (eigenkapitalrenditeProzent < 0) {
    return {
      ampel: "ROT",
      begruendung: [
        `EK-Rendite ist negativ (${eigenkapitalrenditeProzent}%) — das eingesetzte Eigenkapital (${eigenkapitalEinsatzEuro} €) verliert nach Steuer real Geld, unabhängig vom Cashflow-Vorzeichen.`,
      ],
    };
  }

  if (eigenkapitalrenditeProzent < mindestEigenkapitalrenditeProzent) {
    return {
      ampel: "GELB",
      begruendung: [
        `EK-Rendite von ${eigenkapitalrenditeProzent}% liegt unter deiner Mindestschwelle von ${mindestEigenkapitalrenditeProzent}% — bei ${eigenkapitalEinsatzEuro} € EK-Einsatz ist das Kapital vergleichsweise ineffizient gebunden (z.B. mehr Fremdfinanzierung oder weniger EK könnten die Rendite verbessern).`,
      ],
    };
  }

  return {
    ampel: "GRUEN",
    begruendung: [`EK-Rendite von ${eigenkapitalrenditeProzent}% liegt über deiner Mindestschwelle von ${mindestEigenkapitalrenditeProzent}%.`],
  };
}
