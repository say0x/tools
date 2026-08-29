import { prisma } from "@/server/db";
import type { PropertyInput, ProfileInput } from "@/server/calc/types";
import type { PropertyFormValues } from "@/server/actions/property";
import type { SparpositionFormValues } from "@/server/actions/finanzuebersicht";

// Aus dem tatsächlichen Client-Rückgabetyp abgeleitet statt aus den rohen Prisma-Modelltypen einzeln
// re-importiert — bleibt automatisch synchron mit PROPERTY_INCLUDE weiter unten. Geld-/Prozentfelder
// kommen als Decimal aus der DB (siehe schema.prisma) und werden unten in toPropertyInput()/
// toProfileInput()/toSparpositionFormValues() explizit auf `number` konvertiert — bewusst NICHT über
// eine Prisma-Client-Extension zentral gelöst: $extends-Result-Overrides hängen node:util's
// inspect.custom-Symbol an jede so berechnete Zeile (für hübsches console.log), was React Server
// Components beim Übergeben an eine "use client"-Komponente als "kein plain object" ablehnt.
export type PropertyWithAsset = Awaited<ReturnType<typeof prisma.property.findFirstOrThrow<{ include: typeof PROPERTY_INCLUDE }>>>;
type PropertyWithRelations = Omit<PropertyWithAsset, "asset">;
type UserProfileWithLiabilities = Awaited<ReturnType<typeof prisma.userProfile.findFirstOrThrow<{ include: { liabilities: true } }>>>;
export type WertpapierpositionWithAsset = Awaited<ReturnType<typeof prisma.wertpapierposition.findFirstOrThrow<{ include: { asset: true } }>>>;
export type TagesgeldkontoWithAsset = Awaited<ReturnType<typeof prisma.tagesgeldkonto.findFirstOrThrow<{ include: { asset: true } }>>>;

