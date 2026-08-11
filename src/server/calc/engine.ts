import { berechneAffordability } from "./affordability/check";
import { ermittleVerhandlungsargumente } from "./analyse/verhandlungsargumente";
import { berechneGewerkeAuswertung } from "./costs/gewerke";
import { berechneEmpfohleneInstandhaltungsruecklage } from "./costs/instandhaltungsruecklage";
import { berechneKaufnebenkosten } from "./costs/kaufnebenkosten";
import { berechneFinanzierung, berechneGesamtinvestition } from "./financing/darlehen";
import { berechneTilgungsplan } from "./financing/tilgungsplan";
import { berechneBreakevenKaufpreis } from "./rendite/breakeven";
import { berechneRenditeKennzahlen } from "./rendite/renditekennzahlen";
import { berechneVermoegensverlauf } from "./rendite/vermoegensverlauf";
import { schaetzeZvEAusBrutto } from "./tax/zve-schaetzung";
import { VERMOEGENSVERLAUF_MAX_JAHRE } from "./constants";
import type { CalculationResult, Meilensteine, ProfileInput, PropertyInput, ReferenceDataSnapshot } from "./types";

/**
 * Orchestriert die gesamte Kennzahlen-Berechnung für ein Objekt. Einzige
 * Stelle, die UI-Code oder Server Actions importieren sollen — alle
 * Submodule bleiben intern austauschbar.
 */
