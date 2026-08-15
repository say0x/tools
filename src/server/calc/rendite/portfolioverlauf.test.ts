import { describe, expect, it } from "vitest";
import {
  berechneImmobilienEigenkapitalverlauf,
  berechnePortfolioverlauf,
  berechneSparpositionsverlauf,
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
