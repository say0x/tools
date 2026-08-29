import { z } from "zod";
import {
  BUNDESLAENDER,
  EIGENTUMSTYPEN,
  FINANZIERUNGSARTEN,
  GEWERKE,
  LAGETYPEN,
  OBJEKTTYPEN,
  SANIERUNGSMODI,
  VERGLASUNGSARTEN,
} from "@/server/calc/types";
import { BESITZSTAENDE } from "@/lib/asset";
import { propertySchema, type PropertyFormValues } from "./property-schema";
import { BESCHAEFTIGUNGSSTATUS, profileSchema, type ProfileFormValues } from "./profile-schema";
import { szenarioSchema, type SzenarioFormValues } from "./szenario-schema";
import { sparpositionSchema, type SparpositionFormValues } from "./finanzuebersicht-schema";
import { SZENARIO_AENDERUNG_TYPEN } from "./szenario-schema";

/**
 * Strukturelle Validierung des JSON-Uploads für den Backup-Restore (Rang 3
 * der Weiterentwicklung-Priorisierung) — bewusst nur Objekte, Profil,
 * Sparpositionen und Szenarien (die "persönlichen" Daten), NICHT die separat
 * unter /immobilien/referenzdaten administrierten Referenzwerte/Standardwerte:
 * ein versehentliches Zurücksetzen dieser selten geänderten Admin-Daten wäre
 * unnötiges Risiko. Der Export enthält sie weiterhin (siehe export.ts) —
 * dieses Schema ignoriert sie beim Restore einfach (kein .strict()).
 *
 * Zweistufig: dieses Schema prüft nur Struktur/Typen und wandelt
 * Decimal-Strings (aus Prisma Decimal.toJSON()) in number um. Die
 * fachlichen Wertebereiche (min/max) prüft anschließend restore.ts über
 * dieselben Zod-Schemas, die auch die normalen Formulare validieren
 * (propertySchema, profileSchema, szenarioSchema, sparpositionSchema) — so
 * bleiben Wertebereiche eine einzige Quelle statt zweifach gepflegt zu werden.
 *
 * Referenz: docs/tools/weitere-rechner.md
 */

const id = z.string().min(1, "Fehlende ID");
const decimal = z.coerce.number({ error: "Erwarte eine Zahl" });
const decimalNullable = z.union([decimal, z.null()]);
const isoDatetime = z.coerce.date({ error: "Ungültiges Datum" });

const rawFinancingSchema = z.object({
  id,
  eigenkapital: decimal,
  zinssatzProzent: decimal,
  anfaenglicheTilgungProzent: decimal,
  zinsbindungJahre: z.number(),
  finanzierungsart: z.enum(FINANZIERUNGSARTEN),
  eigenkapitalquoteManuellProzent: decimalNullable,
  anschlusszinsAufschlagProzent: decimal,
  sondertilgungProzent: decimal,
  sondertilgungMaxProzent: decimal,
});

const rawGewerkSchema = z.object({
  id,
  gewerk: z.enum(GEWERKE),
  zustand: z.number(),
  eigentumsTyp: z.enum(EIGENTUMSTYPEN),
  geschaetzteKostenOverride: decimalNullable,
  kommentar: z.string().nullable(),
  baujahr: z.number().nullable(),
  verglasung: z.enum(VERGLASUNGSARTEN).nullable(),
  sofortSanieren: z.boolean(),
});

const rawExitSchema = z.object({
  id,
  geplant: z.boolean(),
  haltedauerJahre: z.number(),
});

