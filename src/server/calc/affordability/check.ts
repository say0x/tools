import type { AffordabilityResult, ProfileInput } from "../types";

export interface AffordabilityInput {
  profile: ProfileInput;
  neueFinanzierungsrateMonatlich: number;
  eigenkapitalEinsatzEuro: number;
}

/** Prüft die geplante Finanzierung gegen die im Profil hinterlegten, konfigurierbaren Schwellen. */
export function berechneAffordability(input: AffordabilityInput): AffordabilityResult {
  const { profile } = input;

  const bestehendeRatenMonatlich = profile.liabilities.reduce((sum, l) => sum + l.monatlicheRate, 0);
  const gesamtrateMonatlich = bestehendeRatenMonatlich + input.neueFinanzierungsrateMonatlich;

  const schuldendienstquoteProzent =
    profile.nettoEinkommenMonatlich > 0
      ? round2((gesamtrateMonatlich / profile.nettoEinkommenMonatlich) * 100)
      : 100;

  const liquiditaetsreserveNachKaufEuro = round2(profile.vorhandenesEigenkapital - input.eigenkapitalEinsatzEuro);

  const begruendung: string[] = [];
  let ampel: AffordabilityResult["ampel"] = "GRUEN";

  if (schuldendienstquoteProzent > profile.maxSchuldendienstquoteProzent) {
    ampel = "ROT";
    begruendung.push(
      `Schuldendienstquote ${schuldendienstquoteProzent}% liegt über der Grenze von ${profile.maxSchuldendienstquoteProzent}%.`
    );
  } else if (schuldendienstquoteProzent > profile.maxSchuldendienstquoteProzent * 0.9) {
    ampel = "GELB";
    begruendung.push(`Schuldendienstquote ${schuldendienstquoteProzent}% nähert sich der Grenze von ${profile.maxSchuldendienstquoteProzent}%.`);
  }

  if (liquiditaetsreserveNachKaufEuro < 0) {
    ampel = "ROT";
    begruendung.push(`Eigenkapital reicht nicht aus, Lücke von ${Math.abs(liquiditaetsreserveNachKaufEuro)} €.`);
  } else if (liquiditaetsreserveNachKaufEuro < profile.mindestLiquiditaetsreserveEuro) {
    if (ampel !== "ROT") ampel = "GELB";
    begruendung.push(
      `Liquiditätsreserve nach Kauf ${liquiditaetsreserveNachKaufEuro} € liegt unter der Mindestreserve von ${profile.mindestLiquiditaetsreserveEuro} €.`
    );
  }

  if (begruendung.length === 0) {
    begruendung.push("Schuldendienstquote und Liquiditätsreserve liegen innerhalb der eingestellten Grenzen.");
  }

  return { schuldendienstquoteProzent, liquiditaetsreserveNachKaufEuro, ampel, begruendung };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
