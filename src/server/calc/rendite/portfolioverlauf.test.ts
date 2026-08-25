import { describe, expect, it } from "vitest";
import {
  berechneEinmaligeAnschaffungVerlauf,
  berechneImmobilienCashflowverlauf,
  berechneImmobilienEigenkapitalverlauf,
  berechnePortfolioverlauf,
  berechneSparpositionsverlauf,
  wendeImmobilienverkaufAn,
} from "./portfolioverlauf";

describe("berechneSparpositionsverlauf", () => {
  it("verzinst einen Einmalbetrag ohne Sparplan jährlich mit Zinseszins", () => {
    const reihe = berechneSparpositionsverlauf(
      { betrag: 10000, renditeProzentJaehrlich: 10, sparplanBetragMonatlich: 0, sparplanSteigerungProzentJaehrlich: 0 },
      3
    );
    expect(reihe).toEqual([10000, 11000, 12100, 13310]);
  });

  it("addiert den jährlichen Sparplanbetrag nach der Verzinsung des laufenden Saldos", () => {
    const reihe = berechneSparpositionsverlauf(
      { betrag: 1000, renditeProzentJaehrlich: 5, sparplanBetragMonatlich: 100, sparplanSteigerungProzentJaehrlich: 0 },
      2
    );
    // Jahr 1: 1000*1.05 + 1200 = 2250
    expect(reihe[1]).toBe(2250);
    // Jahr 2: 2250*1.05 + 1200 = 3562.5
    expect(reihe[2]).toBe(3562.5);
  });

  it("lässt die jährliche Sparrate mit sparplanSteigerungProzentJaehrlich wachsen", () => {
    const reihe = berechneSparpositionsverlauf(
      { betrag: 0, renditeProzentJaehrlich: 0, sparplanBetragMonatlich: 100, sparplanSteigerungProzentJaehrlich: 10 },
      2
    );
    // Jahr 1: Sparrate 1200 -> Saldo 1200. Jahr 2: Sparrate 1320 -> Saldo 2520.
    expect(reihe).toEqual([0, 1200, 2520]);
  });

  it("gibt bei horizontJahre=0 nur den heutigen Startbetrag zurück", () => {
    const reihe = berechneSparpositionsverlauf(
      { betrag: 5000, renditeProzentJaehrlich: 7, sparplanBetragMonatlich: 200, sparplanSteigerungProzentJaehrlich: 0 },
      0
    );
    expect(reihe).toEqual([5000]);
  });

  it("springt bei einer Szenario-Sparraten-Änderung ab dem angegebenen Jahr auf die neue Rate", () => {
    const reihe = berechneSparpositionsverlauf(
      { betrag: 0, renditeProzentJaehrlich: 0, sparplanBetragMonatlich: 500, sparplanSteigerungProzentJaehrlich: 0 },
      3,
      { abJahr: 2, neueSparrateMonatlich: 800 }
    );
    // Jahr 1: alte Rate (500*12=6000). Jahr 2+: neue Rate (800*12=9600).
    expect(reihe).toEqual([0, 6000, 15600, 25200]);
  });

  it("lässt die Sparplan-Steigerung ab dem Änderungsjahr auf Basis der neuen Rate weiterlaufen", () => {
    const reihe = berechneSparpositionsverlauf(
      { betrag: 0, renditeProzentJaehrlich: 0, sparplanBetragMonatlich: 500, sparplanSteigerungProzentJaehrlich: 10 },
      3,
      { abJahr: 1, neueSparrateMonatlich: 1000 }
    );
    // Jahr 1: neue Rate sofort (12000), danach +10%/Jahr auf Basis der neuen Rate.
    expect(reihe[1]).toBe(12000);
    expect(reihe[2]).toBe(12000 + 13200);
  });

  it("wendet die neue Sparrate schon ab Jahr 1 an, wenn abJahr 0 ist (Szenario-Startjahr = aktuelles Jahr, der Default)", () => {
    // Regressionstest: die Schleife startet bei jahr=1, "jahr === abJahr" hätte bei
    // abJahr=0 nie zugetroffen und die neue Rate wäre über den gesamten Horizont
    // stillschweigend nie gegriffen — genau der Default-Fall für ein neues Szenario.
    const reihe = berechneSparpositionsverlauf(
      { betrag: 0, renditeProzentJaehrlich: 0, sparplanBetragMonatlich: 500, sparplanSteigerungProzentJaehrlich: 0 },
      2,
      { abJahr: 0, neueSparrateMonatlich: 800 }
    );
    expect(reihe).toEqual([0, 9600, 19200]);
  });

  it("wendet die neue Sparrate ebenso ab Jahr 1 an, wenn abJahr negativ ist (Szenario-Startjahr in der Vergangenheit)", () => {
    const reihe = berechneSparpositionsverlauf(
      { betrag: 0, renditeProzentJaehrlich: 0, sparplanBetragMonatlich: 500, sparplanSteigerungProzentJaehrlich: 0 },
      2,
      { abJahr: -3, neueSparrateMonatlich: 800 }
    );
    expect(reihe).toEqual([0, 9600, 19200]);
  });
});