const rawPropertySchema = z.object({
  id,
  assetId: id,
  createdAt: isoDatetime,
  asset: z.object({ id, name: z.string(), besitzstatus: z.enum(BESITZSTAENDE) }),
  kaufpreis: decimal,
  kaufdatum: isoDatetime,
  wohnflaeche: z.number(),
  bundesland: z.enum(BUNDESLAENDER),
  lagetyp: z.enum(LAGETYPEN),
  objekttyp: z.enum(OBJEKTTYPEN),
  baujahr: z.number(),
  anzahlEinheiten: z.number(),
  grunderwerbsteuerProzent: decimal,
  grunderwerbsteuerOverride: z.boolean(),
  notarProzent: decimal,
  notarOverride: z.boolean(),
  grundbuchProzent: decimal,
  grundbuchOverride: z.boolean(),
  maklerprovisionProzent: decimal,
  maklerprovisionOverride: z.boolean(),
  sanierungsmodus: z.enum(SANIERUNGSMODI),
  sofortinvestitionPauschal: decimal,
  gebaeudeWohnflaecheGesamt: z.number().nullable(),
  miteigentumsanteilProzent: decimal,
  miteigentumsanteilOverride: z.boolean(),
  kaltmieteMonatlich: decimal,
  mietsteigerungProzentJaehrlich: decimal,
  wertsteigerungProzentJaehrlich: decimal,
  kostensteigerungProzentJaehrlich: decimal,
  hausgeldUmlagefaehigMonatlich: decimal,
  hausgeldNichtUmlagefaehigMonatlich: decimal,
  grundsteuerJaehrlich: decimal,
  instandhaltungsruecklageMonatlich: decimal,
  instandhaltungsruecklageOverride: z.boolean(),
  verwaltungskostenMonatlich: decimal,
  leerstandsquoteProzent: decimal,
  versicherungJaehrlich: decimal,
  versicherungUmlagefaehig: z.boolean(),
  afaSatzProzent: decimal,
  afaSatzProzentOverride: z.boolean(),
  afaSonderabschreibung: z.boolean(),
  ansprechpartnerName: z.string(),
  ansprechpartnerTelefon: z.string(),
  ansprechpartnerEmail: z.string(),
  ansprechpartnerNotizen: z.string(),
  notizen: z.string(),
  quelleUrl: z.string(),
  financing: rawFinancingSchema.nullable(),
  gewerke: z.array(rawGewerkSchema),
  exit: rawExitSchema.nullable(),
});
export type RawProperty = z.infer<typeof rawPropertySchema>;

const rawLiabilitySchema = z.object({
  id,
  bezeichnung: z.string(),
  monatlicheRate: decimal,
  restschuld: decimal,
});

const rawProfilSchema = z.object({
  id,
  nettoEinkommenMonatlich: decimal,
  bruttoEinkommenMonatlich: decimal,
  zuVersteuerndesEinkommenJaehrlich: decimal,
  zvEOverride: z.boolean(),
  fixkostenMonatlich: decimal,
  vorhandenesEigenkapital: decimal,
  maxSchuldendienstquoteProzent: decimal,
  mindestLiquiditaetsreserveEuro: decimal,
  mietanrechnungProzent: decimal,
  mindestEigenkapitalrenditeProzent: decimal,
  eigenkapitalPruefungAbEuro: decimal,
  cashflowStartverlustMaxProzentKaltmiete: decimal,
  cashflowUmschlagjahr: z.number(),
  gehaltssteigerungProzentJaehrlich: decimal,
  inflationProzentJaehrlich: decimal,
  bundesland: z.enum(BUNDESLAENDER),
  kirchensteuerpflichtig: z.boolean(),
  beschaeftigungsstatus: z.enum(BESCHAEFTIGUNGSSTATUS),
  gesetzlichKrankenversichert: z.boolean(),
  kinderlos: z.boolean(),
  liabilities: z.array(rawLiabilitySchema),
});
export type RawProfil = z.infer<typeof rawProfilSchema>;

