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

// Kaufpreisfaktor unter dem Referenzwert (ETW:GROSSSTADT = 28), damit dieser
// Trigger in den anderen Tests nicht ungewollt mit auslöst.
const basisKaufpreisfaktor = {
  objekttyp: "ETW" as const,
  lagetyp: "GROSSSTADT" as const,
  kaufpreisfaktorAktuell: 16.67,
  bruttomietrenditeAktuellProzent: 6,
  jahreskaltmiete: 18000,
  kaufpreisfaktorReferenzByObjekttypLagetyp: referenceDataFixture.kaufpreisfaktorReferenzByObjekttypLagetyp,
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
      ...basisKaufpreisfaktor,
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
      ...basisKaufpreisfaktor,
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
      ...basisKaufpreisfaktor,
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
      ...basisKaufpreisfaktor,
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
      ...basisKaufpreisfaktor,
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
      ...basisKaufpreisfaktor,
    });

    expect(argumente).toHaveLength(2);
    expect(argumente[0].typ).toBe("GEWERK_RISIKO");
    if (argumente[0].typ !== "GEWERK_RISIKO") throw new Error("falscher Typ");
    expect(argumente[0].gewerk).toBe("DACH");
  });

  it("erkennt einen Kaufpreisfaktor deutlich über dem Referenzwert (ETW:GROSSSTADT = 28) und berechnet den fairen Kaufpreis", () => {
    // Kaufpreisfaktor 35 ist 25% über der Referenz 28 -> über der 10%-Schwelle.
    const argumente = ermittleVerhandlungsargumente({
      gewerkePosten: [],
      gewerkKostenReferenz: referenceDataFixture.gewerkKosten,
      wohnflaeche: 80,
      instandhaltung: basisInstandhaltung,
      cashflowNachSteuerMonatlich: 100,
      aktuellerKaufpreis: 350000,
      breakevenKaufpreis: null,
      differenzZuAktuellemKaufpreis: null,
      objekttyp: "ETW",
      lagetyp: "GROSSSTADT",
      kaufpreisfaktorAktuell: 35,
      bruttomietrenditeAktuellProzent: 2.86,
      jahreskaltmiete: 10000,
      kaufpreisfaktorReferenzByObjekttypLagetyp: referenceDataFixture.kaufpreisfaktorReferenzByObjekttypLagetyp,
    });

    expect(argumente).toHaveLength(1);
    const arg = argumente[0];
    if (arg.typ !== "KAUFPREISFAKTOR_UEBER_REFERENZ") throw new Error("falscher Typ");
    expect(arg.kaufpreisfaktorReferenz).toBe(28);
    expect(arg.abweichungProzent).toBe(25);
    expect(arg.fairerKaufpreisEuro).toBe(280000); // 28 * 10.000
    expect(arg.bruttomietrenditeReferenzProzent).toBeCloseTo(3.57, 2); // 100/28
  });

  it("löst den Kaufpreisfaktor-Vergleich nicht aus, solange die Abweichung unter der 10%-Schwelle bleibt", () => {
    const argumente = ermittleVerhandlungsargumente({
      gewerkePosten: [],
      gewerkKostenReferenz: referenceDataFixture.gewerkKosten,
      wohnflaeche: 80,
      instandhaltung: basisInstandhaltung,
      cashflowNachSteuerMonatlich: 100,
      aktuellerKaufpreis: 300000,
      breakevenKaufpreis: null,
      differenzZuAktuellemKaufpreis: null,
      objekttyp: "ETW",
      lagetyp: "GROSSSTADT",
      kaufpreisfaktorAktuell: 30, // nur ~7% über 28
      bruttomietrenditeAktuellProzent: 3.33,
      jahreskaltmiete: 10000,
      kaufpreisfaktorReferenzByObjekttypLagetyp: referenceDataFixture.kaufpreisfaktorReferenzByObjekttypLagetyp,
    });

    expect(argumente).toHaveLength(0);
  });
});
