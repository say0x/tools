import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { erzeugeOpenApiSpezifikation } from "./openapi";
import { fitnessTagDto, mahlzeitDto, trainingDto } from "./dto";
import type { FitnessTag, MahlzeitZeile, TrainingZeile } from "@/server/data/fitness";

const API_WURZEL = path.join(process.cwd(), "src/app/api/v1");
const METHODEN = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

/** Alle route.ts unter /api/v1 → { "/fitness/mahlzeiten/{id}": ["delete"], … } */
function implementierteRouten(): Record<string, string[]> {
  const ergebnis: Record<string, string[]> = {};
  const besuche = (ordner: string) => {
    for (const eintrag of readdirSync(ordner)) {
      const voll = path.join(ordner, eintrag);
      if (statSync(voll).isDirectory()) besuche(voll);
      else if (eintrag === "route.ts") {
        const relativ = path.relative(API_WURZEL, ordner).split(path.sep).join("/");
        const pfad = "/" + relativ.replace(/\[([^\]]+)\]/g, "{$1}");
        const quelle = readFileSync(voll, "utf8");
        ergebnis[pfad] = METHODEN.filter((m) => new RegExp(`export (const|async function|function) ${m}\\b`).test(quelle)).map((m) => m.toLowerCase());
      }
    }
  };
  besuche(API_WURZEL);
  return ergebnis;
}

const spec = erzeugeOpenApiSpezifikation();
type Operation = { security?: unknown[]; responses: Record<string, unknown>; requestBody?: unknown };
const paths = spec.paths as Record<string, Record<string, Operation>>;

describe("OpenAPI-Spezifikation", () => {
  it("dokumentiert genau die implementierten Routen und Methoden", () => {
    const routen = implementierteRouten();
    expect(Object.keys(routen).length).toBeGreaterThan(10);
    const dokumentiert = Object.fromEntries(Object.entries(paths).map(([p, ops]) => [p, Object.keys(ops).sort()]));
    const implementiert = Object.fromEntries(Object.entries(routen).map(([p, m]) => [p, [...m].sort()]));
    expect(dokumentiert).toEqual(implementiert);
  });

  it("nur status und openapi.json sind öffentlich; alles andere verlangt das Token", () => {
    const oeffentlich = Object.entries(paths).flatMap(([p, ops]) =>
      Object.entries(ops)
        .filter(([, op]) => Array.isArray(op.security) && op.security.length === 0)
        .map(([m]) => `${m} ${p}`)
    );
    expect(oeffentlich.sort()).toEqual(["get /openapi.json", "get /status"]);
    expect(spec.security).toEqual([{ bearerAuth: [] }]);
  });

  it("schreibende Operationen dokumentieren 401 und 403", () => {
    for (const [p, ops] of Object.entries(paths)) {
      for (const [m, op] of Object.entries(ops)) {
        if (m === "get") continue;
        expect(op.responses, `${m} ${p}`).toHaveProperty("401");
        expect(op.responses, `${m} ${p}`).toHaveProperty("403");
      }
    }
  });

  it("jede Operation hat eine eindeutige operationId", () => {
    const ids = Object.values(paths).flatMap((ops) => Object.values(ops).map((op) => (op as { operationId?: string }).operationId));
    expect(ids.every((id) => typeof id === "string" && id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("alle $ref zeigen auf existierende Komponenten", () => {
    const refs = JSON.stringify(spec).match(/"\$ref":"#\/components\/[^"]+"/g) ?? [];
    expect(refs.length).toBeGreaterThan(10);
    for (const r of refs) {
      const [, art, name] = r.slice(9, -1).split("/").slice(1);
      expect((spec.components as Record<string, Record<string, unknown>>)[art], r).toHaveProperty(name);
    }
  });

  it("Request-Bodies stammen aus den Zod-Schemas (inkl. Grenzen), datum ist optional", () => {
    const body = (paths["/fitness/gewicht"].post.requestBody as { content: { "application/json": { schema: { properties: Record<string, { minimum?: number }>; required: string[] } } } })
      .content["application/json"].schema;
    expect(body.properties.gewichtKg.minimum).toBe(20);
    expect(body.required).toEqual(["gewichtKg"]);
  });
});

describe("Antwortschemas passen zu den DTO-Funktionen", () => {
  const schemas = spec.components.schemas as unknown as Record<string, { properties: Record<string, unknown> }>;
  const schluessel = (name: string) => Object.keys(schemas[name].properties).sort();

  const mahlzeit: MahlzeitZeile = {
    id: "m",
    datum: "2026-10-10",
    mahlzeit: "SNACK",
    bezeichnung: "Apfel",
    mengeG: 150,
    kcal: 78,
    proteinG: 0.4,
    kohlenhydrateG: 17,
    fettG: 0.2,
    quelle: "API",
    kiKonfidenz: null,
    createdAt: "2026-10-10T10:00:00.000Z",
  };
  const training: TrainingZeile = {
    id: "t",
    datum: "2026-10-10",
    sportart: "YOGA",
    intensitaet: "LEICHT",
    dauerMin: 30,
    distanzKm: null,
    kcalVerbrauch: null,
    kcalOverride: false,
    durchschnittsPuls: null,
    notiz: "",
    quelle: "API",
    verbrauch: { kcal: 60, methode: "MET", met: 2.5 },
  };

  it("Mahlzeit, Training", () => {
    expect(Object.keys(mahlzeitDto(mahlzeit)).sort()).toEqual(schluessel("Mahlzeit"));
    expect(Object.keys(trainingDto(training)).sort()).toEqual(schluessel("Training"));
  });

  it("FitnessTag", () => {
    const tag: FitnessTag = {
      datum: "2026-10-10",
      profil: null,
      gewichtKg: null,
      energiebedarf: null,
      bilanz: null,
      zugefuehrt: { kcal: 78, proteinG: 0.4, kohlenhydrateG: 17, fettG: 0.2 },
      mahlzeiten: [mahlzeit],
      trainings: [training],
      aktivitaet: null,
      wasserZielMl: null,
      schritteZiel: null,
    };
    expect(Object.keys(fitnessTagDto(tag)).sort()).toEqual(schluessel("FitnessTag"));
  });
});