// ladeSparpositionen() liefert die rohen Wertpapierposition-/Tagesgeldkonto-
// Zeilen (nicht wie propertySchema/szenarioSchema auf FormValues transformiert)
// — mit dem Zinsfeld unterschiedlich benannt (renditeProzentJaehrlich bzw.
// zinsProzentJaehrlich) und art/name/besitzstatus auf dem verschachtelten
// asset-Objekt statt flach, wie ein Blick in einen echten Export zeigt.
const rawSparpositionBasis = {
  id,
  assetId: id,
  createdAt: isoDatetime,
  asset: z.object({ name: z.string(), besitzstatus: z.enum(BESITZSTAENDE) }),
  betrag: decimal,
  sparplanBetragMonatlich: decimal,
  sparplanSteigerungProzentJaehrlich: decimal,
};
const rawWertpapierSchema = z.object({ ...rawSparpositionBasis, renditeProzentJaehrlich: decimal });
const rawTagesgeldSchema = z.object({ ...rawSparpositionBasis, zinsProzentJaehrlich: decimal });
export type RawWertpapier = z.infer<typeof rawWertpapierSchema>;
export type RawTagesgeld = z.infer<typeof rawTagesgeldSchema>;

const rawAenderungSchema = z.object({
  id,
  typ: z.enum(SZENARIO_AENDERUNG_TYPEN),
  assetId: z.string().nullable(),
  neueSparrateMonatlich: decimalNullable,
  jahrAbHeute: z.number().nullable(),
  bezeichnung: z.string().nullable(),
  betrag: decimalNullable,
  alternativanlageRenditeProzent: decimalNullable,
});

const rawSzenarioSchema = z.object({
  id,
  createdAt: isoDatetime,
  name: z.string(),
  startjahr: z.number(),
  notizen: z.string(),
  aenderungen: z.array(rawAenderungSchema),
});
export type RawSzenario = z.infer<typeof rawSzenarioSchema>;

/**
 * .passthrough() statt .strict(): der Export enthält zusätzlich
 * exportiertAm/referenzdaten/standardwerte, die dieses Schema bewusst nicht
 * kennt (s. o.) — ein hochgeladener vollständiger Backup-Export soll daran
 * nicht scheitern.
 */
export const backupSchema = z
  .object({
    exportiertAm: z.string().optional(),
    objekte: z.array(rawPropertySchema),
    profil: rawProfilSchema.nullable(),
    sparpositionen: z.object({
      wertpapiere: z.array(rawWertpapierSchema),
      tagesgeld: z.array(rawTagesgeldSchema),
    }),
    szenarien: z.array(rawSzenarioSchema),
  })
  .passthrough();
export type Backup = z.infer<typeof backupSchema>;

function sammleFehler(meldungen: string[], praefix: string, result: { success: boolean; error?: { issues: { message: string }[] } }) {
  if (!result.success) {
    meldungen.push(`${praefix}: ${result.error!.issues.map((i) => i.message).join(" · ")}`);
  }
}

