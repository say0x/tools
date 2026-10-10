/**
 * Einzige Liste aller Tools der Plattform. Navigation (Kopfzeile, „Weitere
 * Tools“, mobil), die Werkzeug-Karten der Startseite, die Bereichs-Tabs
 * (z. B. Fitness) und die E2E-Routenliste leiten sich hieraus ab.
 * Reihenfolge = Anzeigereihenfolge.
 *
 * Bewusst ohne Imports: e2e/routes.ts lädt diese Datei direkt in Playwright,
 * das weder den @/-Alias noch Next.js kennt (tool-registry.test.ts prüft das).
 * Ablauf „neues Tool hinzufügen“: docs/development/workflow.md
 */

/** haupt = immer sichtbar in der Kopfzeile; rechner/verwaltung = Menü „Weitere Tools“, durch eine Linie getrennt. */
type ToolGruppe = "haupt" | "rechner" | "verwaltung";

export interface ToolBereich {
  href: string;
  label: string;
}

export interface Tool {
  /** Einstiegsseite; Unterseiten (…/neu, …/[id]) liegen darunter. */
  href: string;
  /** Kurzer Name für Navigation und Menü. */
  navLabel: string;
  /** Voller Name, z. B. auf der Startseiten-Karte. */
  titel: string;
  /** Text der Startseiten-Karte; null = keine Karte auf der Startseite. */
  beschreibung: string | null;
  gruppe: ToolGruppe;
  /** Tab-Leiste innerhalb des Tools (erster Eintrag = Einstiegsseite). */
  bereiche?: readonly ToolBereich[];
}

export const TOOLS: readonly Tool[] = [
  { href: "/", navLabel: "Start", titel: "Dashboard", beschreibung: null, gruppe: "haupt" },
  {
    href: "/immobilien/objekte",
    navLabel: "Immobilien",
    titel: "Immobilien-Rechner",
    beschreibung: "Objekte erfassen, Kennzahlen berechnen, vergleichen — rechnet sich der Kauf?",
    gruppe: "haupt",
  },
  {
    href: "/finanzuebersicht",
    navLabel: "Finanzübersicht",
    titel: "Finanzübersicht",
    beschreibung:
      "Wertpapiere, Tagesgeld & Immobilien-Cashflow zusammen betrachten — wie viel Geld hast du in wie vielen Jahren wirklich zur Verfügung?",
    gruppe: "haupt",
  },
  {
    href: "/szenarien",
    navLabel: "Szenarien",
    titel: "Szenarien",
    beschreibung: "„Was wäre, wenn…“ — Käufe, Verkäufe, Sparraten & Anschaffungen durchspielen, ohne deine echten Daten zu verändern.",
    gruppe: "haupt",
  },
  {
    href: "/fitness",
    navLabel: "Fitness",
    titel: "Fitness & Ernährung",
    beschreibung: "Kalorienbedarf, Ernährungstagebuch mit Lebensmittel-Datenbank, Training, Gewichtstrend und Sport-Rechner.",
    gruppe: "haupt",
    bereiche: [
      { href: "/fitness", label: "Heute" },
      { href: "/fitness/ernaehrung", label: "Ernährung" },
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
    gruppe: "rechner",
  },
  {
    href: "/steuerrechner",
    navLabel: "Steuerrechner",
    titel: "Steuerrechner",
    beschreibung: "Freistehender Grenzsteuersatz-Rechner, unabhängig vom Profil — schnell ein anderes Einkommen durchspielen.",
    gruppe: "rechner",
  },
  {
    href: "/kreditvergleich",
    navLabel: "Kreditvergleich",
    titel: "Kreditvergleich",
    beschreibung: "Zwei Finanzierungsangebote nebeneinander durchrechnen, ohne dass ein Objekt angelegt werden muss.",
    gruppe: "rechner",
  },
  {
    href: "/kaufen-oder-anlegen",
    navLabel: "Kaufen oder Anlegen?",
    titel: "Kaufen oder Anlegen?",
    beschreibung: "Ein Objekt aus deiner Bibliothek gegen die Alternative vergleichen, dasselbe Eigenkapital stattdessen anzulegen.",
    gruppe: "rechner",
  },
  {
    href: "/profil",
    navLabel: "Profil",
    titel: "Profil",
    beschreibung: "Einkommen, Budget und Schwellen hinterlegen — steuert die Ampeln und Kennzahlen aller anderen Tools.",
    gruppe: "verwaltung",
  },
  { href: "/nutzer", navLabel: "Nutzer", titel: "Nutzer", beschreibung: null, gruppe: "verwaltung" },
  {
    href: "/integrationen",
    navLabel: "Integrationen & API",
    titel: "Integrationen & API",
    beschreibung: "Home Assistant, iOS-Kurzbefehle und eigene Skripte per REST-API anbinden — Tokens verwalten, fertige Konfiguration kopieren.",
    gruppe: "verwaltung",
  },
  { href: "/immobilien/referenzdaten", navLabel: "Referenzdaten", titel: "Referenzdaten", beschreibung: null, gruppe: "verwaltung" },
];

export const HAUPT_TOOLS = TOOLS.filter((t) => t.gruppe === "haupt");
export const WEITERE_TOOLS = TOOLS.filter((t) => t.gruppe !== "haupt");
export const STARTSEITEN_TOOLS = TOOLS.filter((t): t is Tool & { beschreibung: string } => t.beschreibung !== null);

export function toolBereiche(href: string): readonly ToolBereich[] {
  return TOOLS.find((t) => t.href === href)?.bereiche ?? [];
}

/** Ist der Link für den aktuellen Pfad aktiv? "/" nur exakt, sonst auch für Unterseiten. */
export function istAktiv(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