describe("berechneImmobilienEigenkapitalverlauf", () => {
  const eigenkapitalanteilProJahrSeitKauf = [10000, 12000, 14000, 16000, 18000]; // Jahr 1..5 seit Kauf

  it("beginnt bei jahreSeitKauf=0 (gerade erst gekauft) mit dem eingesetzten Eigenkapital", () => {
    const reihe = berechneImmobilienEigenkapitalverlauf(eigenkapitalanteilProJahrSeitKauf, 0, 5000, 3);
    expect(reihe[0]).toBe(5000);
    expect(reihe[1]).toBe(10000); // Jahr 1 seit Kauf
    expect(reihe[3]).toBe(14000); // Jahr 3 seit Kauf
  });

  it("startet bei bereits vor Jahren gekauften Immobilien beim passenden Offset im bestehenden Verlauf", () => {
    // Heute bereits 2 Jahre seit Kauf vergangen.
    const reihe = berechneImmobilienEigenkapitalverlauf(eigenkapitalanteilProJahrSeitKauf, 2, 5000, 2);
    expect(reihe[0]).toBe(12000); // heute = Jahr 2 seit Kauf
    expect(reihe[1]).toBe(14000); // heute+1 = Jahr 3 seit Kauf
    expect(reihe[2]).toBe(16000); // heute+2 = Jahr 4 seit Kauf
  });

  it("schreibt den letzten verfügbaren Wert fort, wenn der Horizont über die vorhandene Verlaufsreihe hinausgeht", () => {
    const reihe = berechneImmobilienEigenkapitalverlauf(eigenkapitalanteilProJahrSeitKauf, 5, 5000, 5);
    // Jahr 5 seit Kauf = 18000 (letzter Eintrag), alles danach (Jahr 6+) bleibt auf 18000.
    expect(reihe).toEqual([18000, 18000, 18000, 18000, 18000, 18000]);
  });
});

describe("berechneImmobilienCashflowverlauf", () => {
  const cashflowNachSteuerProJahrSeitKauf = [1200, 1250, 1300, 1350, 1400]; // Jahr 1..5 seit Kauf

  it("startet bei 0 (heute) und akkumuliert für ein bereits laufendes Objekt den Cashflow ab dem nächsten Jahr", () => {
    const reihe = berechneImmobilienCashflowverlauf(
      { cashflowNachSteuerProJahrSeitKauf, jahreSeitKauf: 2, eigenkapitalEinsatzBeiKauf: 30000 },
      3
    );
    expect(reihe[0]).toBe(0); // heute: noch kein Cashflow gezählt
    expect(reihe[1]).toBe(1300); // Jahr 3 seit Kauf
    expect(reihe[2]).toBe(1300 + 1350);
    expect(reihe[3]).toBe(1300 + 1350 + 1400);
  });

  it("zieht bei bereits laufenden Objekten den ursprünglichen EK-Einsatz NICHT nochmal ab (bereits vor heute abgeflossen)", () => {
    const reihe = berechneImmobilienCashflowverlauf(
      { cashflowNachSteuerProJahrSeitKauf, jahreSeitKauf: 0, eigenkapitalEinsatzBeiKauf: 30000 },
      1
    );
    expect(reihe[1]).toBe(1200); // nur der Jahr-1-Cashflow, kein EK-Abzug
  });

  it("simuliert bei einem geplanten (zukünftigen) Kauf den EK-Abfluss genau im Kaufjahr und akkumuliert danach den Cashflow", () => {
    // Kauf in 2 Jahren.
    const reihe = berechneImmobilienCashflowverlauf(
      { cashflowNachSteuerProJahrSeitKauf, jahreSeitKauf: -2, eigenkapitalEinsatzBeiKauf: 30000 },
      4
    );
    expect(reihe[0]).toBe(0);
    expect(reihe[1]).toBe(0); // noch nicht gekauft
    expect(reihe[2]).toBe(-30000); // Kaufjahr: EK-Abfluss
    expect(reihe[3]).toBe(-30000 + 1200); // erstes volles Jahr Cashflow
    expect(reihe[4]).toBe(-30000 + 1200 + 1250);
  });

  it("schreibt den letzten verfügbaren Jahres-Cashflow fort, wenn der Horizont über die vorhandene Verlaufsreihe hinausgeht", () => {
    const reihe = berechneImmobilienCashflowverlauf(
      { cashflowNachSteuerProJahrSeitKauf, jahreSeitKauf: 5, eigenkapitalEinsatzBeiKauf: 30000 },
      2
    );
    // Ab Jahr 6 seit Kauf wird der letzte bekannte Jahres-Cashflow (Jahr 5 = 1400) fortgeschrieben.
    expect(reihe).toEqual([0, 1400, 2800]);
  });
});

