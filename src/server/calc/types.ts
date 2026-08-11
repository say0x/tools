// Domain types for the calculation engine. Deliberately decoupled from
// Prisma — these are plain string-literal unions whose values match the
// Prisma enum names 1:1, so Property/UserProfile rows can be passed in
// directly without an import from the generated client.

import type { Verhandlungsargument } from "./analyse/verhandlungsargumente";
export type { Verhandlungsargument } from "./analyse/verhandlungsargumente";

export const BUNDESLAENDER = [
  "BADEN_WUERTTEMBERG",
  "BAYERN",
  "BERLIN",
  "BRANDENBURG",
  "BREMEN",
  "HAMBURG",
  "HESSEN",
  "MECKLENBURG_VORPOMMERN",
  "NIEDERSACHSEN",
  "NORDRHEIN_WESTFALEN",
  "RHEINLAND_PFALZ",
  "SAARLAND",
  "SACHSEN",
  "SACHSEN_ANHALT",
  "SCHLESWIG_HOLSTEIN",
  "THUERINGEN",
] as const;
export type Bundesland = (typeof BUNDESLAENDER)[number];

export const LAGETYPEN = ["LAENDLICH", "KLEINSTADT", "GROSSSTADT"] as const;
export type Lagetyp = (typeof LAGETYPEN)[number];

export const OBJEKTTYPEN = ["ETW", "MEHRFAMILIENHAUS", "HAUS"] as const;
export type Objekttyp = (typeof OBJEKTTYPEN)[number];

export const SANIERUNGSMODI = ["PAUSCHAL", "GRANULAR"] as const;
export type Sanierungsmodus = (typeof SANIERUNGSMODI)[number];

export const FINANZIERUNGSARTEN = ["FINANZIERUNG_100", "FINANZIERUNG_110", "MANUELL"] as const;
export type Finanzierungsart = (typeof FINANZIERUNGSARTEN)[number];

export const GEWERKE = [
  "DACH",
  "FENSTER",
  "HEIZUNG",
  "ELEKTRIK",
  "SANITAER_BAEDER",
  "MAUERWERK_FASSADE",
  "BODENBELAEGE",
  "SONSTIGES",
] as const;
export type Gewerk = (typeof GEWERKE)[number];

export const EIGENTUMSTYPEN = ["SONDEREIGENTUM", "GEMEINSCHAFTSEIGENTUM"] as const;
export type EigentumsTyp = (typeof EIGENTUMSTYPEN)[number];

export interface PropertyGewerkInput {
  gewerk: Gewerk;
  zustand: number; // 1 (sehr gut) – 6 (sehr schlecht)
  eigentumsTyp: EigentumsTyp;
  geschaetzteKostenOverride?: number | null;
}

export interface PropertyFinancingInput {
  eigenkapital: number;
  zinssatzProzent: number;
  anfaenglicheTilgungProzent: number;
  zinsbindungJahre: number;
  finanzierungsart: Finanzierungsart;
  eigenkapitalquoteManuellProzent?: number | null;
}

export interface PropertyExitInput {
  geplant: boolean;
  haltedauerJahre: number;
}

export interface PropertyInput {
  kaufpreis: number;
  wohnflaeche: number;
  bundesland: Bundesland;
  lagetyp: Lagetyp;
  objekttyp: Objekttyp;
  baujahr: number;
  anzahlEinheiten: number;

  grunderwerbsteuerProzent: number;
  grunderwerbsteuerOverride: boolean;
  notarProzent: number;
  notarOverride: boolean;
  grundbuchProzent: number;
  grundbuchOverride: boolean;
  maklerprovisionProzent: number;
  maklerprovisionOverride: boolean;

  sanierungsmodus: Sanierungsmodus;
  sofortinvestitionPauschal: number;

  kaltmieteMonatlich: number;
  mietsteigerungProzentJaehrlich: number;

  wertsteigerungProzentJaehrlich: number;
  kostensteigerungProzentJaehrlich: number;

  hausgeldUmlagefaehigMonatlich: number;
  hausgeldNichtUmlagefaehigMonatlich: number;
  grundsteuerJaehrlich: number;
  instandhaltungsruecklageMonatlich: number;
  instandhaltungsruecklageOverride: boolean;
  verwaltungskostenMonatlich: number;
  leerstandsquoteProzent: number;
  versicherungJaehrlich: number;
  versicherungUmlagefaehig: boolean;

  afaSatzProzent: number;
  afaSonderabschreibung: boolean;

  financing: PropertyFinancingInput;
  gewerke: PropertyGewerkInput[];
  exit: PropertyExitInput;
}

export interface UserLiabilityInput {
  bezeichnung: string;
  monatlicheRate: number;
  restschuld: number;
}

