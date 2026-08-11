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
    notarProzent: 1.0,
    notarOverride: false,
    grundbuchProzent: 0.5,
    grundbuchOverride: false,
    maklerprovisionProzent: 0,
    maklerprovisionOverride: false,

    sanierungsmodus: "PAUSCHAL",
    sofortinvestitionPauschal: 0,

    kaltmieteMonatlich: 700,
    mietsteigerungProzentJaehrlich: 1.5,

    wertsteigerungProzentJaehrlich: 2,
    kostensteigerungProzentJaehrlich: 2,

    hausgeldUmlagefaehigMonatlich: 120,
    hausgeldNichtUmlagefaehigMonatlich: 80,
    grundsteuerJaehrlich: 0,
    instandhaltungsruecklageMonatlich: 0,
    instandhaltungsruecklageOverride: false,
    verwaltungskostenMonatlich: 25,
    leerstandsquoteProzent: 2,
    versicherungJaehrlich: 200,
    versicherungUmlagefaehig: false,

    afaSatzProzent: 2,
    afaSonderabschreibung: false,

    ansprechpartnerName: "",
    ansprechpartnerTelefon: "",
    ansprechpartnerEmail: "",
    ansprechpartnerNotizen: "",

    financing: {
      eigenkapital: 0,
      zinssatzProzent: 3.8,
      anfaenglicheTilgungProzent: 2,
      zinsbindungJahre: 10,
      finanzierungsart: "FINANZIERUNG_110",
      eigenkapitalquoteManuellProzent: 20,
      anschlusszinsAufschlagProzent: 1,
      sondertilgungProzent: 0,
      sondertilgungMaxProzent: 5,
    },
    gewerke: [],
    exit: {
      geplant: false,
      haltedauerJahre: 10,
    },
  };
}