function zuPropertyFormValues(raw: RawProperty): PropertyFormValues {
  return {
    name: raw.asset.name,
    besitzstatus: raw.asset.besitzstatus,
    kaufpreis: raw.kaufpreis,
    kaufdatum: raw.kaufdatum.toISOString().slice(0, 10),
    wohnflaeche: raw.wohnflaeche,
    bundesland: raw.bundesland,
    lagetyp: raw.lagetyp,
    objekttyp: raw.objekttyp,
    baujahr: raw.baujahr,
    anzahlEinheiten: raw.anzahlEinheiten,
    grunderwerbsteuerProzent: raw.grunderwerbsteuerProzent,
    grunderwerbsteuerOverride: raw.grunderwerbsteuerOverride,
    notarProzent: raw.notarProzent,
    notarOverride: raw.notarOverride,
    grundbuchProzent: raw.grundbuchProzent,
    grundbuchOverride: raw.grundbuchOverride,
    maklerprovisionProzent: raw.maklerprovisionProzent,
    maklerprovisionOverride: raw.maklerprovisionOverride,
    sanierungsmodus: raw.sanierungsmodus,
    sofortinvestitionPauschal: raw.sofortinvestitionPauschal,
    gebaeudeWohnflaecheGesamt: raw.gebaeudeWohnflaecheGesamt,
    miteigentumsanteilProzent: raw.miteigentumsanteilProzent,
    miteigentumsanteilOverride: raw.miteigentumsanteilOverride,
    kaltmieteMonatlich: raw.kaltmieteMonatlich,
    mietsteigerungProzentJaehrlich: raw.mietsteigerungProzentJaehrlich,
    wertsteigerungProzentJaehrlich: raw.wertsteigerungProzentJaehrlich,
    kostensteigerungProzentJaehrlich: raw.kostensteigerungProzentJaehrlich,
    hausgeldUmlagefaehigMonatlich: raw.hausgeldUmlagefaehigMonatlich,
    hausgeldNichtUmlagefaehigMonatlich: raw.hausgeldNichtUmlagefaehigMonatlich,
    grundsteuerJaehrlich: raw.grundsteuerJaehrlich,
    instandhaltungsruecklageMonatlich: raw.instandhaltungsruecklageMonatlich,
    instandhaltungsruecklageOverride: raw.instandhaltungsruecklageOverride,
    verwaltungskostenMonatlich: raw.verwaltungskostenMonatlich,
    leerstandsquoteProzent: raw.leerstandsquoteProzent,
    versicherungJaehrlich: raw.versicherungJaehrlich,
    versicherungUmlagefaehig: raw.versicherungUmlagefaehig,
    afaSatzProzent: raw.afaSatzProzent,
    afaSatzProzentOverride: raw.afaSatzProzentOverride,
    afaSonderabschreibung: raw.afaSonderabschreibung,
    ansprechpartnerName: raw.ansprechpartnerName,
    ansprechpartnerTelefon: raw.ansprechpartnerTelefon,
    ansprechpartnerEmail: raw.ansprechpartnerEmail,
    ansprechpartnerNotizen: raw.ansprechpartnerNotizen,
    notizen: raw.notizen,
    quelleUrl: raw.quelleUrl,
    financing: raw.financing
      ? {
          eigenkapital: raw.financing.eigenkapital,
          zinssatzProzent: raw.financing.zinssatzProzent,
          anfaenglicheTilgungProzent: raw.financing.anfaenglicheTilgungProzent,
          zinsbindungJahre: raw.financing.zinsbindungJahre,
          finanzierungsart: raw.financing.finanzierungsart,
          eigenkapitalquoteManuellProzent: raw.financing.eigenkapitalquoteManuellProzent,
          anschlusszinsAufschlagProzent: raw.financing.anschlusszinsAufschlagProzent,
          sondertilgungProzent: raw.financing.sondertilgungProzent,
          sondertilgungMaxProzent: raw.financing.sondertilgungMaxProzent,
        }
      : { eigenkapital: 0, zinssatzProzent: 3.5, anfaenglicheTilgungProzent: 2, zinsbindungJahre: 10, finanzierungsart: "FINANZIERUNG_110", eigenkapitalquoteManuellProzent: null, anschlusszinsAufschlagProzent: 1, sondertilgungProzent: 0, sondertilgungMaxProzent: 5 },
    gewerke: raw.gewerke.map((g) => ({
      gewerk: g.gewerk,
      zustand: g.zustand,
      eigentumsTyp: g.eigentumsTyp,
      geschaetzteKostenOverride: g.geschaetzteKostenOverride,
      kommentar: g.kommentar ?? "",
      baujahr: g.baujahr,
      verglasung: g.verglasung,
      sofortSanieren: g.sofortSanieren,
    })),
    exit: raw.exit ? { geplant: raw.exit.geplant, haltedauerJahre: raw.exit.haltedauerJahre } : { geplant: false, haltedauerJahre: 10 },
  };
}