export interface ProfileInput {
  nettoEinkommenMonatlich: number;
  bruttoEinkommenMonatlich: number;
  zuVersteuerndesEinkommenJaehrlich: number;
  zvEOverride: boolean;
  fixkostenMonatlich: number;
  vorhandenesEigenkapital: number;
  maxSchuldendienstquoteProzent: number;
  mindestLiquiditaetsreserveEuro: number;
  liabilities: UserLiabilityInput[];
}

export interface ReferenceDataSnapshot {
  grunderwerbsteuerByBundesland: Record<Bundesland, number>;
  mietpreisByBundeslandLagetyp: Record<string, number>; // key: `${bundesland}:${lagetyp}`
  gewerkKosten: Record<Gewerk, { min: number; max: number }>;
  instandhaltungssaetze: { von: number; bis: number | null; satz: number }[];
  notarProzentDefault: number;
  grundbuchProzentDefault: number;
  kaufpreisfaktorReferenzByObjekttypLagetyp: Record<string, number>; // key: `${objekttyp}:${lagetyp}`
}

export interface KaufnebenkostenResult {
  grunderwerbsteuerProzent: number;
  grunderwerbsteuerEuro: number;
  notarProzent: number;
  notarEuro: number;
  grundbuchProzent: number;
  grundbuchEuro: number;
  maklerprovisionProzent: number;
  maklerprovisionEuro: number;
  summeEuro: number;
}

export interface GewerkKostenResult {
  gewerk: Gewerk;
  zustand: number;
  eigentumsTyp: EigentumsTyp;
  geschaetzteKostenEuro: number;
  istOverride: boolean;
}

export interface GewerkeAuswertung {
  posten: GewerkKostenResult[];
  summeSondereigentumEuro: number;
  summeGemeinschaftseigentumEuro: number;
  summeGesamtEuro: number;
  risikoScore: number; // 1 (top) – 6 (kritisch), gewichtet nach Kostenanteil
}

export interface FinanzierungResult {
  gesamtinvestitionEuro: number;
  darlehenssummeEuro: number;
  eigenkapitalEinsatzEuro: number;
}

export interface TilgungsplanJahr {
  jahr: number;
  restschuldStart: number;
  zinszahlung: number;
  tilgungszahlung: number;
  restschuldEnde: number;
}

export interface RenditeKennzahlen {
  jahreskaltmiete: number;
  bruttomietrenditeProzent: number;
  nettomietrenditeProzent: number;
  kaufpreisfaktor: number;
  effektiveJahresmiete: number;
  laufendeKostenJaehrlich: number;
  afaJaehrlich: number;
  monatlicherCashflowVorSteuer: number;
  monatlicherCashflowNachSteuer: number;
  eigenkapitalrenditeProzent: number;
  grenzsteuersatzProzent: number;
}

export interface VermoegensverlaufJahr {
  jahr: number;
  restschuld: number;
  immobilienwert: number;
  eigenkapitalanteil: number;
  /** Inflationsbereinigt (heutige Kaufkraft), auf Basis der Kostensteigerungsrate abgezinst. */
  immobilienwertReal: number;
  eigenkapitalanteilReal: number;
  cashflowVorSteuerJahr: number;
  cashflowNachSteuerJahr: number;
  kumulierterCashflowVorSteuer: number;
  kumulierterCashflowNachSteuer: number;
}

export interface Meilensteine {
  zinsbindungEndeJahr: number;
  volltilgungJahr: number | null;
}

export interface BreakevenResult {
  erreichbar: boolean;
  breakevenKaufpreis: number | null;
  differenzZuAktuellemKaufpreis: number | null;
}

export interface AffordabilityResult {
  schuldendienstquoteProzent: number;
  liquiditaetsreserveNachKaufEuro: number;
  ampel: "GRUEN" | "GELB" | "ROT";
  begruendung: string[];
}

export interface InstandhaltungResultForCalc {
  basisSatzProM2ProJahr: number;
  risikoMultiplikator: number;
  empfohleneRuecklageMonatlich: number;
  tatsaechlichMonatlich: number;
  istOverride: boolean;
}

export interface CalculationResult {
  kaufnebenkosten: KaufnebenkostenResult;
  gewerke: GewerkeAuswertung;
  instandhaltung: InstandhaltungResultForCalc;
  finanzierung: FinanzierungResult;
  tilgungsplan: TilgungsplanJahr[];
  rendite: RenditeKennzahlen;
  vermoegensverlauf: VermoegensverlaufJahr[];
  meilensteine: Meilensteine;
  breakeven: BreakevenResult;
  affordability: AffordabilityResult;
  dealBreaker: { rechnetSich: boolean; meldung: string };
  verhandlungsargumente: Verhandlungsargument[];
}
