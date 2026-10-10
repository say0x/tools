/**
 * Einzige Liste aller Tools der Plattform. Daraus leiten sich ab: Kopfzeile,
 * „Alle Tools“-Panel (Desktop und mobil), Befehlspalette (Strg+K), die
 * Werkzeug-Übersicht der Startseite, Bereichs-Tabs innerhalb eines Tools und
 * die E2E-Routenliste. Skalierungsregeln (ADR-0012), per Test erzwungen:
 * höchstens KOPFZEILE_MAX Tools in der Kopfzeile, höchstens
 * TOOLS_JE_KATEGORIE_MAX Tools je Kategorie — darüber eine neue Kategorie.
 *
 * Bewusst ohne Imports: e2e/routes.ts lädt diese Datei direkt in Playwright,
 * das weder den @/-Alias noch Next.js kennt (tool-registry.test.ts prüft das).
 * Ablauf „neues Tool hinzufügen“: docs/development/workflow.md
 */

/** Reihenfolge = Anzeigereihenfolge der Gruppen im Panel und auf der Startseite. */
export const KATEGORIEN = [
  { id: "finanzen", label: "Finanzen & Immobilien" },
  { id: "gesundheit", label: "Gesundheit & Fitness" },
  { id: "rechner", label: "Rechner" },
  { id: "einstellungen", label: "Einstellungen & Daten" },
] as const;

type KategorieId = (typeof KATEGORIEN)[number]["id"];

export const KOPFZEILE_MAX = 4;
export const TOOLS_JE_KATEGORIE_MAX = 8;

export interface ToolLink {
  href: string;
  label: string;
}

interface ToolBereich extends ToolLink {
  /** Query-Parameter, die beim Tab-Wechsel erhalten bleiben (z. B. das gewählte Datum). */
  behaeltParameter?: readonly string[];
}

export interface Tool {
  /** Einstiegsseite; Unterseiten (…/neu, …/[id]) liegen darunter. */
  href: string;
  /** Kurzer Name für die Kopfzeile. */
  navLabel: string;
  /** Voller Name für Panel, Suche und Startseite. */
  titel: string;
  /** Ein Satz: wofür das Tool da ist (Panel, Suche, Startseite). */
  beschreibung: string;
  kategorie: KategorieId;
  /** Dauerhaft in der Kopfzeile sichtbar — nur für die meistgenutzten Tools. */
  kopfzeile?: boolean;
  /** Zusätzliche Suchbegriffe für die Befehlspalette (Synonyme, Fachbegriffe). */
  stichworte?: readonly string[];
  /** Tab-Leiste innerhalb des Tools (erster Eintrag = Einstiegsseite). */
  bereiche?: readonly ToolBereich[];
  /** Direkt anspringbare Aktionen, z. B. „Neues Objekt anlegen“ — erscheinen in der Suche. */
  schnellzugriffe?: readonly ToolLink[];
}

export const STARTSEITE: ToolLink = { href: "/", label: "Start" };

