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
    },
  });

  const profile = makeProfileFixture({
    nettoEinkommenMonatlich: 4000,
    zuVersteuerndesEinkommenJaehrlich: 65000,
    vorhandenesEigenkapital: 80000,
    liabilities: [],
  });

  const result = berechneObjekt(property, profile, referenceDataFixture, { steuerjahr: 2025, bezugsjahr: 2024 });

  it("berechnet die Kaufnebenkosten exakt (7.000 GrESt + 3.500 Notar + 7.140 Makler)", () => {
    expect(result.kaufnebenkosten.grunderwerbsteuerEuro).toBe(7000);
    expect(result.kaufnebenkosten.notarGrundbuchEuro).toBe(3500);
    expect(result.kaufnebenkosten.maklerprovisionEuro).toBeCloseTo(7140, 2);
    expect(result.kaufnebenkosten.summeEuro).toBeCloseTo(17640, 2);
  });

  it("leitet bei 100%-Finanzierung die Darlehenssumme aus dem Kaufpreis ab", () => {
    expect(result.finanzierung.gesamtinvestitionEuro).toBeCloseTo(217640, 2);
    expect(result.finanzierung.darlehenssummeEuro).toBe(200000);
    expect(result.finanzierung.eigenkapitalEinsatzEuro).toBeCloseTo(17640, 2);
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

  it("berechnet die Nettomietrendite exakt (9.720€ / 217.640€ Gesamtinvestition)", () => {
    // laufende Kosten/Monat: 50 (Hausgeld) + 100 (Instandhaltung) + 20 (Verwaltung) + 20 (Versicherung/12) = 190
    expect(result.rendite.nettomietrenditeProzent).toBeCloseTo(4.47, 2);
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

  it("bewertet die Finanzierbarkeit anhand des Profils korrekt (25% Schuldendienstquote, ausreichend EK)", () => {
    expect(result.affordability.schuldendienstquoteProzent).toBe(25);
    expect(result.affordability.liquiditaetsreserveNachKaufEuro).toBeCloseTo(80000 - 17640, 2);
    expect(result.affordability.ampel).toBe("GRUEN");
  });

  it("liefert einen 30-jährigen Vermögensverlauf, dessen Restschuld die des Tilgungsplans widerspiegelt", () => {
    expect(result.vermoegensverlauf).toHaveLength(30);
    expect(result.vermoegensverlauf[0].restschuld).toBe(result.tilgungsplan[0].restschuldEnde);
    // Kein Exit geplant -> Wertsteigerung 0%, Immobilienwert bleibt konstant.
    expect(result.vermoegensverlauf[0].immobilienwert).toBe(200000);
    expect(result.vermoegensverlauf[29].immobilienwert).toBe(200000);
  });

  it("übernimmt die manuell überschriebene Instandhaltungsrücklage unverändert", () => {
    expect(result.instandhaltung.istOverride).toBe(true);
    expect(result.instandhaltung.tatsaechlichMonatlich).toBe(100);
  });
});
