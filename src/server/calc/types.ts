// Domain types for the calculation engine. Deliberately decoupled from
// Prisma — these are plain string-literal unions whose values match the
// Prisma enum names 1:1, so Property/UserProfile rows can be passed in
// directly without an import from the generated client.
//
// Feldweise Referenz-Tabellen für diese Typen: docs/tools/immobilien-rechner.md

import type { Verhandlungsargument } from "./analyse/verhandlungsargumente";
import type { AnnahmenWarnung } from "./analyse/annahmen-warnungen";
import type { ExitSzenarioResult } from "./exit/exit-szenario";
export type { Verhandlungsargument } from "./analyse/verhandlungsargumente";
export type { AnnahmenWarnung } from "./analyse/annahmen-warnungen";
export type { ExitSzenarioResult } from "./exit/exit-szenario";

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

/** Nur für Gewerk "FENSTER" relevant — beeinflusst die Kostenschätzung zusätzlich zum Zustand. */
export const VERGLASUNGSARTEN = ["EINFACH", "DOPPEL", "DREIFACH"] as const;
export type Verglasungsart = (typeof VERGLASUNGSARTEN)[number];

export interface PropertyGewerkInput {
  gewerk: Gewerk;
  zustand: number; // 1 (sehr gut) – 6 (sehr schlecht)
  eigentumsTyp: EigentumsTyp;
  geschaetzteKostenOverride?: number | null;
  /** Baujahr/Einbaujahr dieses Gewerks — optional, für Alter-Kontext in Formel & Verhandlungsargumenten. */
  baujahr?: number | null;
  /** Nur bei gewerk === "FENSTER" ausgewertet. */
  verglasung?: Verglasungsart | null;
  /** Bei false zählt der Kostenbetrag nicht in die Sofortinvestition, sondern wird nur als "für später eingeplant" ausgewiesen. */
  sofortSanieren: boolean;
}

export interface PropertyFinancingInput {
  eigenkapital: number;
  zinssatzProzent: number;
  anfaenglicheTilgungProzent: number;
  zinsbindungJahre: number;
  finanzierungsart: Finanzierungsart;
  eigenkapitalquoteManuellProzent?: number | null;
  /** Anschlussfinanzierung: Aufschlag in Prozentpunkten auf zinssatzProzent, ab Ablauf der Zinsbindung angenommen. */
  anschlusszinsAufschlagProzent: number;
  /** Geplante jährliche Sondertilgung, in % der ursprünglichen Darlehenssumme. 0 = keine geplant. */
  sondertilgungProzent: number;
  /** Vertraglich maximal erlaubte jährliche Sondertilgung (% der ursprünglichen Darlehenssumme). */
  sondertilgungMaxProzent: number;
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

  /** Gesamtwohnfläche des Gebäudes/der WEG — Basis für die automatische Miteigentumsanteil-Herleitung. */
  gebaeudeWohnflaecheGesamt: number | null;
  /** computed-with-override: ohne Override aus eigeneWohnflaeche/gebaeudeWohnflaecheGesamt hergeleitet (bzw. 100% ohne Gesamtwohnfläche). */
  miteigentumsanteilProzent: number;
  miteigentumsanteilOverride: boolean;

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
  /** computed-with-override: ohne Override wird der AfA-Satz aus dem Baujahr hergeleitet (§7 Abs. 4 EStG). */
  afaSatzProzentOverride: boolean;
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
  /** Anteil der erwarteten Nettomiete, den die Bank als Einkommen anrechnet (Kapitaldienstfähigkeit). */
  mietanrechnungProzent: number;
  /** Mindest-EK-Rendite, unterhalb derer die Kapitaleffizienz-Ampel warnt. */
  mindestEigenkapitalrenditeProzent: number;
  /** EK-Einsatz, ab dem die Kapitaleffizienz-Prüfung überhaupt greift. */
  eigenkapitalPruefungAbEuro: number;
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
  nutzungsdauerJahreByGewerk: Record<Gewerk, number>;
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
  baujahr?: number | null;
  alterJahre?: number | null;
  verglasung?: Verglasungsart | null;
  verglasungsfaktor?: number | null;
  /** Bei false zählt der Betrag nicht in die Sofortinvestition, sondern nur informativ als "für später eingeplant". */
  sofortSanieren: boolean;
}

