import type { ProfileInput, PropertyInput, ReferenceDataSnapshot } from "../types";

export const referenceDataFixture: ReferenceDataSnapshot = {
  grunderwerbsteuerByBundesland: {
    BADEN_WUERTTEMBERG: 5,
    BAYERN: 3.5,
    BERLIN: 6,
    BRANDENBURG: 6.5,
    BREMEN: 5,
    HAMBURG: 5.5,
    HESSEN: 6,
    MECKLENBURG_VORPOMMERN: 6,
    NIEDERSACHSEN: 5,
    NORDRHEIN_WESTFALEN: 6.5,
    RHEINLAND_PFALZ: 5,
    SAARLAND: 6.5,
    SACHSEN: 5.5,
    SACHSEN_ANHALT: 5,
    SCHLESWIG_HOLSTEIN: 6.5,
    THUERINGEN: 5,
  },
  mietpreisByBundeslandLagetyp: {
    "NORDRHEIN_WESTFALEN:GROSSSTADT": 10.5,
    "NORDRHEIN_WESTFALEN:KLEINSTADT": 8.4,
    "NORDRHEIN_WESTFALEN:LAENDLICH": 6.3,
  },
  gewerkKosten: {
    DACH: { min: 150, max: 250 },
    HEIZUNG: { min: 100, max: 180 },
    FENSTER: { min: 80, max: 150 },
    ELEKTRIK: { min: 60, max: 120 },
    SANITAER_BAEDER: { min: 400, max: 800 },
    MAUERWERK_FASSADE: { min: 100, max: 200 },
    BODENBELAEGE: { min: 40, max: 80 },
    SONSTIGES: { min: 50, max: 100 },
  },
  instandhaltungssaetze: [
    { von: 0, bis: 21, satz: 7.1 },
    { von: 22, bis: 32, satz: 9.0 },
    { von: 33, bis: null, satz: 11.5 },
  ],
  notarProzentDefault: 1.0,
  grundbuchProzentDefault: 0.5,
  kaufpreisfaktorReferenzByObjekttypLagetyp: {
    "ETW:GROSSSTADT": 28,
    "ETW:KLEINSTADT": 20,
    "ETW:LAENDLICH": 15,
    "MEHRFAMILIENHAUS:GROSSSTADT": 24,
    "MEHRFAMILIENHAUS:KLEINSTADT": 18,
    "MEHRFAMILIENHAUS:LAENDLICH": 14,
    "HAUS:GROSSSTADT": 26,
    "HAUS:KLEINSTADT": 19,
    "HAUS:LAENDLICH": 15,
  },
  nutzungsdauerJahreByGewerk: {
    DACH: 35,
    FENSTER: 30,
    HEIZUNG: 20,
    ELEKTRIK: 40,
    SANITAER_BAEDER: 25,
    MAUERWERK_FASSADE: 40,
    BODENBELAEGE: 20,
    SONSTIGES: 25,
  },
};

export function makePropertyFixture(overrides: Partial<PropertyInput> = {}): PropertyInput {
  return {
    kaufpreis: 300000,
    wohnflaeche: 80,
    bundesland: "NORDRHEIN_WESTFALEN",
    lagetyp: "GROSSSTADT",
    objekttyp: "ETW",
    baujahr: 1990,
    anzahlEinheiten: 1,

    grunderwerbsteuerProzent: 0,
    grunderwerbsteuerOverride: false,
    notarProzent: 1.0,
    notarOverride: false,
    grundbuchProzent: 0.5,
    grundbuchOverride: false,
    maklerprovisionProzent: 0,
    maklerprovisionOverride: false,

    sanierungsmodus: "PAUSCHAL",
    sofortinvestitionPauschal: 0,

    kaltmieteMonatlich: 850,
    mietsteigerungProzentJaehrlich: 1.5,

    wertsteigerungProzentJaehrlich: 2,
    kostensteigerungProzentJaehrlich: 2,

    hausgeldUmlagefaehigMonatlich: 150,
    hausgeldNichtUmlagefaehigMonatlich: 80,
    grundsteuerJaehrlich: 0,
    instandhaltungsruecklageMonatlich: 0,
    instandhaltungsruecklageOverride: false,
    verwaltungskostenMonatlich: 25,
    leerstandsquoteProzent: 2,
    versicherungJaehrlich: 250,
    versicherungUmlagefaehig: false,

    afaSatzProzent: 2,
    afaSatzProzentOverride: false,
    afaSonderabschreibung: false,

    financing: {
      eigenkapital: 60000,
      zinssatzProzent: 3.5,
      anfaenglicheTilgungProzent: 2,
      zinsbindungJahre: 10,
      finanzierungsart: "FINANZIERUNG_110",
      eigenkapitalquoteManuellProzent: null,
      anschlusszinsAufschlagProzent: 0,
      sondertilgungProzent: 0,
      sondertilgungMaxProzent: 5,
    },
    gewerke: [],
    exit: {
      geplant: false,
      haltedauerJahre: 10,
    },
    ...overrides,
  };
}

export function makeProfileFixture(overrides: Partial<ProfileInput> = {}): ProfileInput {
  return {
    nettoEinkommenMonatlich: 4000,
    bruttoEinkommenMonatlich: 5500,
    zuVersteuerndesEinkommenJaehrlich: 65000,
    zvEOverride: true,
    fixkostenMonatlich: 1800,
    vorhandenesEigenkapital: 80000,
    maxSchuldendienstquoteProzent: 35,
    mindestLiquiditaetsreserveEuro: 10000,
    mietanrechnungProzent: 80,
    liabilities: [],
    ...overrides,
  };
}
