import { describe, expect, it } from "vitest";
import { berechneObjekt } from "../engine";
import { berechneGrenzsteuersatz } from "../tax/grenzsteuersatz";
import { makeProfileFixture, makePropertyFixture, referenceDataFixture } from "./fixtures";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

describe("berechneObjekt (Referenzobjekt, von Hand durchgerechnet)", () => {
  // Objekt: 200.000€ Kaufpreis, Bayern (3,5% GrESt), 100m², 100%-Finanzierung
  // (Darlehen = Kaufpreis, EK deckt die Nebenkosten), 4% Zins / 2% Tilgung,
  // 1.000€ Kaltmiete, Instandhaltungsrücklage manuell auf 100€ gesetzt.
  const property = makePropertyFixture({
    kaufpreis: 200000,
    wohnflaeche: 100,
    bundesland: "BAYERN",
    baujahr: 1990,
    kaltmieteMonatlich: 1000,
    leerstandsquoteProzent: 0,
    hausgeldUmlagefaehigMonatlich: 0,
    hausgeldNichtUmlagefaehigMonatlich: 50,
    instandhaltungsruecklageMonatlich: 100,
    instandhaltungsruecklageOverride: true,
    verwaltungskostenMonatlich: 20,
    versicherungJaehrlich: 240,
    afaSatzProzent: 2,
    gewerke: [],
    financing: {
      eigenkapital: 20000,
      zinssatzProzent: 4,
      anfaenglicheTilgungProzent: 2,
      zinsbindungJahre: 10,
      finanzierungsart: "FINANZIERUNG_100",
      eigenkapitalquoteManuellProzent: null,
      anschlusszinsAufschlagProzent: 0,
      sondertilgungProzent: 0,
      sondertilgungMaxProzent: 5,
    },
  });

  const profile = makeProfileFixture({
    nettoEinkommenMonatlich: 4000,
    zuVersteuerndesEinkommenJaehrlich: 65000,
    vorhandenesEigenkapital: 80000,
    liabilities: [],
  });

  const result = berechneObjekt(property, profile, referenceDataFixture, { steuerjahr: 2025, bezugsjahr: 2024 });

  it("berechnet die Kaufnebenkosten exakt (7.000 GrESt + 2.000 Notar + 1.000 Grundbuch + 7.140 Makler)", () => {
    expect(result.kaufnebenkosten.grunderwerbsteuerEuro).toBe(7000);
    expect(result.kaufnebenkosten.notarEuro).toBe(2000);
    expect(result.kaufnebenkosten.grundbuchEuro).toBe(1000);
    expect(result.kaufnebenkosten.maklerprovisionEuro).toBeCloseTo(7140, 2);
    expect(result.kaufnebenkosten.summeEuro).toBeCloseTo(17140, 2);
  });

  it("leitet bei 100%-Finanzierung die Darlehenssumme aus dem Kaufpreis ab", () => {
    expect(result.finanzierung.gesamtinvestitionEuro).toBeCloseTo(217140, 2);
    expect(result.finanzierung.darlehenssummeEuro).toBe(200000);
    expect(result.finanzierung.eigenkapitalEinsatzEuro).toBeCloseTo(17140, 2);
  });

  it("berechnet den Tilgungsplan für Jahr 1 exakt (Annuität 6% von 200.000)", () => {
    expect(result.tilgungsplan[0].zinszahlung).toBe(8000);
    expect(result.tilgungsplan[0].tilgungszahlung).toBe(4000);
    expect(result.tilgungsplan[0].restschuldEnde).toBe(196000);
  });

  it("berechnet Brutto-Mietrendite und Kaufpreisfaktor exakt", () => {
    expect(result.rendite.jahreskaltmiete).toBe(12000);
    expect(result.rendite.bruttomietrenditeProzent).toBe(6);
    expect(result.rendite.kaufpreisfaktor).toBeCloseTo(16.67, 2);
  });

  it("berechnet die Nettomietrendite exakt (9.720€ / 217.140€ Gesamtinvestition)", () => {
    // laufende Kosten/Monat: 50 (Hausgeld) + 100 (Instandhaltung) + 20 (Verwaltung) + 20 (Versicherung/12) = 190
    expect(result.rendite.nettomietrenditeProzent).toBeCloseTo(4.48, 2);
  });

  it("berechnet den Cashflow vor Steuer exakt (1.000 Miete − 190 Kosten − 1.000 Rate)", () => {
    expect(result.rendite.monatlicherCashflowVorSteuer).toBe(-190);
  });

  it("verrechnet den steuerlichen Verlust (AfA + Zins übersteigen die Miete) korrekt gegen den Grenzsteuersatz", () => {
    // steuerliches Ergebnis: 12.000 Miete − 2.280 Kosten − 8.000 Zins − 3.200 AfA (160.000 Gebäudewert × 2%) = −1.480
    const grenzsteuersatz = berechneGrenzsteuersatz(65000, 2025);
    const erwarteteSteuer = round2(-1480 * (grenzsteuersatz / 100));
    const erwarteterCashflowNachSteuer = round2(-190 - erwarteteSteuer / 12);

    expect(result.rendite.grenzsteuersatzProzent).toBeCloseTo(grenzsteuersatz, 2);
    expect(result.rendite.monatlicherCashflowNachSteuer).toBeCloseTo(erwarteterCashflowNachSteuer, 2);
    // Steuerlicher Verlust -> Cashflow nach Steuer ist besser als vor Steuer.
    expect(result.rendite.monatlicherCashflowNachSteuer).toBeGreaterThan(result.rendite.monatlicherCashflowVorSteuer);
  });

  it("meldet den Deal-Breaker konsistent zum Cashflow und liefert bei negativem Cashflow einen Break-even-Kaufpreis", () => {
    expect(result.dealBreaker.rechnetSich).toBe(result.rendite.monatlicherCashflowNachSteuer >= 0);
    if (!result.dealBreaker.rechnetSich) {
      expect(result.breakeven.erreichbar).toBe(true);
      expect(result.breakeven.breakevenKaufpreis).toBeLessThan(property.kaufpreis);
      expect(result.breakeven.differenzZuAktuellemKaufpreis).toBeGreaterThan(0);
      expect(result.dealBreaker.meldung).toContain("Lohnt sich");
    }
  });

  it("bewertet die Finanzierbarkeit anhand des Profils korrekt (Rate 1.000€, Netto 4.000€ + 800€ angerechnete Miete)", () => {
    // Angerechnete Miete: 1.000 effektive Nettomiete/Monat × 80% Mietanrechnung = 800€ -> Einkommen 4.800€
    expect(result.affordability.angerechneteMieteMonatlich).toBe(800);
    expect(result.affordability.schuldendienstquoteProzent).toBeCloseTo(round2((1000 / 4800) * 100), 2);
    expect(result.affordability.liquiditaetsreserveNachKaufEuro).toBeCloseTo(80000 - 17140, 2);
    expect(result.affordability.ampel).toBe("GRUEN");
  });

  it("liefert einen 50-jährigen Vermögensverlauf mit Wertsteigerung unabhängig vom Exit-Plan (Default 2%/Jahr)", () => {
    expect(result.vermoegensverlauf).toHaveLength(50);
    expect(result.vermoegensverlauf[0].restschuld).toBe(result.tilgungsplan[0].restschuldEnde);
    // Kein Exit geplant, aber Wertsteigerung wirkt trotzdem (200.000 × 1,02^n).
    expect(result.vermoegensverlauf[0].immobilienwert).toBe(204000);
    expect(result.vermoegensverlauf[49].immobilienwert).toBeCloseTo(538317.61, 2);
  });

  it("verfolgt kumulierten Cashflow vor UND nach Steuer getrennt über die Jahre", () => {
    expect(result.vermoegensverlauf[0].cashflowVorSteuerJahr).toBe(-190 * 12);
    expect(result.vermoegensverlauf[0].kumulierterCashflowVorSteuer).toBe(result.vermoegensverlauf[0].cashflowVorSteuerJahr);
    expect(result.vermoegensverlauf[0].kumulierterCashflowNachSteuer).toBeGreaterThan(
      result.vermoegensverlauf[0].kumulierterCashflowVorSteuer
    );
  });

  it("schreibt Miete und Kosten in Jahr 2 mit getrennten Raten fort, während die Annuität (Zins+Tilgung) konstant bleibt", () => {
    // Miete: 12.000 × 1,015 = 12.180 — Kosten: 2.280 × 1,02 = 2.325,60 — Annuität bleibt 12.000 (konstant bei gleichbleibendem Zins).
    const jahr2 = result.vermoegensverlauf[1];
    const annuitaetJahr2 = result.tilgungsplan[1].zinszahlung + result.tilgungsplan[1].tilgungszahlung;
    expect(annuitaetJahr2).toBeCloseTo(12000, 2);
    expect(jahr2.cashflowVorSteuerJahr).toBeCloseTo(12180 - 2325.6 - 12000, 2);
  });

  it("liefert eine inflationsbereinigte (reale) Eigenkapitalanteil-Reihe, die unter der nominalen liegt", () => {
    const letztesJahr = result.vermoegensverlauf[49];
    expect(letztesJahr.eigenkapitalanteilReal).toBeLessThan(letztesJahr.eigenkapitalanteil);
    expect(letztesJahr.immobilienwertReal).toBeLessThan(letztesJahr.immobilienwert);
  });

  it("liefert Meilensteine für Zinsbindungsende und Volltilgung, konsistent zum Tilgungsplan", () => {
    expect(result.meilensteine.zinsbindungEndeJahr).toBe(10);

    const erwarteterVolltilgungseintrag = result.tilgungsplan.find(
      (j) => j.restschuldEnde <= 0.01 && j.restschuldStart > 0.01
    );
    expect(result.meilensteine.volltilgungJahr).toBe(erwarteterVolltilgungseintrag?.jahr ?? null);
    expect(result.meilensteine.volltilgungJahr).not.toBeNull();
    expect(result.meilensteine.volltilgungJahr).toBeLessThanOrEqual(50);
  });

  it("übernimmt die manuell überschriebene Instandhaltungsrücklage unverändert", () => {
    expect(result.instandhaltung.istOverride).toBe(true);
    expect(result.instandhaltung.tatsaechlichMonatlich).toBe(100);
  });
});

