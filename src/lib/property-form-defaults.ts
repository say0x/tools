import type { PropertyFormValues } from "@/server/actions/property";

export function defaultPropertyFormValues(): PropertyFormValues {
  return {
    name: "",
    kaufpreis: 250000,
    wohnflaeche: 70,
    bundesland: "NORDRHEIN_WESTFALEN",
    lagetyp: "GROSSSTADT",
    objekttyp: "ETW",
    baujahr: 1995,
    anzahlEinheiten: 1,

    grunderwerbsteuerProzent: 0,
    grunderwerbsteuerOverride: false,
    notarGrundbuchProzent: 1.75,
    notarGrundbuchOverride: false,
    maklerprovisionProzent: 0,
    maklerprovisionOverride: false,

    sanierungsmodus: "PAUSCHAL",
    sofortinvestitionPauschal: 0,

    kaltmieteMonatlich: 700,
    mietsteigerungProzentJaehrlich: 1.5,

    hausgeldUmlagefaehigMonatlich: 120,
    hausgeldNichtUmlagefaehigMonatlich: 80,
    instandhaltungsruecklageMonatlich: 0,
    instandhaltungsruecklageOverride: false,
    verwaltungskostenMonatlich: 25,
    leerstandsquoteProzent: 2,
    versicherungJaehrlich: 200,

    afaSatzProzent: 2,
    afaSonderabschreibung: false,

    financing: {
      eigenkapital: 0,
      zinssatzProzent: 3.8,
      anfaenglicheTilgungProzent: 2,
      zinsbindungJahre: 10,
      finanzierungsart: "FINANZIERUNG_110",
      eigenkapitalquoteManuellProzent: 20,
    },
    gewerke: [],
    exit: {
      geplant: false,
      wertsteigerungProzentJaehrlich: 1.5,
      haltedauerJahre: 10,
    },
  };
}
