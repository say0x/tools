import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HAUPT_TOOLS, STARTSEITEN_TOOLS, TOOLS, WEITERE_TOOLS, istAktiv, toolBereiche } from "./tool-registry";

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

describe("Tool-Registry", () => {
  it("ist importfrei (wird von Playwright ohne Next.js/Alias geladen)", () => {
    const quelle = readFileSync(path.join(process.cwd(), "src/lib/tool-registry.ts"), "utf8");
    expect(quelle).not.toMatch(/^\s*import\s/m);
  });

  it("Einstiegspfade sind eindeutig; Bereiche beginnen mit der Einstiegsseite", () => {
    const hrefs = TOOLS.map((t) => t.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    for (const t of TOOLS.filter((x) => x.bereiche)) {
      expect(t.bereiche![0].href, t.titel).toBe(t.href);
      for (const b of t.bereiche!) expect(istAktiv(t.href, b.href), b.href).toBe(true);
    }
  });

  it("jede registrierte Seite existiert", () => {
    for (const t of TOOLS) {
      expect(existsSync(seiteVon(t.href)), t.href).toBe(true);
      for (const b of t.bereiche ?? []) expect(existsSync(seiteVon(b.href)), b.href).toBe(true);
    }
  });

  it("jede Seite unter src/app gehört zu einem registrierten Tool", () => {
    const seiten = alleSeiten();
    expect(seiten.length).toBeGreaterThan(TOOLS.length);
    const ohneTool = seiten.filter((s) => !TOOLS.some((t) => istAktiv(t.href, s)));
    expect(ohneTool, "neue Seite? → Eintrag in src/lib/tool-registry.ts").toEqual([]);
  });

  it("die Tool-Übersicht in der Doku nennt jedes Tool", () => {
    const doku = readFileSync(path.join(process.cwd(), "docs/tools/overview.md"), "utf8");
    for (const t of TOOLS) expect(doku, `${t.titel} fehlt in docs/tools/overview.md`).toContain("`" + t.href);
  });

  it("die Kopfzeile bleibt kurz (sonst läuft sie über, siehe docs/tools/weitere-rechner.md)", () => {
    expect(HAUPT_TOOLS.length).toBeLessThanOrEqual(6);
    expect(HAUPT_TOOLS.length + WEITERE_TOOLS.length).toBe(TOOLS.length);
  });

  it("Gruppen stehen zusammenhängend (eine Trennlinie je Gruppenwechsel)", () => {
    const folge = TOOLS.map((t) => t.gruppe).filter((g, i, a) => i === 0 || g !== a[i - 1]);
    expect(new Set(folge).size).toBe(folge.length);
  });

  it("Startseiten-Karten haben eine Beschreibung, das Dashboard selbst keine", () => {
    expect(STARTSEITEN_TOOLS.every((t) => t.beschreibung.length > 20)).toBe(true);
    expect(STARTSEITEN_TOOLS.some((t) => t.href === "/")).toBe(false);
  });
});

describe("istAktiv / toolBereiche", () => {
  it("'/' nur exakt, sonst auch Unterseiten — aber keine Präfix-Verwechslung", () => {
    expect(istAktiv("/", "/")).toBe(true);
    expect(istAktiv("/", "/fitness")).toBe(false);
    expect(istAktiv("/fitness", "/fitness/ernaehrung")).toBe(true);
    expect(istAktiv("/immobilien/objekte", "/immobilien/objekte/neu")).toBe(true);
    expect(istAktiv("/immobilien/objekte", "/immobilien/referenzdaten")).toBe(false);
    expect(istAktiv("/profil", "/profilbild")).toBe(false);
  });

  it("liefert die Fitness-Tabs und leer für Tools ohne Bereiche", () => {
    expect(toolBereiche("/fitness").map((b) => b.label)).toContain("Ernährung");
    expect(toolBereiche("/sparziel")).toEqual([]);
  });
});