export const TOOLS: readonly Tool[] = [
  {
    href: "/immobilien/objekte",
    navLabel: "Immobilien",
    titel: "Immobilien-Rechner",
    beschreibung: "Objekte erfassen, Kennzahlen berechnen, vergleichen — rechnet sich der Kauf?",
    kategorie: "finanzen",
    kopfzeile: true,
    stichworte: ["Rendite", "Cashflow", "Kaufpreis", "Miete", "Finanzierung", "Wohnung", "Haus", "Bodenrichtwert", "Objekt"],
    schnellzugriffe: [
      { href: "/immobilien/objekte/neu", label: "Neues Objekt anlegen" },
      { href: "/immobilien/objekte/vergleich", label: "Objekte vergleichen" },
    ],
  },
  {
    href: "/finanzuebersicht",
    navLabel: "Finanzübersicht",
    titel: "Finanzübersicht",
    beschreibung: "Wertpapiere, Tagesgeld & Immobilien-Cashflow zusammen betrachten — wie viel Geld hast du in wie vielen Jahren wirklich zur Verfügung?",
    kategorie: "finanzen",
    kopfzeile: true,
    stichworte: ["Vermögen", "Depot", "ETF", "Tagesgeld", "Sparrate", "Inflation", "Wertpapiere"],
  },
  {
    href: "/szenarien",
    navLabel: "Szenarien",
    titel: "Szenarien",
    beschreibung: "„Was wäre, wenn…“ — Käufe, Verkäufe, Sparraten & Anschaffungen durchspielen, ohne deine echten Daten zu verändern.",
    kategorie: "finanzen",
    kopfzeile: true,
    stichworte: ["Was wäre wenn", "Planung", "Simulation", "Anschaffung"],
    schnellzugriffe: [{ href: "/szenarien/neu", label: "Neues Szenario anlegen" }],
  },
  {
    href: "/kaufen-oder-anlegen",
    navLabel: "Kaufen oder Anlegen?",
    titel: "Kaufen oder Anlegen?",
    beschreibung: "Ein Objekt aus deiner Bibliothek gegen die Alternative vergleichen, dasselbe Eigenkapital stattdessen anzulegen.",
    kategorie: "finanzen",
    stichworte: ["Opportunitätskosten", "ETF", "Eigenkapital", "Alternative"],
  },
  {
    href: "/fitness",
    navLabel: "Fitness",
    titel: "Fitness & Ernährung",
    beschreibung: "Kalorienbedarf, Ernährungstagebuch mit Lebensmittel-Datenbank, Training, Gewichtstrend und Sport-Rechner.",
    kategorie: "gesundheit",
    kopfzeile: true,
    stichworte: ["Kalorien", "Abnehmen", "Makros", "Protein", "Wasser", "Schritte", "Sport", "Diät", "Foto"],
    bereiche: [
      { href: "/fitness", label: "Heute", behaeltParameter: ["datum"] },
      { href: "/fitness/ernaehrung", label: "Ernährung", behaeltParameter: ["datum"] },
      { href: "/fitness/training", label: "Training" },
      { href: "/fitness/gewicht", label: "Gewicht" },
      { href: "/fitness/rechner", label: "Sport-Rechner" },
      { href: "/fitness/profil", label: "Ziele & Körperdaten" },
    ],
  },
  {
    href: "/sparziel",
    navLabel: "Sparziel-Rechner",
    titel: "Sparziel-Rechner",
    beschreibung: "Freistehender Zinseszins-Rechner: Kapitalverlauf einer Sparrate über Zeit, und wann ein Zielbetrag erreicht ist.",
    kategorie: "rechner",
    stichworte: ["Zinseszins", "Sparplan", "Sparen", "Zielbetrag"],
  },
  {
    href: "/steuerrechner",
    navLabel: "Steuerrechner",
    titel: "Steuerrechner",
    beschreibung: "Freistehender Grenzsteuersatz-Rechner, unabhängig vom Profil — schnell ein anderes Einkommen durchspielen.",
    kategorie: "rechner",
    stichworte: ["Einkommensteuer", "Grenzsteuersatz", "Brutto", "Netto", "zvE", "Soli"],
  },
  {
    href: "/kreditvergleich",
    navLabel: "Kreditvergleich",
    titel: "Kreditvergleich",
    beschreibung: "Zwei Finanzierungsangebote nebeneinander durchrechnen, ohne dass ein Objekt angelegt werden muss.",
    kategorie: "rechner",
    stichworte: ["Darlehen", "Zinsen", "Tilgung", "Baufinanzierung", "Anschlussfinanzierung"],
  },
  {
    href: "/profil",
    navLabel: "Profil",
    titel: "Profil",
    beschreibung: "Einkommen, Budget und Schwellen hinterlegen — steuert die Ampeln und Kennzahlen aller anderen Tools. Dazu Daten-Backup.",
    kategorie: "einstellungen",
    stichworte: ["Einkommen", "Fixkosten", "Kredite", "Backup", "Export", "Wiederherstellen"],
  },
  {
    href: "/nutzer",
    navLabel: "Nutzer",
    titel: "Nutzer",
    beschreibung: "Lokale Test-User anlegen und zwischen ihnen wechseln — jeder hat eigene Daten.",
    kategorie: "einstellungen",
    stichworte: ["Benutzer", "Wechseln", "Konto"],
  },
  {
    href: "/integrationen",
    navLabel: "Integrationen & API",
    titel: "Integrationen & API",
    beschreibung: "Home Assistant, iOS-Kurzbefehle und eigene Skripte per REST-API anbinden — Tokens verwalten, fertige Konfiguration kopieren.",
    kategorie: "einstellungen",
    stichworte: ["Home Assistant", "API", "Token", "Kurzbefehl", "Shortcut", "REST", "OpenAPI", "Smart-Waage"],
  },
  {
    href: "/immobilien/referenzdaten",
    navLabel: "Referenzdaten",
    titel: "Referenzdaten",
    beschreibung: "Startwerte der Immobilien-Rechnung pflegen: Grunderwerbsteuer, Mietpreise, Instandhaltung, Kaufpreisfaktoren.",
    kategorie: "einstellungen",
    stichworte: ["Grunderwerbsteuer", "Mietspiegel", "Instandhaltung", "Kaufpreisfaktor", "Nutzungsdauer", "Startwerte"],
  },
];

export const KOPFZEILEN_TOOLS = TOOLS.filter((t) => t.kopfzeile);

export interface ToolKategorie {
  id: KategorieId;
  label: string;
  tools: readonly Tool[];
}

/** Tools nach Kategorie in Anzeigereihenfolge; leere Kategorien entfallen. */
export function toolsNachKategorie(tools: readonly Tool[] = TOOLS): ToolKategorie[] {
  return KATEGORIEN.map((k) => ({ id: k.id, label: k.label, tools: tools.filter((t) => t.kategorie === k.id) })).filter((k) => k.tools.length > 0);
}

export function kategorieLabel(id: KategorieId): string {
  return KATEGORIEN.find((k) => k.id === id)?.label ?? id;
}

/** Ist der Link für den aktuellen Pfad aktiv? "/" nur exakt, sonst auch für Unterseiten. */
export function istAktiv(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Das Tool, zu dem ein Pfad gehört (bei verschachtelten Pfaden das spezifischste). */
export function toolFuerPfad(pathname: string): Tool | undefined {
  return TOOLS.filter((t) => istAktiv(t.href, pathname)).sort((a, b) => b.href.length - a.href.length)[0];
}
