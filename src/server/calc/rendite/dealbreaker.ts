import type { BreakevenResult, VermoegensverlaufJahr } from "../types";

export interface DealBreakerInput {
  /** Jahresreihe ab Jahr 1, chronologisch — liefert cashflowNachSteuerJahr pro Jahr für die Trendprüfung. */
  vermoegensverlauf: VermoegensverlaufJahr[];
  effektiveKaltmieteMonatlich: number;
  affordabilityAmpel: "GRUEN" | "GELB" | "ROT";
  /** Max. Anteil der Kaltmiete, den der Cashflow nach Steuer in Jahr 1 im Minus sein darf. */
  cashflowStartverlustMaxProzentKaltmiete: number;
  /** Jahr, bis zu dem der Cashflow nach Steuer spätestens positiv sein muss. */
  cashflowUmschlagjahr: number;
  /** Für die Meldung, falls der Jahr-1-Verlust zu groß ist: bei welchem Kaufpreis wäre Jahr 1 ausgeglichen. */
  breakeven: BreakevenResult;
  aktuellerKaufpreis: number;
}

export interface DealBreakerResult {
  rechnetSich: boolean;
  ampel: "GRUEN" | "GELB" | "ROT";
  meldung: string;
}

/**
 * "Rechnet sich das?" — bewusst kein Jahr-1-Schnappschuss mehr, sondern ein Blick auf den
 * Verlauf: ein Objekt darf in Jahr 1 spürbar negativ sein, muss aber (a) innerhalb einer
 * tolerierten Verlustgrenze relativ zur Kaltmiete bleiben und (b) bis zu einem konfigurierten
 * Zieljahr in den positiven Cashflow drehen. Erst wenn beides erfüllt ist, zählt zusätzlich die
 * Finanzierbarkeit (affordabilityAmpel) — die kennt den Cashflow-Verlauf selbst nicht.
 */
export function berechneDealBreaker(input: DealBreakerInput): DealBreakerResult {
  const jahr1 = input.vermoegensverlauf[0];
  const cashflowJahr1Monatlich = round2((jahr1?.cashflowNachSteuerJahr ?? 0) / 12);
  const maxVerlustMonatlich = round2(input.effektiveKaltmieteMonatlich * (input.cashflowStartverlustMaxProzentKaltmiete / 100));
  const startverlustZuGross = cashflowJahr1Monatlich < -maxVerlustMonatlich;

  const umschlagJahrEintrag = input.vermoegensverlauf.find((j) => j.jahr === input.cashflowUmschlagjahr);
  const drehtNichtInsPlusBisZieljahr = !umschlagJahrEintrag || umschlagJahrEintrag.cashflowNachSteuerJahr < 0;

  if (startverlustZuGross) {
    const breakevenHinweis =
      input.breakeven.erreichbar && input.breakeven.differenzZuAktuellemKaufpreis
        ? ` Bei ${formatEuro(input.breakeven.differenzZuAktuellemKaufpreis)} weniger Kaufpreis (${formatEuro(
            input.breakeven.breakevenKaufpreis ?? 0
          )} statt ${formatEuro(input.aktuellerKaufpreis)}) wäre allein Jahr 1 ausgeglichen.`
        : "";
    return {
      rechnetSich: false,
      ampel: "ROT",
      meldung: `Cashflow nach Steuer ist in Jahr 1 mit ${formatEuro(cashflowJahr1Monatlich)}/Mon. zu stark negativ — mehr als ${
        input.cashflowStartverlustMaxProzentKaltmiete
      }% der Kaltmiete von ${formatEuro(input.effektiveKaltmieteMonatlich)}/Mon.${breakevenHinweis}`,
    };
  }

  if (drehtNichtInsPlusBisZieljahr) {
    const ersterPositiverEintrag = input.vermoegensverlauf.find((j) => j.cashflowNachSteuerJahr >= 0);
    const meldung = ersterPositiverEintrag
      ? `Cashflow nach Steuer dreht laut Prognose erst in Jahr ${ersterPositiverEintrag.jahr} ins Plus — später als deine Zielspanne von Jahr ${input.cashflowUmschlagjahr}.`
      : `Cashflow nach Steuer dreht laut Prognose auch über ${input.vermoegensverlauf.length} Jahre nicht ins Plus.`;
    return { rechnetSich: false, ampel: "ROT", meldung };
  }

  const trendMeldung =
    cashflowJahr1Monatlich >= 0
      ? "Cashflow nach Steuer ist von Anfang an positiv."
      : `Cashflow nach Steuer startet negativ, dreht aber laut Prognose bis Jahr ${input.cashflowUmschlagjahr} ins Plus — im Rahmen deiner Zielspanne.`;

  if (input.affordabilityAmpel === "ROT") {
    return {
      rechnetSich: false,
      ampel: "ROT",
      meldung: `${trendMeldung} Die Finanzierbarkeit (Schuldendienst/Liquidität) ist laut Profil-Check aber kritisch.`,
    };
  }

  if (input.affordabilityAmpel === "GELB") {
    return {
      rechnetSich: true,
      ampel: "GELB",
      meldung: `${trendMeldung} Die Finanzierbarkeit ist laut Profil-Check allerdings knapp.`,
    };
  }

  return { rechnetSich: true, ampel: "GRUEN", meldung: trendMeldung };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function formatEuro(n: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
