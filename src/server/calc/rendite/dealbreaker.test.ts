import { describe, expect, it } from "vitest";
import { berechneDealBreaker } from "./dealbreaker";
import type { VermoegensverlaufJahr } from "../types";

const NICHT_ERREICHBAR = { erreichbar: false as const, breakevenKaufpreis: null, differenzZuAktuellemKaufpreis: null };

/** Baut eine minimale Jahresreihe: cashflowNachSteuerJahr(jahr) treibt jedes Jahr, alle anderen Felder sind für dieses Modul irrelevant. */
function verlauf(cashflowNachSteuerProJahr: (jahr: number) => number, jahre = 30): VermoegensverlaufJahr[] {
  return Array.from({ length: jahre }, (_, i) => {
    const jahr = i + 1;
    return {
      jahr,
      restschuld: 0,
      immobilienwert: 0,
      eigenkapitalanteil: 0,
      immobilienwertReal: 0,
      eigenkapitalanteilReal: 0,
      cashflowVorSteuerJahr: 0,
      cashflowNachSteuerJahr: cashflowNachSteuerProJahr(jahr),
      kumulierterCashflowVorSteuer: 0,
      kumulierterCashflowNachSteuer: 0,
      kostenJahr: 0,
      steuerJahr: 0,
    };
  });
}

describe("berechneDealBreaker", () => {
  it("ist GRUEN, wenn der Cashflow von Anfang an positiv ist", () => {
    const result = berechneDealBreaker({
      vermoegensverlauf: verlauf(() => 100 * 12),
      effektiveKaltmieteMonatlich: 1000,
      affordabilityAmpel: "GRUEN",
      cashflowStartverlustMaxProzentKaltmiete: 30,
      cashflowUmschlagjahr: 10,
      breakeven: NICHT_ERREICHBAR,
      aktuellerKaufpreis: 300000,
    });

    expect(result.ampel).toBe("GRUEN");
    expect(result.rechnetSich).toBe(true);
    expect(result.meldung).toContain("von Anfang an positiv");
  });

  it("ist GRUEN, wenn Jahr 1 innerhalb der Startgrenze negativ ist und der Cashflow bis zum Umschlagjahr ins Plus dreht", () => {
    const result = berechneDealBreaker({
      // -200€/Monat in Jahr 1 (20% von 1.000€ Kaltmiete, unter der 30%-Grenze), ab Jahr 5 positiv.
      vermoegensverlauf: verlauf((jahr) => (jahr < 5 ? -200 * 12 : 50 * 12)),
      effektiveKaltmieteMonatlich: 1000,
      affordabilityAmpel: "GRUEN",
      cashflowStartverlustMaxProzentKaltmiete: 30,
      cashflowUmschlagjahr: 10,
      breakeven: NICHT_ERREICHBAR,
      aktuellerKaufpreis: 300000,
    });

    expect(result.ampel).toBe("GRUEN");
    expect(result.rechnetSich).toBe(true);
    expect(result.meldung).toContain("dreht aber laut Prognose bis Jahr 10");
  });

  it("ist ROT, wenn der Jahr-1-Verlust die Startgrenze überschreitet — unabhängig vom späteren Verlauf", () => {
    const result = berechneDealBreaker({
      // -400€/Monat in Jahr 1 (40% von 1.000€ Kaltmiete, über der 30%-Grenze), obwohl ab Jahr 2 positiv.
      vermoegensverlauf: verlauf((jahr) => (jahr === 1 ? -400 * 12 : 50 * 12)),
      effektiveKaltmieteMonatlich: 1000,
      affordabilityAmpel: "GRUEN",
      cashflowStartverlustMaxProzentKaltmiete: 30,
      cashflowUmschlagjahr: 10,
      breakeven: { erreichbar: true, breakevenKaufpreis: 250000, differenzZuAktuellemKaufpreis: 50000 },
      aktuellerKaufpreis: 300000,
    });

    expect(result.ampel).toBe("ROT");
    expect(result.rechnetSich).toBe(false);
    expect(result.meldung).toContain("zu stark negativ");
    expect(result.meldung).toContain("50.000");
  });

  it("ist ROT, wenn der Cashflow erst nach dem Umschlagjahr ins Plus dreht, obwohl Jahr 1 im Rahmen war", () => {
    const result = berechneDealBreaker({
      // -100€/Monat in Jahr 1 (10%, weit unter der 30%-Grenze), aber erst ab Jahr 15 positiv.
      vermoegensverlauf: verlauf((jahr) => (jahr < 15 ? -100 * 12 : 50 * 12)),
      effektiveKaltmieteMonatlich: 1000,
      affordabilityAmpel: "GRUEN",
      cashflowStartverlustMaxProzentKaltmiete: 30,
      cashflowUmschlagjahr: 10,
      breakeven: NICHT_ERREICHBAR,
      aktuellerKaufpreis: 300000,
    });

    expect(result.ampel).toBe("ROT");
    expect(result.rechnetSich).toBe(false);
    expect(result.meldung).toContain("erst in Jahr 15");
    expect(result.meldung).toContain("später als deine Zielspanne von Jahr 10");
  });

  it("ist ROT, wenn der Cashflow innerhalb der Betrachtung nie ins Plus dreht", () => {
    const result = berechneDealBreaker({
      vermoegensverlauf: verlauf(() => -50 * 12, 20),
      effektiveKaltmieteMonatlich: 1000,
      affordabilityAmpel: "GRUEN",
      cashflowStartverlustMaxProzentKaltmiete: 30,
      cashflowUmschlagjahr: 10,
      breakeven: NICHT_ERREICHBAR,
      aktuellerKaufpreis: 300000,
    });

    expect(result.ampel).toBe("ROT");
    expect(result.meldung).toContain("auch über 20 Jahre nicht ins Plus");
  });

  it("ist GELB, wenn Trend und Startjahr passen, die Finanzierbarkeit laut Profil-Check aber knapp ist", () => {
    const result = berechneDealBreaker({
      vermoegensverlauf: verlauf(() => 50 * 12),
      effektiveKaltmieteMonatlich: 1000,
      affordabilityAmpel: "GELB",
      cashflowStartverlustMaxProzentKaltmiete: 30,
      cashflowUmschlagjahr: 10,
      breakeven: NICHT_ERREICHBAR,
      aktuellerKaufpreis: 300000,
    });

    expect(result.ampel).toBe("GELB");
    expect(result.rechnetSich).toBe(true);
    expect(result.meldung).toContain("knapp");
  });

  it("ist ROT, wenn Trend und Startjahr passen, die Finanzierbarkeit laut Profil-Check aber kritisch ist", () => {
    const result = berechneDealBreaker({
      vermoegensverlauf: verlauf(() => 50 * 12),
      effektiveKaltmieteMonatlich: 1000,
      affordabilityAmpel: "ROT",
      cashflowStartverlustMaxProzentKaltmiete: 30,
      cashflowUmschlagjahr: 10,
      breakeven: NICHT_ERREICHBAR,
      aktuellerKaufpreis: 300000,
    });

    expect(result.ampel).toBe("ROT");
    expect(result.rechnetSich).toBe(false);
    expect(result.meldung).toContain("kritisch");
  });
});