describe("Grundsteuer, Versicherung-Umlagefähigkeit und zvE-Schätzung", () => {
  const basisProperty = makePropertyFixture({
    kaufpreis: 200000,
    wohnflaeche: 100,
    bundesland: "BAYERN",
    kaltmieteMonatlich: 1000,
    leerstandsquoteProzent: 0,
    hausgeldNichtUmlagefaehigMonatlich: 50,
    instandhaltungsruecklageMonatlich: 100,
    instandhaltungsruecklageOverride: true,
    verwaltungskostenMonatlich: 20,
    versicherungJaehrlich: 240,
    grundsteuerJaehrlich: 600,
    financing: {
      eigenkapital: 20000,
      zinssatzProzent: 4,
      anfaenglicheTilgungProzent: 2,
      zinsbindungJahre: 10,
      finanzierungsart: "FINANZIERUNG_100",
      eigenkapitalquoteManuellProzent: null,
      anschlusszinsAufschlagProzent: 0,
      sondertilgungProzent: 0,
      sondertilgungMaxProzent: 5,
    },
  });
  const profile = makeProfileFixture({ zuVersteuerndesEinkommenJaehrlich: 65000 });

  it("Grundsteuer ist cash-neutral (kein Effekt auf Cashflow, egal welche Höhe)", () => {
    const ohneGrundsteuer = berechneObjekt(
      { ...basisProperty, grundsteuerJaehrlich: 0 },
      profile,
      referenceDataFixture,
      { steuerjahr: 2025 }
    );
    const mitGrundsteuer = berechneObjekt(basisProperty, profile, referenceDataFixture, { steuerjahr: 2025 });
    expect(mitGrundsteuer.rendite.monatlicherCashflowVorSteuer).toBe(ohneGrundsteuer.rendite.monatlicherCashflowVorSteuer);
    expect(mitGrundsteuer.rendite.monatlicherCashflowNachSteuer).toBe(ohneGrundsteuer.rendite.monatlicherCashflowNachSteuer);
  });

  it("Versicherung senkt den Cashflow nur, wenn sie NICHT umlagefähig ist", () => {
    const nichtUmlagefaehig = berechneObjekt(
      { ...basisProperty, versicherungUmlagefaehig: false },
      profile,
      referenceDataFixture,
      { steuerjahr: 2025 }
    );
    const umlagefaehig = berechneObjekt(
      { ...basisProperty, versicherungUmlagefaehig: true },
      profile,
      referenceDataFixture,
      { steuerjahr: 2025 }
    );
    // Differenz vor Steuer muss exakt der monatlichen Versicherung entsprechen (240€/Jahr = 20€/Monat).
    expect(
      round2(umlagefaehig.rendite.monatlicherCashflowVorSteuer - nichtUmlagefaehig.rendite.monatlicherCashflowVorSteuer)
    ).toBe(20);
  });

  it("zvE wird bei zvEOverride:false aus dem Brutto-Einkommen geschätzt statt dem gespeicherten zvE-Wert", () => {
    const mitOverride = berechneObjekt(basisProperty, { ...profile, zvEOverride: true }, referenceDataFixture, {
      steuerjahr: 2025,
    });
    const ohneOverride = berechneObjekt(
      basisProperty,
      { ...profile, zvEOverride: false, bruttoEinkommenMonatlich: 5500 },
      referenceDataFixture,
      { steuerjahr: 2025 }
    );

    // Override: nutzt exakt profile.zuVersteuerndesEinkommenJaehrlich (65.000).
    expect(mitOverride.rendite.grenzsteuersatzProzent).toBeCloseTo(berechneGrenzsteuersatz(65000, 2025), 2);

    // Ohne Override: geschätztes zvE aus 5.500€/Monat Brutto (=66.000€/Jahr) weicht vom fixen 65.000€ ab.
    const erwartetesZvE = 66000 - 1230 - 36 - 66000 * 0.2;
    expect(ohneOverride.rendite.grenzsteuersatzProzent).toBeCloseTo(berechneGrenzsteuersatz(erwartetesZvE, 2025), 2);
    expect(ohneOverride.rendite.grenzsteuersatzProzent).not.toBeCloseTo(mitOverride.rendite.grenzsteuersatzProzent, 2);
  });
});