export function toPropertyInput(row: PropertyWithRelations): PropertyInput {
  return {
    kaufpreis: row.kaufpreis.toNumber(),
    wohnflaeche: row.wohnflaeche,
    bundesland: row.bundesland,
    lagetyp: row.lagetyp,
    objekttyp: row.objekttyp,
    baujahr: row.baujahr,
    anzahlEinheiten: row.anzahlEinheiten,

    grunderwerbsteuerProzent: row.grunderwerbsteuerProzent.toNumber(),
    grunderwerbsteuerOverride: row.grunderwerbsteuerOverride,
    notarProzent: row.notarProzent.toNumber(),
    notarOverride: row.notarOverride,
    grundbuchProzent: row.grundbuchProzent.toNumber(),
    grundbuchOverride: row.grundbuchOverride,
    maklerprovisionProzent: row.maklerprovisionProzent.toNumber(),
    maklerprovisionOverride: row.maklerprovisionOverride,

    sanierungsmodus: row.sanierungsmodus,
    sofortinvestitionPauschal: row.sofortinvestitionPauschal.toNumber(),

    gebaeudeWohnflaecheGesamt: row.gebaeudeWohnflaecheGesamt,
    miteigentumsanteilProzent: row.miteigentumsanteilProzent.toNumber(),
    miteigentumsanteilOverride: row.miteigentumsanteilOverride,

    kaltmieteMonatlich: row.kaltmieteMonatlich.toNumber(),
    mietsteigerungProzentJaehrlich: row.mietsteigerungProzentJaehrlich.toNumber(),

    wertsteigerungProzentJaehrlich: row.wertsteigerungProzentJaehrlich.toNumber(),
    kostensteigerungProzentJaehrlich: row.kostensteigerungProzentJaehrlich.toNumber(),

    hausgeldUmlagefaehigMonatlich: row.hausgeldUmlagefaehigMonatlich.toNumber(),
    hausgeldNichtUmlagefaehigMonatlich: row.hausgeldNichtUmlagefaehigMonatlich.toNumber(),
    grundsteuerJaehrlich: row.grundsteuerJaehrlich.toNumber(),
    instandhaltungsruecklageMonatlich: row.instandhaltungsruecklageMonatlich.toNumber(),
    instandhaltungsruecklageOverride: row.instandhaltungsruecklageOverride,
    verwaltungskostenMonatlich: row.verwaltungskostenMonatlich.toNumber(),
    leerstandsquoteProzent: row.leerstandsquoteProzent.toNumber(),
    versicherungJaehrlich: row.versicherungJaehrlich.toNumber(),
    versicherungUmlagefaehig: row.versicherungUmlagefaehig,

    afaSatzProzent: row.afaSatzProzent.toNumber(),
    afaSatzProzentOverride: row.afaSatzProzentOverride,
    afaSonderabschreibung: row.afaSonderabschreibung,

    financing: row.financing
      ? {
          eigenkapital: row.financing.eigenkapital.toNumber(),
          zinssatzProzent: row.financing.zinssatzProzent.toNumber(),
          anfaenglicheTilgungProzent: row.financing.anfaenglicheTilgungProzent.toNumber(),
          zinsbindungJahre: row.financing.zinsbindungJahre,
          finanzierungsart: row.financing.finanzierungsart,
          eigenkapitalquoteManuellProzent: row.financing.eigenkapitalquoteManuellProzent?.toNumber() ?? null,
          anschlusszinsAufschlagProzent: row.financing.anschlusszinsAufschlagProzent.toNumber(),
          sondertilgungProzent: row.financing.sondertilgungProzent.toNumber(),
          sondertilgungMaxProzent: row.financing.sondertilgungMaxProzent.toNumber(),
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
      geschaetzteKostenOverride: g.geschaetzteKostenOverride?.toNumber() ?? null,
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

// Separat von PROFIL_DEFAULT_WERTE: diese Felder gehören nicht zu ProfileInput
// (dem Rechenkern-Typ, siehe calc/types.ts) — nur zum Steuerrechner relevant,
// werden aber ebenfalls von src/app/profil/page.tsx (Formular-Vorbelegung) und
// src/app/steuerrechner/page.tsx (Vorbelegung aus dem Profil) importiert.
export const PROFIL_STEUER_DEFAULT_WERTE = {
  bundesland: "NORDRHEIN_WESTFALEN",
  kirchensteuerpflichtig: false,
  beschaeftigungsstatus: "ANGESTELLT",
  gesetzlichKrankenversichert: true,
  kinderlos: false,
} as const;

export function toProfileInput(row: UserProfileWithLiabilities | null): ProfileInput {
  if (!row) {
    return { ...PROFIL_DEFAULT_WERTE, liabilities: [] };
  }

  return {
    nettoEinkommenMonatlich: row.nettoEinkommenMonatlich.toNumber(),
    bruttoEinkommenMonatlich: row.bruttoEinkommenMonatlich.toNumber(),
    zuVersteuerndesEinkommenJaehrlich: row.zuVersteuerndesEinkommenJaehrlich.toNumber(),
    zvEOverride: row.zvEOverride,
    fixkostenMonatlich: row.fixkostenMonatlich.toNumber(),
    vorhandenesEigenkapital: row.vorhandenesEigenkapital.toNumber(),
    maxSchuldendienstquoteProzent: row.maxSchuldendienstquoteProzent.toNumber(),
    mindestLiquiditaetsreserveEuro: row.mindestLiquiditaetsreserveEuro.toNumber(),
    mietanrechnungProzent: row.mietanrechnungProzent.toNumber(),
    mindestEigenkapitalrenditeProzent: row.mindestEigenkapitalrenditeProzent.toNumber(),
    eigenkapitalPruefungAbEuro: row.eigenkapitalPruefungAbEuro.toNumber(),
    cashflowStartverlustMaxProzentKaltmiete: row.cashflowStartverlustMaxProzentKaltmiete.toNumber(),
    cashflowUmschlagjahr: row.cashflowUmschlagjahr,
    liabilities: row.liabilities.map((l) => ({
      bezeichnung: l.bezeichnung,
      monatlicheRate: l.monatlicheRate.toNumber(),
      restschuld: l.restschuld.toNumber(),
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
      geschaetzteKostenOverride: g.geschaetzteKostenOverride?.toNumber() ?? null,
      kommentar: g.kommentar ?? "",
      baujahr: g.baujahr,
      verglasung: g.verglasung,
      sofortSanieren: g.sofortSanieren,
    })),
  };
}

export function toSparpositionFormValues(
  wertpapiere: WertpapierpositionWithAsset[],
  tagesgeld: TagesgeldkontoWithAsset[]
): SparpositionFormValues[] {
  return [
    ...wertpapiere.map((w) => ({
      assetId: w.asset.id,
      art: "WERTPAPIERDEPOT" as const,
      name: w.asset.name,
      besitzstatus: w.asset.besitzstatus,
      betrag: w.betrag.toNumber(),
      renditeProzentJaehrlich: w.renditeProzentJaehrlich.toNumber(),
      sparplanBetragMonatlich: w.sparplanBetragMonatlich.toNumber(),
      sparplanSteigerungProzentJaehrlich: w.sparplanSteigerungProzentJaehrlich.toNumber(),
    })),
    ...tagesgeld.map((t) => ({
      assetId: t.asset.id,
      art: "TAGESGELD" as const,
      name: t.asset.name,
      besitzstatus: t.asset.besitzstatus,
      betrag: t.betrag.toNumber(),
      renditeProzentJaehrlich: t.zinsProzentJaehrlich.toNumber(),
      sparplanBetragMonatlich: t.sparplanBetragMonatlich.toNumber(),
      sparplanSteigerungProzentJaehrlich: t.sparplanSteigerungProzentJaehrlich.toNumber(),
    })),
  ];
}