function zuProfileFormValues(raw: RawProfil): ProfileFormValues {
  return {
    nettoEinkommenMonatlich: raw.nettoEinkommenMonatlich,
    bruttoEinkommenMonatlich: raw.bruttoEinkommenMonatlich,
    zuVersteuerndesEinkommenJaehrlich: raw.zuVersteuerndesEinkommenJaehrlich,
    zvEOverride: raw.zvEOverride,
    fixkostenMonatlich: raw.fixkostenMonatlich,
    vorhandenesEigenkapital: raw.vorhandenesEigenkapital,
    maxSchuldendienstquoteProzent: raw.maxSchuldendienstquoteProzent,
    mindestLiquiditaetsreserveEuro: raw.mindestLiquiditaetsreserveEuro,
    mietanrechnungProzent: raw.mietanrechnungProzent,
    mindestEigenkapitalrenditeProzent: raw.mindestEigenkapitalrenditeProzent,
    eigenkapitalPruefungAbEuro: raw.eigenkapitalPruefungAbEuro,
    cashflowStartverlustMaxProzentKaltmiete: raw.cashflowStartverlustMaxProzentKaltmiete,
    cashflowUmschlagjahr: raw.cashflowUmschlagjahr,
    bundesland: raw.bundesland,
    kirchensteuerpflichtig: raw.kirchensteuerpflichtig,
    beschaeftigungsstatus: raw.beschaeftigungsstatus,
    gesetzlichKrankenversichert: raw.gesetzlichKrankenversichert,
    kinderlos: raw.kinderlos,
    liabilities: raw.liabilities.map((l) => ({ id: l.id, bezeichnung: l.bezeichnung, monatlicheRate: l.monatlicheRate, restschuld: l.restschuld })),
  };
}

function zuSparpositionFormValues(raw: RawWertpapier | RawTagesgeld, art: "WERTPAPIERDEPOT" | "TAGESGELD"): SparpositionFormValues {
  return {
    assetId: raw.assetId,
    art,
    name: raw.asset.name,
    besitzstatus: raw.asset.besitzstatus,
    betrag: raw.betrag,
    renditeProzentJaehrlich: "renditeProzentJaehrlich" in raw ? raw.renditeProzentJaehrlich : raw.zinsProzentJaehrlich,
    sparplanBetragMonatlich: raw.sparplanBetragMonatlich,
    sparplanSteigerungProzentJaehrlich: raw.sparplanSteigerungProzentJaehrlich,
  };
}

function zuSzenarioFormValues(raw: RawSzenario): SzenarioFormValues {
  return {
    name: raw.name,
    startjahr: raw.startjahr,
    notizen: raw.notizen,
    aenderungen: raw.aenderungen.map((a) => ({
      typ: a.typ,
      assetId: a.assetId,
      neueSparrateMonatlich: a.neueSparrateMonatlich,
      jahrAbHeute: a.jahrAbHeute,
      bezeichnung: a.bezeichnung,
      betrag: a.betrag,
      alternativanlageRenditeProzent: a.alternativanlageRenditeProzent,
    })),
  };
}

// Gehalt/Inflation liegen fachlich auf UserProfile, werden aber im normalen
// Formular-Flow über finanzuebersichtSchema statt profileSchema validiert
// (siehe finanzuebersicht-schema.ts) — hier direkt mit denselben Grenzen
// geprüft, statt für zwei Felder ein drittes Schema zu importieren.
const gehaltInflationSchema = z.object({
  gehaltssteigerungProzentJaehrlich: z
    .number({ error: "Gehaltssteigerung muss eine Zahl sein" })
    .min(0, "Gehaltssteigerung darf nicht negativ sein")
    .max(100, "Gehaltssteigerung liegt außerhalb eines realistischen Bereichs"),
  inflationProzentJaehrlich: z
    .number({ error: "Inflationsrate muss eine Zahl sein" })
    .min(0, "Inflationsrate darf nicht negativ sein")
    .max(50, "Inflationsrate liegt außerhalb eines realistischen Bereichs"),
});

/**
 * Prüft Struktur UND Fachwerte des Uploads. Gibt bei Erfolg die validierten,
 * für den Restore direkt verwendbaren FormValues zurück (jeweils inkl. der
 * Original-IDs, getrennt mitgeführt) — bei Fehlern eine vollständige Liste
 * aller gefundenen Probleme (nicht nur des ersten), damit ein kaputtes
 * Backup in einem Durchgang repariert werden kann.
 */
