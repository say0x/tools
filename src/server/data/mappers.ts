import type {
  Asset,
  Property,
  PropertyFinancing,
  PropertyGewerk,
  PropertyExit,
  UserProfile,
  UserLiability,
  Wertpapierposition,
  Tagesgeldkonto,
} from "@/generated/prisma/client";
import type { PropertyInput, ProfileInput } from "@/server/calc/types";
import type { PropertyFormValues } from "@/server/actions/property";
import type { SparpositionFormValues } from "@/server/actions/finanzuebersicht";

type PropertyWithRelations = Property & {
  financing: PropertyFinancing | null;
  gewerke: PropertyGewerk[];
  exit: PropertyExit | null;
};

export type PropertyWithAsset = PropertyWithRelations & { asset: Asset };

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

    gebaeudeWohnflaecheGesamt: row.gebaeudeWohnflaecheGesamt,
    miteigentumsanteilProzent: row.miteigentumsanteilProzent,
    miteigentumsanteilOverride: row.miteigentumsanteilOverride,

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
      sofortSanieren: g.sofortSanieren,
    })),

    exit: row.exit
      ? {
          geplant: row.exit.geplant,
          haltedauerJahre: row.exit.haltedauerJahre,
        }
      : { geplant: false, haltedauerJahre: 10 },
  };
}

// Einzige Quelle für die Profil-Standardwerte, solange noch kein UserProfile
// existiert — von hier auch von src/app/profil/page.tsx für die Formular-
// Vorbelegung importiert, statt dieselben Zahlen ein zweites Mal hart zu
// codieren (die beiden Kopien liefen sonst bei einer künftigen Änderung
// unbemerkt auseinander). Die Prisma-Schema-@default-Werte auf UserProfile
// bleiben bewusst eine dritte, separate Deklaration — Prisma kann keine
// TS-Konstante importieren, die greift ohnehin nur beim Anlegen einer neuen
// Zeile, nicht bei diesem Vorher-existiert-noch-nichts-Fallback.
export const PROFIL_DEFAULT_WERTE = {
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
  cashflowStartverlustMaxProzentKaltmiete: 30,
  cashflowUmschlagjahr: 10,
} as const;

export function toProfileInput(row: (UserProfile & { liabilities: UserLiability[] }) | null): ProfileInput {
  if (!row) {
    return { ...PROFIL_DEFAULT_WERTE, liabilities: [] };
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
    cashflowStartverlustMaxProzentKaltmiete: row.cashflowStartverlustMaxProzentKaltmiete,
    cashflowUmschlagjahr: row.cashflowUmschlagjahr,
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

/**
 * Zerlegt validierte PropertyFormValues in die Prisma-Create/Update-Form.
 * Geteilt zwischen den Server Actions (erstelleObjekt/aktualisiereObjekt) und
 * scripts/import-objekte.ts — Server Actions dürfen aus einer "use server"-Datei
 * nur async Funktionen exportieren, daher lebt dieser synchrone Helper hier statt dort.
 */
export function splitPropertyData(data: PropertyFormValues) {
  const { name, besitzstatus, financing, gewerke, exit, kaufdatum, ...property } = data;
  // kaufdatum kommt als "YYYY-MM-DD"-String vom HTML-Date-Input — Prisma
  // erwartet für DateTime-Spalten ein vollständiges ISO-8601-DateTime, keinen reinen Datums-String.
  // besitzstatus liegt auf der gemeinsamen Asset-Tabelle, nicht auf Property.
  return { name, besitzstatus, property: { ...property, kaufdatum: new Date(kaufdatum) }, financing, gewerke, exit };
}

export function toPropertyFormValues(row: PropertyWithAsset): PropertyFormValues {
  const input = toPropertyInput(row);
  return {
    name: row.asset.name,
    ...input,
    kaufdatum: row.kaufdatum.toISOString().slice(0, 10),
    besitzstatus: row.asset.besitzstatus,
    ansprechpartnerName: row.ansprechpartnerName,
    ansprechpartnerTelefon: row.ansprechpartnerTelefon,
    ansprechpartnerEmail: row.ansprechpartnerEmail,
    ansprechpartnerNotizen: row.ansprechpartnerNotizen,
    notizen: row.notizen,
    quelleUrl: row.quelleUrl,
    gewerke: row.gewerke.map((g) => ({
      gewerk: g.gewerk,
      zustand: g.zustand,
      eigentumsTyp: g.eigentumsTyp,
      geschaetzteKostenOverride: g.geschaetzteKostenOverride,
      kommentar: g.kommentar ?? "",
      baujahr: g.baujahr,
      verglasung: g.verglasung,
      sofortSanieren: g.sofortSanieren,
    })),
  };
}

export function toSparpositionFormValues(
  wertpapiere: (Wertpapierposition & { asset: Asset })[],
  tagesgeld: (Tagesgeldkonto & { asset: Asset })[]
): SparpositionFormValues[] {
  return [
    ...wertpapiere.map((w) => ({
      assetId: w.asset.id,
      art: "WERTPAPIERDEPOT" as const,
      name: w.asset.name,
      besitzstatus: w.asset.besitzstatus,
      betrag: w.betrag,
      renditeProzentJaehrlich: w.renditeProzentJaehrlich,
      sparplanBetragMonatlich: w.sparplanBetragMonatlich,
      sparplanSteigerungProzentJaehrlich: w.sparplanSteigerungProzentJaehrlich,
    })),
    ...tagesgeld.map((t) => ({
      assetId: t.asset.id,
      art: "TAGESGELD" as const,
      name: t.asset.name,
      besitzstatus: t.asset.besitzstatus,
      betrag: t.betrag,
      renditeProzentJaehrlich: t.zinsProzentJaehrlich,
      sparplanBetragMonatlich: t.sparplanBetragMonatlich,
      sparplanSteigerungProzentJaehrlich: t.sparplanSteigerungProzentJaehrlich,
    })),
  ];
}
