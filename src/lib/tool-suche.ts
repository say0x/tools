import { STARTSEITE, TOOLS, kategorieLabel, type Tool } from "./tool-registry";

/**
 * Suche der Befehlspalette (Strg+K) über Tools, ihre Bereiche und
 * Schnellzugriffe. Rein funktional und framework-frei, damit sie mit beliebig
 * vielen Tools getestet werden kann. Referenz: ADR-0012.
 */

export interface SuchTreffer {
  href: string;
  titel: string;
  /** Zweite Zeile: Kategorie (Tool) bzw. übergeordnetes Tool (Bereich, Aktion). */
  kontext: string;
  art: "tool" | "bereich" | "aktion";
}

interface IndexEintrag extends SuchTreffer {
  titelVarianten: string[];
  titelWorte: string[];
  nebenWorte: string[];
  volltext: string;
}

const ART_BONUS: Record<SuchTreffer["art"], number> = { tool: 5, aktion: 2, bereich: 0 };

/** Kleinschreibung, Umlaute als ae/oe/ue/ss, ohne Akzente — „Ernährung“ → „ernaehrung“. */
export function normalisiere(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/** Zweite Schreibweise, damit auch „ernahrung“ (Umlaut ohne e) trifft. */
const ohneUmlautE = (text: string) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss");

const varianten = (text: string) => [...new Set([normalisiere(text), ohneUmlautE(text)])];
const worte = (texte: readonly string[]) => [...new Set(texte.flatMap(varianten).flatMap((t) => t.split(/[^a-z0-9]+/)).filter(Boolean))];

function eintrag(treffer: SuchTreffer, neben: readonly string[], beschreibung = ""): IndexEintrag {
  return {
    ...treffer,
    titelVarianten: varianten(treffer.titel),
    titelWorte: worte([treffer.titel]),
    nebenWorte: worte(neben),
    volltext: varianten([treffer.titel, ...neben, beschreibung].join(" ")).join(" "),
  };
}

export function baueSuchindex(tools: readonly Tool[] = TOOLS): IndexEintrag[] {
  return tools.flatMap((tool) => {
    const kategorie = kategorieLabel(tool.kategorie);
    const stichworte = tool.stichworte ?? [];
    return [
      eintrag({ href: tool.href, titel: tool.titel, kontext: kategorie, art: "tool" }, [tool.navLabel, kategorie, ...stichworte], tool.beschreibung),
      ...(tool.bereiche ?? [])
        .filter((b) => b.href !== tool.href)
        .map((b) => eintrag({ href: b.href, titel: b.label, kontext: tool.titel, art: "bereich" }, [tool.titel, tool.navLabel, ...stichworte])),
      ...(tool.schnellzugriffe ?? []).map((s) => eintrag({ href: s.href, titel: s.label, kontext: tool.titel, art: "aktion" }, [tool.titel, tool.navLabel])),
    ];
  });
}

/** Punkte für einen Suchbegriff; 0 = kommt nicht vor. Titeltreffer wiegen am meisten. */
function punkte(e: IndexEintrag, begriff: string): number {
  if (e.titelVarianten.some((t) => t.startsWith(begriff))) return 100;
  if (e.titelWorte.some((w) => w.startsWith(begriff))) return 70;
  if (e.titelVarianten.some((t) => t.includes(begriff))) return 50;
  if (e.nebenWorte.some((w) => w.startsWith(begriff))) return 35;
  if (e.volltext.includes(begriff)) return 15;
  return 0;
}

/**
 * Alle Begriffe der Anfrage müssen vorkommen (UND-Verknüpfung); sortiert nach
 * Punkten, bei Gleichstand in Registry-Reihenfolge.
 */
export function sucheTools(anfrage: string, index: readonly IndexEintrag[] = STANDARD_INDEX, limit = 12): SuchTreffer[] {
  const begriffe = [...new Set(normalisiere(anfrage).split(/[^a-z0-9]+/).filter(Boolean))];
  if (begriffe.length === 0) return [];
  return index
    .map((e, position) => {
      let summe = 0;
      for (const b of begriffe) {
        const p = punkte(e, b);
        if (p === 0) return null;
        summe += p;
      }
      return { e, position, summe: summe + ART_BONUS[e.art] };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.summe - a.summe || a.position - b.position)
    .slice(0, limit)
    .map(({ e }) => ({ href: e.href, titel: e.titel, kontext: e.kontext, art: e.art }));
}

/**
 * Liste ohne Suchbegriff: zuletzt besuchte Tools zuerst, dann Startseite und
 * alle übrigen Tools in Kategorie-Reihenfolge — jedes Tool genau einmal.
 */
export function standardTreffer(zuletzt: readonly string[] = [], tools: readonly Tool[] = TOOLS): SuchTreffer[] {
  const alsTreffer = (t: Tool, kontext = kategorieLabel(t.kategorie)): SuchTreffer => ({ href: t.href, titel: t.titel, kontext, art: "tool" });
  const zuletztTools = zuletzt.map((href) => tools.find((t) => t.href === href)).filter((t): t is Tool => t !== undefined);
  const rest = tools.filter((t) => !zuletztTools.includes(t));
  return [
    ...zuletztTools.map((t) => alsTreffer(t, `Zuletzt verwendet · ${kategorieLabel(t.kategorie)}`)),
    { href: STARTSEITE.href, titel: "Startseite", kontext: "Übersicht aller Kennzahlen", art: "tool" },
    ...rest.map((t) => alsTreffer(t)),
  ];
}

const STANDARD_INDEX = baueSuchindex();