export function berechneObjekt(
  property: PropertyInput,
  profile: ProfileInput,
  referenceData: ReferenceDataSnapshot,
  optionen: { steuerjahr?: number; bezugsjahr?: number } = {}
): CalculationResult {
  const steuerjahr = optionen.steuerjahr ?? new Date().getFullYear();
  const bezugsjahr = optionen.bezugsjahr ?? new Date().getFullYear();

  const zvEEffektiv = profile.zvEOverride
    ? profile.zuVersteuerndesEinkommenJaehrlich
    : schaetzeZvEAusBrutto(profile.bruttoEinkommenMonatlich * 12);

  const kaufnebenkosten = berechneKaufnebenkosten(property, referenceData);
  const gewerke = berechneGewerkeAuswertung(property.gewerke, property.wohnflaeche, referenceData);

  const sofortinvestitionEuro =
    property.sanierungsmodus === "GRANULAR" ? gewerke.summeGesamtEuro : property.sofortinvestitionPauschal;

  const instandhaltungEmpfohlen = berechneEmpfohleneInstandhaltungsruecklage(
    property.baujahr,
    property.wohnflaeche,
    gewerke.risikoScore,
    referenceData,
    bezugsjahr
  );
  const instandhaltungTatsaechlichMonatlich = property.instandhaltungsruecklageOverride
    ? property.instandhaltungsruecklageMonatlich
    : instandhaltungEmpfohlen.empfohleneRuecklageMonatlich;

  const finanzierung = berechneFinanzierung(property.financing, {
    kaufpreis: property.kaufpreis,
    kaufnebenkostenEuro: kaufnebenkosten.summeEuro,
    sofortinvestitionEuro,
  });

  const tilgungsplan = berechneTilgungsplan(
    finanzierung.darlehenssummeEuro,
    property.financing.zinssatzProzent,
    property.financing.anfaenglicheTilgungProzent,
    VERMOEGENSVERLAUF_MAX_JAHRE
  );

  const rendite = berechneRenditeKennzahlen({
    property,
    kaufpreis: property.kaufpreis,
    gesamtinvestitionEuro: finanzierung.gesamtinvestitionEuro,
    eigenkapitalEinsatzEuro: finanzierung.eigenkapitalEinsatzEuro,
    instandhaltungsruecklageTatsaechlichMonatlich: instandhaltungTatsaechlichMonatlich,
    tilgungsplanJahr1: tilgungsplan[0],
    zuVersteuerndesEinkommenJaehrlich: zvEEffektiv,
    steuerjahr,
  });

  const volltilgungEintrag = tilgungsplan.find((j) => j.restschuldEnde <= 0.01 && j.restschuldStart > 0.01);
  const meilensteine: Meilensteine = {
    zinsbindungEndeJahr: property.financing.zinsbindungJahre,
    volltilgungJahr: volltilgungEintrag?.jahr ?? null,
  };

  const vermoegensverlauf = berechneVermoegensverlauf({
    kaufpreis: property.kaufpreis,
    wertsteigerungProzentJaehrlich: property.wertsteigerungProzentJaehrlich,
    kostensteigerungProzentJaehrlich: property.kostensteigerungProzentJaehrlich,
    tilgungsplan,
    rendite,
    mietsteigerungProzentJaehrlich: property.mietsteigerungProzentJaehrlich,
  });

  const evaluateCashflowFuerKaufpreis = (hypothetischerKaufpreis: number): number => {
    const hypKaufnebenkosten = berechneKaufnebenkosten(
      { ...property, kaufpreis: hypothetischerKaufpreis },
      referenceData
    );
    const hypFinanzierung = berechneFinanzierung(property.financing, {
      kaufpreis: hypothetischerKaufpreis,
      kaufnebenkostenEuro: hypKaufnebenkosten.summeEuro,
      sofortinvestitionEuro,
    });
    const hypTilgungsplanJahr1 = berechneTilgungsplan(
      hypFinanzierung.darlehenssummeEuro,
      property.financing.zinssatzProzent,
      property.financing.anfaenglicheTilgungProzent,
      1
    )[0];
    const hypRendite = berechneRenditeKennzahlen({
      property,
      kaufpreis: hypothetischerKaufpreis,
      gesamtinvestitionEuro: hypFinanzierung.gesamtinvestitionEuro,
      eigenkapitalEinsatzEuro: hypFinanzierung.eigenkapitalEinsatzEuro,
      instandhaltungsruecklageTatsaechlichMonatlich: instandhaltungTatsaechlichMonatlich,
      tilgungsplanJahr1: hypTilgungsplanJahr1,
      zuVersteuerndesEinkommenJaehrlich: zvEEffektiv,
      steuerjahr,
    });
    return hypRendite.monatlicherCashflowNachSteuer;
  };

  const breakeven = berechneBreakevenKaufpreis(property.kaufpreis, evaluateCashflowFuerKaufpreis, 0);

  const affordability = berechneAffordability({
    profile,
    neueFinanzierungsrateMonatlich: tilgungsplan[0]
      ? round2((tilgungsplan[0].zinszahlung + tilgungsplan[0].tilgungszahlung) / 12)
      : 0,
    eigenkapitalEinsatzEuro: finanzierung.eigenkapitalEinsatzEuro,
  });

  const rechnetSich = rendite.monatlicherCashflowNachSteuer >= 0 && affordability.ampel !== "ROT";
  let meldung: string;
  if (rechnetSich) {
    meldung = "Das Objekt rechnet sich nach aktueller Kalkulation: positiver Cashflow nach Steuer.";
  } else if (rendite.monatlicherCashflowNachSteuer < 0 && breakeven.erreichbar && breakeven.differenzZuAktuellemKaufpreis) {
    meldung = `Lohnt sich unter den aktuellen Annahmen nicht — bei ${formatEuro(
      breakeven.differenzZuAktuellemKaufpreis
    )} weniger Kaufpreis (${formatEuro(breakeven.breakevenKaufpreis ?? 0)} statt ${formatEuro(
      property.kaufpreis
    )}) würde der Cashflow ausgeglichen sein.`;
  } else if (rendite.monatlicherCashflowNachSteuer < 0) {
    meldung = "Lohnt sich unter den aktuellen Annahmen auch bei deutlich niedrigerem Kaufpreis nicht (Cashflow bleibt negativ).";
  } else {
    meldung = "Cashflow ist positiv, aber die Finanzierbarkeit (Schuldendienst/Liquidität) ist laut Profil-Check kritisch.";
  }

  const instandhaltung = {
    ...instandhaltungEmpfohlen,
    tatsaechlichMonatlich: instandhaltungTatsaechlichMonatlich,
    istOverride: property.instandhaltungsruecklageOverride,
  };

  const verhandlungsargumente = ermittleVerhandlungsargumente({
    gewerkePosten: gewerke.posten,
    gewerkKostenReferenz: referenceData.gewerkKosten,
    wohnflaeche: property.wohnflaeche,
    instandhaltung,
    cashflowNachSteuerMonatlich: rendite.monatlicherCashflowNachSteuer,
    aktuellerKaufpreis: property.kaufpreis,
    breakevenKaufpreis: breakeven.breakevenKaufpreis,
    differenzZuAktuellemKaufpreis: breakeven.differenzZuAktuellemKaufpreis,
    objekttyp: property.objekttyp,
    lagetyp: property.lagetyp,
    kaufpreisfaktorAktuell: rendite.kaufpreisfaktor,
    bruttomietrenditeAktuellProzent: rendite.bruttomietrenditeProzent,
    jahreskaltmiete: rendite.jahreskaltmiete,
    kaufpreisfaktorReferenzByObjekttypLagetyp: referenceData.kaufpreisfaktorReferenzByObjekttypLagetyp,
  });

  return {
    kaufnebenkosten,
    gewerke,
    instandhaltung,
    finanzierung,
    tilgungsplan,
    rendite,
    vermoegensverlauf,
    meilensteine,
    breakeven,
    affordability,
    dealBreaker: { rechnetSich, meldung },
    verhandlungsargumente,
  };
}

function formatEuro(n: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export { berechneGesamtinvestition };