export function validiereBackup(json: unknown):
  | { success: true; data: ValidiertesBackup }
  | { success: false; error: string } {
  const strukturResult = backupSchema.safeParse(json);
  if (!strukturResult.success) {
    return { success: false, error: `Datei hat nicht das erwartete Backup-Format: ${strukturResult.error.issues.map((i) => i.message).join(" · ")}` };
  }
  const raw = strukturResult.data;
  const fehler: string[] = [];

  const objekte = raw.objekte.map((o) => {
    const values = zuPropertyFormValues(o);
    const result = propertySchema.safeParse(values);
    sammleFehler(fehler, `Objekt "${o.asset.name}"`, result);
    return { id: o.id, assetId: o.assetId, createdAt: o.createdAt, financingId: o.financing?.id ?? null, exitId: o.exit?.id ?? null, gewerkeIds: o.gewerke.map((g) => g.id), values };
  });

  let profil: { id: string; liabilityIds: string[]; values: ProfileFormValues; gehaltInflation: z.infer<typeof gehaltInflationSchema> } | null = null;
  if (raw.profil) {
    const values = zuProfileFormValues(raw.profil);
    sammleFehler(fehler, "Profil", profileSchema.safeParse(values));
    const gehaltInflationResult = gehaltInflationSchema.safeParse({
      gehaltssteigerungProzentJaehrlich: raw.profil.gehaltssteigerungProzentJaehrlich,
      inflationProzentJaehrlich: raw.profil.inflationProzentJaehrlich,
    });
    sammleFehler(fehler, "Profil", gehaltInflationResult);
    profil = {
      id: raw.profil.id,
      liabilityIds: raw.profil.liabilities.map((l) => l.id),
      values,
      gehaltInflation: gehaltInflationResult.success ? gehaltInflationResult.data : { gehaltssteigerungProzentJaehrlich: 2, inflationProzentJaehrlich: 2 },
    };
  }

  const sparpositionen = [
    ...raw.sparpositionen.wertpapiere.map((s) => ({ raw: s, art: "WERTPAPIERDEPOT" as const })),
    ...raw.sparpositionen.tagesgeld.map((s) => ({ raw: s, art: "TAGESGELD" as const })),
  ].map(({ raw: s, art }) => {
    const values = zuSparpositionFormValues(s, art);
    sammleFehler(fehler, `Sparposition "${s.asset.name}"`, sparpositionSchema.safeParse(values));
    return { assetId: s.assetId, createdAt: s.createdAt, values };
  });

  const bekannteAssetIds = new Set([...objekte.map((o) => o.assetId), ...sparpositionen.map((s) => s.assetId)]);

  const szenarien = raw.szenarien.map((sz) => {
    const values = zuSzenarioFormValues(sz);
    sammleFehler(fehler, `Szenario "${sz.name}"`, szenarioSchema.safeParse(values));
    for (const a of sz.aenderungen) {
      if (a.assetId && !bekannteAssetIds.has(a.assetId)) {
        fehler.push(`Szenario "${sz.name}": referenziert ein Objekt/eine Sparposition, das/die nicht im Backup enthalten ist`);
      }
    }
    return { id: sz.id, createdAt: sz.createdAt, aenderungenIds: sz.aenderungen.map((a) => a.id), values };
  });

  if (fehler.length > 0) {
    return { success: false, error: fehler.join("\n") };
  }

  return {
    success: true,
    data: {
      exportiertAm: raw.exportiertAm ?? null,
      objekte,
      profil,
      sparpositionen,
      szenarien,
    },
  };
}

export interface ValidiertesBackup {
  exportiertAm: string | null;
  objekte: {
    id: string;
    assetId: string;
    createdAt: Date;
    financingId: string | null;
    exitId: string | null;
    gewerkeIds: string[];
    values: PropertyFormValues;
  }[];
  profil: { id: string; liabilityIds: string[]; values: ProfileFormValues; gehaltInflation: { gehaltssteigerungProzentJaehrlich: number; inflationProzentJaehrlich: number } } | null;
  sparpositionen: { assetId: string; createdAt: Date; values: SparpositionFormValues }[];
  szenarien: { id: string; createdAt: Date; aenderungenIds: string[]; values: SzenarioFormValues }[];
}