export interface GewerkeAuswertung {
  posten: GewerkKostenResult[];
  summeSondereigentumEuro: number;
  summeGemeinschaftseigentumEuro: number;
  summeGesamtEuro: number;
  /** Summe der Posten mit sofortSanieren=true — fließt in die Sofortinvestition ein. */
  summeSofortEuro: number;
  /** Summe der Posten mit sofortSanieren=false — informativ, NICHT in der Sofortinvestition enthalten. */
  summeSpaeterEuro: number;
  /** Tatsächlich angesetzter Miteigentumsanteil (%) für Gemeinschaftseigentum-Kosten — aus Wohnfläche hergeleitet oder manuell überschrieben. */
  miteigentumsanteilProzentEffektiv: number;
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
  /** Für dieses Jahr angesetzter Zinssatz — ändert sich einmalig beim Sprung in die Anschlussfinanzierung. */
  zinssatzProzent: number;
  /** Zusätzliche Sondertilgung in diesem Jahr (bereits in restschuldEnde berücksichtigt, aber NICHT in tilgungszahlung). */
  sondertilgungBetrag: number;
}

export interface RenditeKennzahlen {
  jahreskaltmiete: number;
  bruttomietrenditeProzent: number;
  nettomietrenditeProzent: number;
  kaufpreisfaktor: number;
  effektiveJahresmiete: number;
  laufendeKostenJaehrlich: number;
  /** Tatsächlich angesetzter AfA-Satz (%) — aus Baujahr hergeleitet oder manuell überschrieben. */
  afaSatzProzentEffektiv: number;
  afaJaehrlich: number;
  monatlicherCashflowVorSteuer: number;
  monatlicherCashflowNachSteuer: number;
  /** null bei EK-Einsatz 0 € (z. B. 100%+-Finanzierung) — rechnerisch nicht definiert statt irreführend 0%. */
  eigenkapitalrenditeProzent: number | null;
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
  /** Laufende Kosten in diesem Jahr, bereits mit der Kostensteigerungsrate fortgeschrieben. */
  kostenJahr: number;
  /** Steuerlast in diesem Jahr (negativ = Steuererstattung) — Differenz aus cashflowVorSteuerJahr und cashflowNachSteuerJahr. */
  steuerJahr: number;
}

/**
 * Verfügbares (liquides) Geld über die Zeit — Wertpapier-/Tagesgeld-Salden
 * plus, bei Immobilien, der akkumulierte Cashflow ab heute (nicht der
 * Immobilienwert oder Eigenkapitalanteil, der steckt im Objekt).
 */
export interface PortfolioJahr {
  /** Jahre ab heute (0 = heute). */
  jahr: number;
  kalenderjahr: number;
  gesamtNominal: number;
  /** Inflationsbereinigt (heutige Kaufkraft). */
  gesamtReal: number;
  /** Nominaler Wert je Position, Key = Asset-/Objekt-ID. */
  proPosition: Record<string, number>;
}

export interface Meilensteine {
  zinsbindungEndeJahr: number;
  volltilgungJahr: number | null;
  /** Angenommener Zinssatz der Anschlussfinanzierung ab Jahr zinsbindungEndeJahr + 1 (zinssatzProzent + Aufschlag). */
  anschlusszinssatzProzent: number;
}

export interface BreakevenResult {
  erreichbar: boolean;
  breakevenKaufpreis: number | null;
  differenzZuAktuellemKaufpreis: number | null;
}

export interface AffordabilityResult {
  schuldendienstquoteProzent: number;
  liquiditaetsreserveNachKaufEuro: number;
  /** Von der Bank angerechneter Anteil der Nettomiete (€/Monat), der die Schuldendienstquote entlastet. */
  angerechneteMieteMonatlich: number;
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

/** Eigenständiges Signal, ob das eingesetzte Eigenkapital effizient arbeitet — unabhängig von Cashflow/Finanzierbarkeit. */
export interface KapitaleffizienzResult {
  ampel: "GRUEN" | "GELB" | "ROT";
  begruendung: string[];
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
  kapitaleffizienz: KapitaleffizienzResult;
  dealBreaker: { rechnetSich: boolean; meldung: string };
  verhandlungsargumente: Verhandlungsargument[];
  annahmenWarnungen: AnnahmenWarnung[];
  exitSzenario: ExitSzenarioResult | null;
}
