import { describe, expect, it } from "vitest";
import { ermittleVerhandlungsargumente } from "../verhandlungsargumente";
import { referenceDataFixture } from "../../__tests__/fixtures";

const basisInstandhaltung = {
  basisSatzProM2ProJahr: 9,
  risikoMultiplikator: 1,
  empfohleneRuecklageMonatlich: 60,
  tatsaechlichMonatlich: 60,
  istOverride: false,
};

describe("ermittleVerhandlungsargumente", () => {
  it("erkennt ein Gewerk in sehr schlechtem Zustand und berechnet die Kosten transparent nach", () => {
    const argumente = ermittleVerhandlungsargumente({
      gewerkePosten: [
        {
          gewerk: "DACH",
          zustand: 6,
          eigentumsTyp: "GEMEINSCHAFTSEIGENTUM",
          geschaetzteKostenEuro: 16000,
          istOverride: false,
        },
      ],
      gewerkKostenReferenz: referenceDataFixture.gewerkKosten,
      wohnflaeche: 80,
      instandhaltung: basisInstandhaltung,
      cashflowNachSteuerMonatlich: 100,
      aktuellerKaufpreis: 300000,
      breakevenKaufpreis: null,
      differenzZuAktuellemKaufpreis: null,
    });

    expect(argumente).toHaveLength(1);
    const arg = argumente[0];
    if (arg.typ !== "GEWERK_RISIKO") throw new Error("falscher Typ");
    expect(arg.gewerk).toBe("DACH");
    expect(arg.mittelwertProM2).toBe(200); // (150+250)/2
    expect(arg.zustandsfaktorProzent).toBe(100); // Zustand 6 -> Faktor 1
  });

  it("ignoriert Gewerke in gutem/mittlerem Zustand (< Stufe 5)", () => {
    const argumente = ermittleVerhandlungsargumente({
      gewerkePosten: [
        { gewerk: "DACH", zustand: 3, eigentumsTyp: "SONDEREIGENTUM", geschaetzteKostenEuro: 4800, istOverride: false },
        { gewerk: "FENSTER", zustand: 4, eigentumsTyp: "SONDEREIGENTUM", geschaetzteKostenEuro: 5060, istOverride: false },
      ],
      gewerkKostenReferenz: referenceDataFixture.gewerkKosten,
      wohnflaeche: 80,
      instandhaltung: basisInstandhaltung,
      cashflowNachSteuerMonatlich: 100,
      aktuellerKaufpreis: 300000,
      breakevenKaufpreis: null,
      differenzZuAktuellemKaufpreis: null,
    });

    expect(argumente).toHaveLength(0);
  });

  it("erkennt eine unterdeckte Instandhaltungsrücklage nur, wenn die Differenz die Bagatellgrenze übersteigt", () => {
    const knappUnterhalb = ermittleVerhandlungsargumente({
      gewerkePosten: [],
      gewerkKostenReferenz: referenceDataFixture.gewerkKosten,
      wohnflaeche: 80,
      instandhaltung: { ...basisInstandhaltung, empfohleneRuecklageMonatlich: 70, tatsaechlichMonatlich: 60, istOverride: true },
      cashflowNachSteuerMonatlich: 100,
      aktuellerKaufpreis: 300000,
      breakevenKaufpreis: null,
      differenzZuAktuellemKaufpreis: null,
    });
    expect(knappUnterhalb).toHaveLength(0);

    const deutlichUnterdeckt = ermittleVerhandlungsargumente({
      gewerkePosten: [],
      gewerkKostenReferenz: referenceDataFixture.gewerkKosten,
      wohnflaeche: 80,
      instandhaltung: { ...basisInstandhaltung, empfohleneRuecklageMonatlich: 150, tatsaechlichMonatlich: 60, istOverride: true },
      cashflowNachSteuerMonatlich: 100,
      aktuellerKaufpreis: 300000,
      breakevenKaufpreis: null,
      differenzZuAktuellemKaufpreis: null,
    });
    expect(deutlichUnterdeckt).toHaveLength(1);
    expect(deutlichUnterdeckt[0].typ).toBe("INSTANDHALTUNG_UNTERDECKUNG");
  });

  it("erkennt negativen Cashflow und übernimmt den Break-even-Kaufpreis unverändert", () => {
    const argumente = ermittleVerhandlungsargumente({
      gewerkePosten: [],
      gewerkKostenReferenz: referenceDataFixture.gewerkKosten,
      wohnflaeche: 80,
      instandhaltung: basisInstandhaltung,
      cashflowNachSteuerMonatlich: -150,
      aktuellerKaufpreis: 300000,
      breakevenKaufpreis: 270000,
      differenzZuAktuellemKaufpreis: 30000,
    });

    expect(argumente).toHaveLength(1);
    const arg = argumente[0];
    if (arg.typ !== "CASHFLOW_NEGATIV") throw new Error("falscher Typ");
    expect(arg.breakevenKaufpreis).toBe(270000);
    expect(arg.differenzZuAktuellemKaufpreis).toBe(30000);
  });

  it("sortiert Argumente nach Gewicht absteigend (größte Kostenposition zuerst)", () => {
    const argumente = ermittleVerhandlungsargumente({
      gewerkePosten: [
        { gewerk: "FENSTER", zustand: 5, eigentumsTyp: "SONDEREIGENTUM", geschaetzteKostenEuro: 5000, istOverride: false },
        { gewerk: "DACH", zustand: 6, eigentumsTyp: "GEMEINSCHAFTSEIGENTUM", geschaetzteKostenEuro: 20000, istOverride: false },
      ],
      gewerkKostenReferenz: referenceDataFixture.gewerkKosten,
      wohnflaeche: 80,
      instandhaltung: basisInstandhaltung,
      cashflowNachSteuerMonatlich: 100,
      aktuellerKaufpreis: 300000,
      breakevenKaufpreis: null,
      differenzZuAktuellemKaufpreis: null,
    });

    expect(argumente).toHaveLength(2);
    expect(argumente[0].typ).toBe("GEWERK_RISIKO");
    if (argumente[0].typ !== "GEWERK_RISIKO") throw new Error("falscher Typ");
    expect(argumente[0].gewerk).toBe("DACH");
  });
});