describe("wendeImmobilienverkaufAn", () => {
  const verlauf = [0, 1000, 2000, 3000, 4000]; // Cashflow-Verlauf einer besessenen Immobilie, Jahr 0..4 ab heute

  it("übernimmt den Verlauf unverändert bis vor dem Verkaufsjahr", () => {
    const ergebnis = wendeImmobilienverkaufAn(verlauf, 3, 150000);
    expect(ergebnis[0]).toBe(0);
    expect(ergebnis[1]).toBe(1000);
    expect(ergebnis[2]).toBe(2000);
  });

  it("friert den Cashflow ab dem Verkaufsjahr ein und addiert den Verkaufserlös einmalig", () => {
    const ergebnis = wendeImmobilienverkaufAn(verlauf, 3, 150000);
    expect(ergebnis[3]).toBe(3000 + 150000);
    expect(ergebnis[4]).toBe(3000 + 150000); // kein weiterer Cashflow nach dem Verkauf
  });

  it("gibt einen leeren Verlauf unverändert zurück, statt einen Fehler zu werfen", () => {
    expect(wendeImmobilienverkaufAn([], 2, 100000)).toEqual([]);
  });
});

describe("berechneEinmaligeAnschaffungVerlauf", () => {
  it("bleibt bei 0, bis das Anschaffungsjahr erreicht ist", () => {
    const reihe = berechneEinmaligeAnschaffungVerlauf({ betrag: 30000, jahrAbHeute: 2 }, 4);
    expect(reihe).toEqual([0, 0, -30000, -30000, -30000]);
  });

  it("zieht den vollen Betrag sofort ab, wenn die Anschaffung heute (Jahr 0) stattfindet", () => {
    const reihe = berechneEinmaligeAnschaffungVerlauf({ betrag: 30000, jahrAbHeute: 0 }, 2);
    expect(reihe).toEqual([-30000, -30000, -30000]);
  });
});

describe("berechnePortfolioverlauf", () => {
  it("summiert alle Positionen pro Jahr und weist Kalenderjahr sowie proPosition korrekt aus", () => {
    const ergebnis = berechnePortfolioverlauf(
      [
        { id: "a", name: "Aktien", verlauf: [1000, 1100, 1210] },
        { id: "b", name: "Tagesgeld", verlauf: [500, 510, 520] },
      ],
      2,
      0,
      2026
    );

    expect(ergebnis).toHaveLength(3);
    expect(ergebnis[0]).toMatchObject({ jahr: 0, kalenderjahr: 2026, gesamtNominal: 1500 });
    expect(ergebnis[1].gesamtNominal).toBe(1610);
    expect(ergebnis[2].proPosition).toEqual({ a: 1210, b: 520 });
  });

  it("rechnet die reale Linie mit der Inflationsrate ab, nominal bleibt unverändert", () => {
    const ergebnis = berechnePortfolioverlauf([{ id: "a", name: "Aktien", verlauf: [1000, 1100] }], 1, 10, 2026);

    expect(ergebnis[0].gesamtNominal).toBe(1000);
    expect(ergebnis[0].gesamtReal).toBe(1000); // Jahr 0: kein Abzinsungseffekt
    expect(ergebnis[1].gesamtNominal).toBe(1100);
    expect(ergebnis[1].gesamtReal).toBe(1000); // 1100 / 1.1
  });

  it("behandelt fehlende Werte in proPosition als 0, statt einen Fehler zu werfen", () => {
    const ergebnis = berechnePortfolioverlauf([{ id: "a", name: "Kurz", verlauf: [1000] }], 2, 0);
    expect(ergebnis[1].proPosition.a).toBe(0);
    expect(ergebnis[1].gesamtNominal).toBe(0);
  });
});
