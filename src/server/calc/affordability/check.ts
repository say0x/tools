import type { AffordabilityResult, ProfileInput } from "../types";

export interface AffordabilityInput {
  profile: ProfileInput;
  neueFinanzierungsrateMonatlich: number;
  eigenkapitalEinsatzEuro: number;
  /** Erwartete Nettomiete des Objekts (€/Monat, nach Leerstand), Basis für die Mietanrechnung der Bank. */
  mieteinnahmenMonatlich: number;
}

/** Prüft die geplante Finanzierung gegen die im Profil hinterlegten, konfigurierbaren Schwellen. */
export function berechneAffordability(input: AffordabilityInput): AffordabilityResult {
  const { profile } = input;

  const bestehendeRatenMonatlich = profile.liabilities.reduce((sum, l) => sum + l.monatlicheRate, 0);
  const gesamtrateMonatlich = bestehendeRatenMonatlich + input.neueFinanzierungsrateMonatlich;

  const angerechneteMieteMonatlich = round2(input.mieteinnahmenMonatlich * (profile.mietanrechnungProzent / 100));
  const nettoEinkommenMitMieteMonatlich = profile.nettoEinkommenMonatlich + angerechneteMieteMonatlich;

  const schuldendienstquoteProzent =
    nettoEinkommenMitMieteMonatlich > 0
      ? round2((gesamtrateMonatlich / nettoEinkommenMitMieteMonatlich) * 100)
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

  if (angerechneteMieteMonatlich > 0) {
    begruendung.push(
      `Davon ${angerechneteMieteMonatlich} € durch angerechnete Mieteinnahmen (${profile.mietanrechnungProzent}% von ${round2(input.mieteinnahmenMonatlich)} €) gedeckt.`
    );
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

  return { schuldendienstquoteProzent, liquiditaetsreserveNachKaufEuro, angerechneteMieteMonatlich, ampel, begruendung };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
