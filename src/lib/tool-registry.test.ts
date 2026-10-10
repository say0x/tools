import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  KATEGORIEN,
  KOPFZEILE_MAX,
  KOPFZEILEN_TOOLS,
  STARTSEITE,
  TOOLS,
  TOOLS_JE_KATEGORIE_MAX,
  istAktiv,
  toolFuerPfad,
  toolsNachKategorie,
} from "./tool-registry";

const APP = path.join(process.cwd(), "src/app");
const seiteVon = (href: string) => path.join(APP, href, "page.tsx");

/** Alle Seiten-Routen unter src/app (ohne API-Routen), z. B. "/immobilien/objekte/[id]". */
function alleSeiten(): string[] {
  const seiten: string[] = [];
  const besuche = (ordner: string) => {
    for (const eintrag of readdirSync(ordner)) {
      const voll = path.join(ordner, eintrag);
      if (statSync(voll).isDirectory()) {
        if (eintrag !== "api" && !eintrag.startsWith("_")) besuche(voll);
      } else if (eintrag === "page.tsx") {
        seiten.push("/" + path.relative(APP, ordner).split(path.sep).join("/"));
      }
    }
  };
  besuche(APP);
  return seiten.map((s) => (s === "/" ? s : s.replace(/\/$/, "")));
}

const alleLinks = TOOLS.flatMap((t) => [t.href, ...(t.bereiche ?? []).map((b) => b.href), ...(t.schnellzugriffe ?? []).map((s) => s.href)]);

describe("Tool-Registry: Konsistenz", () => {
  it("ist importfrei (wird von Playwright ohne Next.js/Alias geladen)", () => {
    const quelle = readFileSync(path.join(process.cwd(), "src/lib/tool-registry.ts"), "utf8");
    expect(quelle).not.toMatch(/^\s*import\s/m);
  });

  it("Einstiegspfade eindeutig; Bereiche beginnen mit der Einstiegsseite; alles liegt unter dem Tool", () => {
    const hrefs = TOOLS.map((t) => t.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const t of TOOLS) {
      if (t.bereiche) expect(t.bereiche[0].href, t.titel).toBe(t.href);
      for (const l of [...(t.bereiche ?? []), ...(t.schnellzugriffe ?? [])]) expect(istAktiv(t.href, l.href), l.href).toBe(true);
    }
  });

  it("jede registrierte Seite existiert", () => {
    expect(existsSync(seiteVon(STARTSEITE.href))).toBe(true);
    for (const href of alleLinks) expect(existsSync(seiteVon(href)), href).toBe(true);
  });

  it("jede Seite unter src/app gehört zu einem registrierten Tool", () => {
    const seiten = alleSeiten().filter((s) => s !== STARTSEITE.href);
    expect(seiten.length).toBeGreaterThan(TOOLS.length);
    const ohneTool = seiten.filter((s) => !toolFuerPfad(s));
    expect(ohneTool, "neue Seite? → Eintrag in src/lib/tool-registry.ts").toEqual([]);
  });

  it("die Tool-Übersicht in der Doku nennt jedes Tool", () => {
    const doku = readFileSync(path.join(process.cwd(), "docs/tools/overview.md"), "utf8");
    for (const t of TOOLS) expect(doku, `${t.titel} fehlt in docs/tools/overview.md`).toContain("`" + t.href);
  });

  it("jedes Tool hat eine aussagekräftige Beschreibung und eine gültige Kategorie", () => {
    const ids = KATEGORIEN.map((k) => k.id as string);
    for (const t of TOOLS) {
      expect(t.beschreibung.length, t.titel).toBeGreaterThan(30);
      expect(ids, t.titel).toContain(t.kategorie);
    }
  });
});

describe("Tool-Registry: Skalierungsregeln (ADR-0012)", () => {
  it(`höchstens ${KOPFZEILE_MAX} Tools in der Kopfzeile, mit kurzen Namen`, () => {
    expect(KOPFZEILEN_TOOLS.length).toBeLessThanOrEqual(KOPFZEILE_MAX);
    for (const t of KOPFZEILEN_TOOLS) expect(t.navLabel.length, t.navLabel).toBeLessThanOrEqual(16);
  });

  it(`höchstens ${TOOLS_JE_KATEGORIE_MAX} Tools je Kategorie — sonst neue Kategorie anlegen`, () => {
    for (const k of toolsNachKategorie()) expect(k.tools.length, k.label).toBeLessThanOrEqual(TOOLS_JE_KATEGORIE_MAX);
  });

  it("keine leeren Kategorien in der Konfiguration", () => {
    expect(toolsNachKategorie().map((k) => k.id)).toEqual(KATEGORIEN.map((k) => k.id));
  });
});

describe("Hilfsfunktionen", () => {
  it("istAktiv: '/' nur exakt, sonst auch Unterseiten — keine Präfix-Verwechslung", () => {
    expect(istAktiv("/", "/")).toBe(true);
    expect(istAktiv("/", "/fitness")).toBe(false);
    expect(istAktiv("/fitness", "/fitness/ernaehrung")).toBe(true);
    expect(istAktiv("/immobilien/objekte", "/immobilien/objekte/neu")).toBe(true);
    expect(istAktiv("/immobilien/objekte", "/immobilien/referenzdaten")).toBe(false);
    expect(istAktiv("/profil", "/profilbild")).toBe(false);
  });

  it("toolFuerPfad liefert das spezifischste Tool", () => {
    expect(toolFuerPfad("/fitness/training")?.href).toBe("/fitness");
    expect(toolFuerPfad("/immobilien/objekte/abc123")?.href).toBe("/immobilien/objekte");
    expect(toolFuerPfad("/immobilien/referenzdaten")?.href).toBe("/immobilien/referenzdaten");
    expect(toolFuerPfad("/")).toBeUndefined();
  });

  it("toolsNachKategorie hält die Kategorie- und Registry-Reihenfolge", () => {
    const k = toolsNachKategorie();
    expect(k[0].label).toBe(KATEGORIEN[0].label);
    expect(k.flatMap((x) => x.tools).length).toBe(TOOLS.length);
  });
});
