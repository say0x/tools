import { describe, expect, it } from "vitest";
import { TOOLS, type Tool } from "./tool-registry";
import { baueSuchindex, normalisiere, standardTreffer, sucheTools } from "./tool-suche";

const erster = (anfrage: string) => sucheTools(anfrage)[0];

describe("normalisiere", () => {
  it("Kleinschreibung, Umlaute als ae/oe/ue/ss, ohne Akzente", () => {
    expect(normalisiere("Ernährung")).toBe("ernaehrung");
    expect(normalisiere("Größe")).toBe("groesse");
    expect(normalisiere("Café")).toBe("cafe");
  });
});

describe("sucheTools", () => {
  it("findet Tools über Titel, Kopfzeilen-Namen und Stichworte", () => {
    expect(erster("steuer")?.href).toBe("/steuerrechner");
    expect(erster("kalorien")?.href).toBe("/fitness");
    expect(erster("home assistant")?.href).toBe("/integrationen");
    expect(erster("darlehen")?.href).toBe("/kreditvergleich");
  });

  it("Umlaute in jeder Schreibweise", () => {
    for (const anfrage of ["Ernährung", "ernaehrung", "ernahrung", "ERNÄH"]) {
      expect(erster(anfrage), anfrage).toMatchObject({ href: "/fitness/ernaehrung", art: "bereich" });
    }
    expect(erster("finanzubersicht")?.href).toBe("/finanzuebersicht");
  });

  it("findet Bereiche und Schnellzugriffe mit ihrem Tool als Kontext", () => {
    expect(erster("neues objekt")).toEqual({ href: "/immobilien/objekte/neu", titel: "Neues Objekt anlegen", kontext: "Immobilien-Rechner", art: "aktion" });
    expect(erster("gewicht")).toMatchObject({ href: "/fitness/gewicht", kontext: "Fitness & Ernährung" });
  });

  it("alle Begriffe müssen passen (UND), Reihenfolge egal", () => {
    expect(sucheTools("szenario neu").map((t) => t.href)).toEqual(["/szenarien/neu"]);
    expect(sucheTools("neu szenario").map((t) => t.href)).toEqual(["/szenarien/neu"]);
    expect(sucheTools("steuer xyzunbekannt")).toEqual([]);
  });

  it("Titeltreffer stehen vor Treffern in Stichworten und Beschreibung", () => {
    const imTitel = sucheTools("rechner").map((t) => normalisiere(t.titel).includes("rechner"));
    expect(imTitel.filter(Boolean).length).toBeGreaterThanOrEqual(3);
    expect(imTitel).toEqual([...imTitel].sort((a, b) => Number(b) - Number(a)));
  });

  it("leere Anfrage → keine Treffer; Limit greift", () => {
    expect(sucheTools("   ")).toEqual([]);
    expect(sucheTools("e", undefined, 3)).toHaveLength(3);
  });
});

describe("standardTreffer", () => {
  it("zuletzt verwendete Tools zuerst, danach Startseite und alle übrigen genau einmal", () => {
    const liste = standardTreffer(["/fitness", "/unbekannt", "/steuerrechner"]);
    expect(liste.slice(0, 3).map((t) => t.href)).toEqual(["/fitness", "/steuerrechner", "/"]);
    expect(liste[0].kontext).toMatch(/^Zuletzt verwendet/);
    const hrefs = liste.map((t) => t.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
    expect(hrefs).toHaveLength(TOOLS.length + 1);
  });
});

describe("Skalierung", () => {
  it("bleibt bei 200 Tools treffsicher und schnell", () => {
    const viele: Tool[] = Array.from({ length: 200 }, (_, i) => ({
      href: `/tool-${i}`,
      navLabel: `Tool ${i}`,
      titel: `Werkzeug Nummer ${i}`,
      beschreibung: `Beschreibung für Werkzeug ${i} mit Füllwörtern`,
      kategorie: "rechner",
      stichworte: [`stichwort${i}`],
    }));
    const index = baueSuchindex([...TOOLS, ...viele]);
    const start = performance.now();
    for (let i = 0; i < 50; i++) sucheTools("werkzeug nummer 1", index);
    expect((performance.now() - start) / 50).toBeLessThan(5);
    expect(sucheTools("stichwort137", index)[0]?.href).toBe("/tool-137");
    expect(sucheTools("steuer", index)[0]?.href).toBe("/steuerrechner");
  });
});
