import type {
  Asset,
  Property,
  PropertyFinancing,
  PropertyGewerk,
  PropertyExit,
  UserProfile,
  UserLiability,
} from "@/generated/prisma/client";
import type { PropertyInput, ProfileInput } from "@/server/calc/types";
import type { PropertyFormValues } from "@/server/actions/property";

type PropertyWithRelations = Property & {
  financing: PropertyFinancing | null;
  gewerke: PropertyGewerk[];
  exit: PropertyExit | null;
};

type PropertyWithAsset = PropertyWithRelations & { asset: Asset };

export function toPropertyInput(row: PropertyWithRelations): PropertyInput {
  return {
    kaufpreis: row.kaufpreis,
    wohnflaeche: row.wohnflaeche,
    bundesland: row.bundesland,
    lagetyp: row.lagetyp,
    objekttyp: row.objekttyp,
    baujahr: row.baujahr,
    anzahlEinheiten: row.anzahlEinheiten,

    grunderwerbsteuerProzent: row.grunderwerbsteuerProzent,
    grunderwerbsteuerOverride: row.grunderwerbsteuerOverride,
    notarProzent: row.notarProzent,
    notarOverride: row.notarOverride,
    grundbuchProzent: row.grundbuchProzent,
    grundbuchOverride: row.grundbuchOverride,
    maklerprovisionProzent: row.maklerprovisionProzent,
    maklerprovisionOverride: row.maklerprovisionOverride,

    sanierungsmodus: row.sanierungsmodus,
    sofortinvestitionPauschal: row.sofortinvestitionPauschal,

    kaltmieteMonatlich: row.kaltmieteMonatlich,
    mietsteigerungProzentJaehrlich: row.mietsteigerungProzentJaehrlich,

    wertsteigerungProzentJaehrlich: row.wertsteigerungProzentJaehrlich,
    kostensteigerungProzentJaehrlich: row.kostensteigerungProzentJaehrlich,

    hausgeldUmlagefaehigMonatlich: row.hausgeldUmlagefaehigMonatlich,
    hausgeldNichtUmlagefaehigMonatlich: row.hausgeldNichtUmlagefaehigMonatlich,
    grundsteuerJaehrlich: row.grundsteuerJaehrlich,
    instandhaltungsruecklageMonatlich: row.instandhaltungsruecklageMonatlich,
    instandhaltungsruecklageOverride: row.instandhaltungsruecklageOverride,
    verwaltungskostenMonatlich: row.verwaltungskostenMonatlich,
    leerstandsquoteProzent: row.leerstandsquoteProzent,
    versicherungJaehrlich: row.versicherungJaehrlich,
    versicherungUmlagefaehig: row.versicherungUmlagefaehig,

    afaSatzProzent: row.afaSatzProzent,
    afaSatzProzentOverride: row.afaSatzProzentOverride,
    afaSonderabschreibung: row.afaSonderabschreibung,

    financing: row.financing
      ? {
          eigenkapital: row.financing.eigenkapital,
          zinssatzProzent: row.financing.zinssatzProzent,
          anfaenglicheTilgungProzent: row.financing.anfaenglicheTilgungProzent,
          zinsbindungJahre: row.financing.zinsbindungJahre,
          finanzierungsart: row.financing.finanzierungsart,
          eigenkapitalquoteManuellProzent: row.financing.eigenkapitalquoteManuellProzent,
          anschlusszinsAufschlagProzent: row.financing.anschlusszinsAufschlagProzent,
          sondertilgungProzent: row.financing.sondertilgungProzent,
          sondertilgungMaxProzent: row.financing.sondertilgungMaxProzent,
        }
      : {
          eigenkapital: 0,
          zinssatzProzent: 3.5,
          anfaenglicheTilgungProzent: 2,
          zinsbindungJahre: 10,
          finanzierungsart: "FINANZIERUNG_110",
          eigenkapitalquoteManuellProzent: null,
          anschlusszinsAufschlagProzent: 1,
          sondertilgungProzent: 0,
          sondertilgungMaxProzent: 5,
        },

    gewerke: row.gewerke.map((g) => ({
      gewerk: g.gewerk,
      zustand: g.zustand,
      eigentumsTyp: g.eigentumsTyp,
      geschaetzteKostenOverride: g.geschaetzteKostenOverride,
      baujahr: g.baujahr,
      verglasung: g.verglasung,
    })),

    exit: row.exit
      ? {
          geplant: row.exit.geplant,
          haltedauerJahre: row.exit.haltedauerJahre,
        }
      : { geplant: false, haltedauerJahre: 10 },
  };
}

export function toProfileInput(row: (UserProfile & { liabilities: UserLiability[] }) | null): ProfileInput {
  if (!row) {
    return {
      nettoEinkommenMonatlich: 0,
      bruttoEinkommenMonatlich: 0,
      zuVersteuerndesEinkommenJaehrlich: 0,
      zvEOverride: false,
      fixkostenMonatlich: 0,
      vorhandenesEigenkapital: 0,
      maxSchuldendienstquoteProzent: 35,
      mindestLiquiditaetsreserveEuro: 10000,
      mietanrechnungProzent: 80,
      mindestEigenkapitalrenditeProzent: 4,
      eigenkapitalPruefungAbEuro: 5000,
      liabilities: [],
    };
  }

  return {
    nettoEinkommenMonatlich: row.nettoEinkommenMonatlich,
    bruttoEinkommenMonatlich: row.bruttoEinkommenMonatlich,
    zuVersteuerndesEinkommenJaehrlich: row.zuVersteuerndesEinkommenJaehrlich,
    zvEOverride: row.zvEOverride,
    fixkostenMonatlich: row.fixkostenMonatlich,
    vorhandenesEigenkapital: row.vorhandenesEigenkapital,
    maxSchuldendienstquoteProzent: row.maxSchuldendienstquoteProzent,
    mindestLiquiditaetsreserveEuro: row.mindestLiquiditaetsreserveEuro,
    mietanrechnungProzent: row.mietanrechnungProzent,
    mindestEigenkapitalrenditeProzent: row.mindestEigenkapitalrenditeProzent,
    eigenkapitalPruefungAbEuro: row.eigenkapitalPruefungAbEuro,
    liabilities: row.liabilities.map((l) => ({
      bezeichnung: l.bezeichnung,
      monatlicheRate: l.monatlicheRate,
      restschuld: l.restschuld,
    })),
  };
}

export const PROPERTY_INCLUDE = {
  asset: true,
  financing: true,
  gewerke: true,
  exit: true,
} as const;

export function toPropertyFormValues(row: PropertyWithAsset): PropertyFormValues {
  const input = toPropertyInput(row);
  return {
    name: row.asset.name,
    ...input,
    ansprechpartnerName: row.ansprechpartnerName,
    ansprechpartnerTelefon: row.ansprechpartnerTelefon,
    ansprechpartnerEmail: row.ansprechpartnerEmail,
    ansprechpartnerNotizen: row.ansprechpartnerNotizen,
    gewerke: row.gewerke.map((g) => ({
      gewerk: g.gewerk,
      zustand: g.zustand,
      eigentumsTyp: g.eigentumsTyp,
      geschaetzteKostenOverride: g.geschaetzteKostenOverride,
      kommentar: g.kommentar ?? "",
      baujahr: g.baujahr,
      verglasung: g.verglasung,
    })),
  };
}
