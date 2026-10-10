import { z } from "zod";
import { gewichtSchema, mahlzeitSchema, tagesAktivitaetSchema, trainingSchema, wasserHinzufuegenSchema } from "@/server/actions/fitness-schema";
import { mahlzeitAnalyseSchema } from "@/server/ki/mahlzeit-analyse";
import { DATEN_QUELLEN, INTENSITAETEN, KI_KONFIDENZEN, MAHLZEITEN, SPORTARTEN } from "@/server/calc/fitness/types";
import { PLATTFORM_VERSION } from "@/lib/version";
import { FEHLER_CODES } from "./handler";
import { fotoAnalyseSchema } from "./schemas";

/**
 * OpenAPI-3.1-Beschreibung von /api/v1. Request-Bodies werden aus denselben
 * Zod-Schemas erzeugt, die die Routen validieren — die Doku kann also nicht
 * von den tatsächlichen Grenzen abweichen. Antwortschemas sind handgeschrieben;
 * openapi.test.ts prüft sie gegen die DTO-Funktionen und gleicht alle
 * route.ts-Dateien mit `paths` ab.
 */

type Schema = Record<string, unknown>;

const DATUM: Schema = { type: "string", format: "date", examples: ["2026-10-10"] };
const n = (typ: "number" | "integer" | "string" | "boolean", extra: Schema = {}): Schema => ({ type: [typ, "null"], ...extra });
const ref = (name: string): Schema => ({ $ref: `#/components/schemas/${name}` });
const objekt = (properties: Record<string, Schema>, beschreibung?: string): Schema => ({
  type: "object",
  ...(beschreibung ? { description: beschreibung } : {}),
  properties,
  required: Object.keys(properties),
});

/**
 * JSON-Schema eines Zod-Request-Schemas. `datum` ist in der API optional
 * (Default: heute in Europe/Berlin), die Routen ergänzen es vor der Validierung.
 */
function eingabe(schema: z.ZodType, ergaenzungen: Record<string, Schema> = {}): Schema {
  const js = z.toJSONSchema(schema, { io: "input", unrepresentable: "any" }) as Schema & {
    properties?: Record<string, Schema>;
    required?: string[];
  };
  delete js.$schema;
  if (js.properties?.datum) {
    js.properties.datum = { ...DATUM, description: "JJJJ-MM-TT; ohne Angabe: heute (Europe/Berlin)" };
    js.required = js.required?.filter((f) => f !== "datum");
  }
  for (const [feld, extra] of Object.entries(ergaenzungen)) {
    if (js.properties?.[feld]) js.properties[feld] = { ...js.properties[feld], ...extra };
  }
  return js;
}

const parameter = {
  datum: { name: "datum", in: "query", required: false, description: "Tag (JJJJ-MM-TT), Default heute", schema: DATUM },
  von: { name: "von", in: "query", required: false, description: "Beginn (JJJJ-MM-TT, inklusive)", schema: DATUM },
  bis: { name: "bis", in: "query", required: false, description: "Ende (JJJJ-MM-TT, inklusive), Default heute", schema: DATUM },
  id: { name: "id", in: "path", required: true, schema: { type: "string" } },
};

const json = (schema: Schema, beispiel?: unknown) => ({
  "application/json": { schema, ...(beispiel === undefined ? {} : { example: beispiel }) },
});
const antwort = (beschreibung: string, schema: Schema, beispiel?: unknown) => ({ description: beschreibung, content: json(schema, beispiel) });
const fehlerRef = (name: string) => ({ $ref: `#/components/responses/${name}` });

const LESEN = { "401": fehlerRef("NichtAuthentifiziert") };
const LESEN_MIT_PARAMETERN = { ...LESEN, "400": fehlerRef("UngueltigeAnfrage") };
const SCHREIBEN = {
  "400": fehlerRef("UngueltigeAnfrage"),
  "401": fehlerRef("NichtAuthentifiziert"),
  "403": fehlerRef("KeinSchreibzugriff"),
  "413": fehlerRef("ZuGross"),
  "422": fehlerRef("Validierung"),
};
const LOESCHEN = {
  "204": { description: "Gelöscht" },
  "401": fehlerRef("NichtAuthentifiziert"),
  "403": fehlerRef("KeinSchreibzugriff"),
  "404": fehlerRef("NichtGefunden"),
};
const OEFFENTLICH: Schema[] = [];

const schemas = {
  Fehler: objekt({
    fehler: {
      type: "object",
      required: ["code", "nachricht"],
      properties: {
        code: { type: "string", enum: [...FEHLER_CODES] },
        nachricht: { type: "string", description: "Deutschsprachige, menschenlesbare Beschreibung" },
        details: {
          type: "array",
          description: "Nur bei VALIDIERUNG: betroffene Felder (bei Arrays mit Index-Präfix, z. B. `[2].kcal`)",
          items: objekt({ feld: { type: "string" }, nachricht: { type: "string" } }),
        },
      },
    },
  }),
  Status: objekt({
    status: { type: "string", enum: ["ok", "gestoert"] },
    version: { type: "string" },
    apiVersion: { type: "string", const: "v1" },
    zeit: { type: "string", format: "date-time" },
    datenbank: { type: "string", enum: ["ok", "nicht_erreichbar"] },
    funktionen: objekt({ kiFotoAnalyse: { type: "boolean", description: "ANTHROPIC_API_KEY gesetzt" } }),
  }),
  Mahlzeit: objekt(
    {
      id: { type: "string" },
      datum: DATUM,
      mahlzeit: { type: "string", enum: [...MAHLZEITEN] },
      bezeichnung: { type: "string" },
      mengeG: n("number"),
      kcal: { type: "integer" },
      proteinG: { type: "number" },
      kohlenhydrateG: { type: "number" },
      fettG: { type: "number" },
      quelle: { type: "string", enum: [...DATEN_QUELLEN] },
      kiKonfidenz: n("string", { enum: [...KI_KONFIDENZEN, null] }),
    },
    "Ernährungseintrag. Nährwerte gelten für die eingetragene Menge (nicht je 100 g)."
  ),
  Training: objekt(
    {
      id: { type: "string" },
      datum: DATUM,
      sportart: { type: "string", enum: [...SPORTARTEN] },
      intensitaet: { type: "string", enum: [...INTENSITAETEN] },
      dauerMin: { type: "integer" },
      distanzKm: n("number"),
      kcal: { type: "integer", description: "Netto-Mehrverbrauch gegenüber Ruhe (Grundumsatz ist im Tagesziel bereits enthalten)" },
      kcalMethode: { type: "string", enum: ["MET", "LAUFDISTANZ", "RADTEMPO", "MANUELL"] },
      durchschnittsPuls: n("integer"),
      notiz: { type: "string" },
      quelle: { type: "string", enum: [...DATEN_QUELLEN] },
    },
    "Trainingseinheit mit effektivem Verbrauch (manuell oder geschätzt)."
  ),
  Gewicht: objekt({
    id: { type: "string" },
    datum: DATUM,
    gewichtKg: { type: "number" },
    koerperfettProzent: n("number"),
    notiz: { type: "string" },
    quelle: { type: "string", enum: [...DATEN_QUELLEN] },
  }),
  Tageswerte: objekt({
    datum: DATUM,
    schritte: n("integer"),
    wasserMl: n("integer"),
    schlafStunden: n("number"),
    ruhepuls: n("integer"),
  }),
  FitnessTag: objekt({
    datum: DATUM,
    profilVorhanden: { type: "boolean" },
    gewichtKg: n("number", { description: "Letzte Messung am oder vor dem Tag" }),
    ziele: {
      type: ["object", "null"],
      description: "null ohne Fitness-Profil",
      properties: {
        kalorien: { type: "integer" },
        proteinG: { type: "integer" },
        kohlenhydrateG: { type: "integer" },
        fettG: { type: "integer" },
        wasserMl: { type: "integer" },
        schritte: n("integer"),
        grundumsatz: { type: "integer" },
        gesamtumsatzOhneSport: { type: "integer" },
      },
    },
    zugefuehrt: objekt({ kcal: { type: "integer" }, proteinG: { type: "number" }, kohlenhydrateG: { type: "number" }, fettG: { type: "number" } }),
    training: objekt({ anzahl: { type: "integer" }, minuten: { type: "integer" }, kcal: { type: "integer" } }),
    budget: {
      type: ["object", "null"],
      description: "Kalorienziel plus angerechnete Trainingskalorien; null ohne Profil",
      properties: { kcal: { type: "integer" }, verbleibend: { type: "integer" }, prozent: { type: "integer" }, ueberBudget: { type: "boolean" } },
    },
    aktivitaet: objekt({ schritte: n("integer"), wasserMl: n("integer"), schlafStunden: n("number"), ruhepuls: n("integer") }),
    mahlzeiten: { type: "array", items: ref("Mahlzeit") },
    trainings: { type: "array", items: ref("Training") },
  }),
  Lebensmittel: objekt({
    id: { type: "string" },
    bezeichnung: { type: "string" },
    kategorie: { type: "string" },
    kcalPro100g: { type: "number" },
    proteinPro100g: { type: "number" },
    kohlenhydratePro100g: { type: "number" },
    fettPro100g: { type: "number" },
    standardPortionG: { type: "number" },
    eigenes: { type: "boolean" },
  }),
  HomeAssistantSensoren: objekt(
    {
      zeitpunkt: { type: "string", format: "date-time" },
      datum: DATUM,
      fitness: {
        type: "object",
        description: "Werte von heute bzw. der letzten 7 Tage; null = unbekannt (z. B. ohne Profil)",
        properties: Object.fromEntries(
          (
            [
              ["kalorien_ziel", "integer"],
              ["kalorien_gegessen", "integer"],
              ["kalorien_training", "integer"],
              ["kalorien_budget", "integer"],
              ["kalorien_verbleibend", "integer"],
              ["kalorien_prozent", "integer"],
              ["ueber_budget", "boolean"],
              ["protein_g", "number"],
              ["protein_ziel_g", "integer"],
              ["kohlenhydrate_g", "number"],
              ["kohlenhydrate_ziel_g", "integer"],
              ["fett_g", "number"],
              ["fett_ziel_g", "integer"],
              ["wasser_ml", "integer"],
              ["wasser_ziel_ml", "integer"],
              ["schritte", "integer"],
              ["schritte_ziel", "integer"],
              ["schlaf_stunden", "number"],
              ["ruhepuls", "integer"],
              ["mahlzeiten_heute", "integer"],
              ["training_minuten_heute", "integer"],
              ["training_minuten_7_tage", "integer"],
              ["training_einheiten_7_tage", "integer"],
              ["kalorien_schnitt_7_tage", "integer"],
              ["tage_im_zielkorridor_7_tage", "integer"],
              ["gewicht_kg", "number"],
              ["gewicht_7_tage_kg", "number"],
              ["gewicht_trend_kg_pro_woche", "number"],
              ["gewicht_ziel_kg", "number"],
              ["gewicht_prognose_status", "string"],
              ["gewicht_prognose_datum", "string"],
              ["bmi", "number"],
            ] as const
          ).map(([name, typ]) => [name, n(typ)])
        ),
      },
      finanzen: {
        type: "object",
        description: "Kennzahlen des Start-Dashboards; Beträge in Euro",
        properties: Object.fromEntries(
          (
            [
              ["vermoegen_referenz_eur", "number"],
              ["vermoegen_netto_eur", "number"],
              ["bargeld_und_depots_eur", "number"],
              ["tagesgeld_eur", "number"],
              ["restschulden_eur", "number"],
              ["notgroschen_monate", "number"],
              ["immobilien_cashflow_monatlich_eur", "number"],
              ["immobilien_im_besitz", "integer"],
              ["objekte_gesamt", "integer"],
              ["objekte_ampel_gruen", "integer"],
              ["objekte_ampel_gelb", "integer"],
              ["objekte_ampel_rot", "integer"],
              ["bruttorendite_schnitt_prozent", "number"],
              ["szenarien", "integer"],
            ] as const
          ).map(([name, typ]) => [name, n(typ)])
        ),
      },
    },
    "Flache Sensorstruktur für die Home-Assistant-REST-Integration (snake_case, stabile Namen)."
  ),
} satisfies Record<string, Schema>;

/** KI-Rohantwort (Structured Output) plus die serverseitig ergänzten Felder aus pruefeKiAnalyse. */
function analyseSchema(): Schema {
  const roh = eingabe(mahlzeitAnalyseSchema) as Schema & { properties: Record<string, Schema>; required: string[] };
  return {
    ...roh,
    description: "Schätzung der KI inkl. Summe, Plausibilitätsprüfung und verwendetem Modell",
    properties: {
      ...roh.properties,
      summe: objekt({ kcal: { type: "number" }, proteinG: { type: "number" }, kohlenhydrateG: { type: "number" }, fettG: { type: "number" } }),
      inkonsistentePositionen: { type: "array", items: { type: "string" }, description: "Positionen, deren kcal deutlich von 4·P + 4·KH + 9·F abweichen" },
      modell: { type: "string" },
    },
    required: [...roh.required, "summe", "inkonsistentePositionen", "modell"],
  };
}

const zeitraumAntwort =objekt({ von: DATUM, bis: DATUM, eintraege: { type: "array", items: ref("Mahlzeit") } });

/** Stabile operationIds für Client-Generatoren (Bruno, openapi-generator, …). */
const OPERATION_IDS: Record<string, string> = {
  "get /status": "statusAbrufen",
  "get /openapi.json": "spezifikationAbrufen",
  "get /ich": "tokenPruefen",
  "get /fitness/tag": "tagesuebersichtLesen",
  "get /fitness/zeitraum": "zeitraumStatistikLesen",
  "get /fitness/mahlzeiten": "mahlzeitenLesen",
  "post /fitness/mahlzeiten": "mahlzeitenAnlegen",
  "delete /fitness/mahlzeiten/{id}": "mahlzeitLoeschen",
  "post /fitness/mahlzeiten/foto-analyse": "mahlzeitFotoAnalysieren",
  "get /fitness/training": "trainingsLesen",
  "post /fitness/training": "trainingAnlegen",
  "delete /fitness/training/{id}": "trainingLoeschen",
  "get /fitness/gewicht": "gewichtsverlaufLesen",
  "post /fitness/gewicht": "gewichtSpeichern",
  "delete /fitness/gewicht/{id}": "gewichtLoeschen",
  "get /fitness/tageswerte": "tageswerteLesen",
  "put /fitness/tageswerte": "tageswerteSetzen",
  "post /fitness/tageswerte/wasser": "wasserHinzufuegen",
  "get /fitness/lebensmittel": "lebensmittelSuchen",
  "get /finanzen/uebersicht": "finanzKennzahlenLesen",
  "get /home-assistant/sensoren": "homeAssistantSensorenLesen",
};

function mitOperationIds<P extends Record<string, Record<string, Schema>>>(paths: P): P {
  for (const [pfad, ops] of Object.entries(paths)) {
    for (const [methode, op] of Object.entries(ops)) op.operationId = OPERATION_IDS[`${methode} ${pfad}`];
  }
  return paths;
}

export function erzeugeOpenApiSpezifikation() {
  const mahlzeitEingabe = eingabe(mahlzeitSchema, {
    quelle: { default: "API", description: "Herkunft; Default bei der API: API" },
  });

  return {
    openapi: "3.1.0",
    info: {
      title: "tools — REST-API",
      version: PLATTFORM_VERSION,
      description: [
        "Persönliche API für Fitness- und Finanzdaten der tools-Plattform — gedacht für Home Assistant, iOS-Kurzbefehle, Smart-Waagen und eigene Skripte.",
        "",
        "**Authentifizierung:** `Authorization: Bearer <Token>`. Tokens werden unter **/integrationen** erstellt, sind an einen Nutzer gebunden und entweder lesend oder lesend+schreibend.",
        "",
        "**Konventionen:** JSON (UTF-8), Datumswerte `JJJJ-MM-TT` in Europe/Berlin, Kalorien als ganze Zahlen, Gramm/kg mit einer Nachkommastelle. Fehler haben immer die Form `{ fehler: { code, nachricht, details? } }`. Antworten werden nie gecacht.",
        "",
        "Ausführliche Anleitung: docs/api/README.md · Home Assistant: docs/integrations/home-assistant.md",
      ].join("\n"),
    },
    servers: [{ url: "/api/v1", description: "Diese Instanz" }],
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "System", description: "Erreichbarkeit, Token-Prüfung, diese Spezifikation" },
      { name: "Fitness", description: "Ernährung, Training, Gewicht, Tageswerte" },
      { name: "KI", description: "Foto-Analyse von Mahlzeiten (Claude Vision, optional)" },
      { name: "Finanzen", description: "Kennzahlen aus Immobilien, Sparpositionen und Profil (nur lesend)" },
      { name: "Home Assistant", description: "Aggregierte Sensorwerte in einem Request" },
    ],
    paths: mitOperationIds({
      "/status": {
        get: {
          tags: ["System"],
          summary: "Health-Check (öffentlich)",
          description: "Ohne Token, ohne Nutzerdaten. 503, wenn die Datenbank nicht erreichbar ist — geeignet für Docker-Healthcheck und Uptime-Monitoring.",
          security: OEFFENTLICH,
          responses: {
            "200": antwort("Alles in Ordnung", ref("Status")),
            "503": antwort("Datenbank nicht erreichbar", ref("Status")),
          },
        },
      },
      "/openapi.json": {
        get: {
          tags: ["System"],
          summary: "Diese Spezifikation (öffentlich)",
          security: OEFFENTLICH,
          responses: { "200": { description: "OpenAPI 3.1 als JSON", content: { "application/json": { schema: { type: "object" } } } } },
        },
      },
      "/ich": {
        get: {
          tags: ["System"],
          summary: "Token prüfen",
          description: "Liefert Nutzer und Token-Rechte — ideal als erster Test nach dem Einrichten.",
          responses: {
            "200": antwort(
              "Token gültig",
              objekt({
                nutzer: objekt({ id: { type: "string" }, name: { type: "string" } }),
                token: objekt({ id: { type: "string" }, name: { type: "string" }, schreibzugriff: { type: "boolean" } }),
                heute: DATUM,
              })
            ),
            ...LESEN,
          },
        },
      },
      "/fitness/tag": {
        get: {
          tags: ["Fitness"],
          summary: "Tagesübersicht",
          description: "Ziele, Zufuhr, Training, Kalorienbudget, Tageswerte und alle Einträge eines Tages.",
          parameters: [parameter.datum],
          responses: { "200": antwort("Tagesübersicht", ref("FitnessTag")), ...LESEN_MIT_PARAMETERN },
        },
      },
      "/fitness/zeitraum": {
        get: {
          tags: ["Fitness"],
          summary: "Statistik über mehrere Tage",
          description: "Durchschnittswerte, Kalorienbilanz und Tageswerte für die letzten `tage` Tage bis einschließlich `bis`.",
          parameters: [
            parameter.bis,
            { name: "tage", in: "query", required: false, description: "Anzahl Tage (1–366, Default 7)", schema: { type: "integer", minimum: 1, maximum: 366, default: 7 } },
          ],
          responses: {
            "200": antwort(
              "Statistik",
              objekt({
                bis: DATUM,
                tage: { type: "integer" },
                statistik: {
                  type: "object",
                  properties: {
                    tageMitErnaehrung: { type: "integer" },
                    tageImZielkorridor: { type: "integer", description: "Tage mit 90–105 % des Budgets" },
                    durchschnittKcal: n("integer"),
                    durchschnittProteinG: n("number"),
                    durchschnittBudget: n("integer"),
                    bilanzKcal: { type: "integer", description: "Summe (Zufuhr − Budget) über Tage mit Einträgen" },
                    rechnerischeVeraenderungKg: { type: "number", description: "bilanzKcal / 7700" },
                    trainingAnzahl: { type: "integer" },
                    trainingMinuten: { type: "integer" },
                    trainingKcal: { type: "integer" },
                    durchschnittSchritte: n("integer"),
                    durchschnittWasserMl: n("integer"),
                    durchschnittSchlafStunden: n("number"),
                  },
                },
                tageswerte: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      datum: DATUM,
                      kcal: n("integer"),
                      proteinG: n("number"),
                      budget: n("integer"),
                      trainingMinuten: { type: "integer" },
                      trainingKcal: { type: "integer" },
                      schritte: n("integer"),
                      wasserMl: n("integer"),
                      schlafStunden: n("number"),
                    },
                  },
                },
              })
            ),
            ...LESEN_MIT_PARAMETERN,
          },
        },
      },
      "/fitness/mahlzeiten": {
        get: {
          tags: ["Fitness"],
          summary: "Ernährungseinträge lesen",
          description: "Entweder ein Tag (`datum`) oder ein Zeitraum (`von` + optional `bis`, max. 366 Tage).",
          parameters: [parameter.datum, parameter.von, parameter.bis],
          responses: { "200": antwort("Einträge", zeitraumAntwort), ...LESEN_MIT_PARAMETERN },
        },
        post: {
          tags: ["Fitness"],
          summary: "Ernährungseinträge anlegen",
          description: "Ein Objekt oder ein Array (1–50 Einträge, z. B. alle Positionen einer Mahlzeit). Nährwerte für die gegessene Menge. Benötigt Schreibzugriff.",
          requestBody: {
            required: true,
            content: json(
              { oneOf: [mahlzeitEingabe, { type: "array", minItems: 1, maxItems: 50, items: mahlzeitEingabe }] },
              { mahlzeit: "MITTAGESSEN", bezeichnung: "Linsensuppe", mengeG: 400, kcal: 380, proteinG: 22, kohlenhydrateG: 48, fettG: 8 }
            ),
          },
          responses: { "201": antwort("Angelegt", objekt({ eintraege: { type: "array", items: ref("Mahlzeit") } })), ...SCHREIBEN },
        },
      },
      "/fitness/mahlzeiten/{id}": {
        delete: { tags: ["Fitness"], summary: "Ernährungseintrag löschen", parameters: [parameter.id], responses: LOESCHEN },
      },
      "/fitness/mahlzeiten/foto-analyse": {
        post: {
          tags: ["KI"],
          summary: "Mahlzeit per Foto schätzen",
          description: [
            "Schätzt Positionen und Nährwerte mit Claude Vision (ADR-0010). Das Bild wird nur für die Analyse an die Anthropic-API übertragen und nicht gespeichert.",
            "Mit `speichern: true` werden die erkannten Positionen sofort als Einträge (`quelle: FOTO_KI`) angelegt — Antwort 201 statt 200.",
            "Erfordert `ANTHROPIC_API_KEY` auf dem Server (sonst 503) und unterliegt dem Tageslimit `KI_FOTO_LIMIT_PRO_TAG` (429). Max. Body 8 MB, Bild max. 5 MB (JPEG/PNG/WebP/GIF — der Typ wird am Inhalt erkannt; HEIC und andere Formate → 422).",
          ].join("\n\n"),
          requestBody: {
            required: true,
            content: json(eingabe(fotoAnalyseSchema, { bild: { description: "Data-URL (`data:image/jpeg;base64,…`) oder reines Base64 (dann `mediaType` angeben)" } }), {
              bild: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGRwtMC0oMCUoKSj/…",
              hinweis: "Portion etwa 300 g, mit Olivenöl",
              speichern: true,
              mahlzeit: "ABENDESSEN",
            }),
          },
          responses: {
            "200": antwort("Analyse (nicht gespeichert)", ref("FotoAnalyseErgebnis")),
            "201": antwort("Analyse und Einträge gespeichert", ref("FotoAnalyseErgebnis")),
            ...SCHREIBEN,
            "429": fehlerRef("LimitErreicht"),
            "502": fehlerRef("ExternerDienst"),
            "503": fehlerRef("NichtKonfiguriert"),
          },
        },
      },
      "/fitness/training": {
        get: {
          tags: ["Fitness"],
          summary: "Trainings lesen",
          description: "Zeitraum `von`–`bis` (Default: letzte 30 Tage, max. 366 Tage), neueste zuerst.",
          parameters: [parameter.von, parameter.bis],
          responses: {
            "200": antwort("Trainings", objekt({ von: DATUM, bis: DATUM, eintraege: { type: "array", items: ref("Training") } })),
            ...LESEN_MIT_PARAMETERN,
          },
        },
        post: {
          tags: ["Fitness"],
          summary: "Training anlegen",
          description: "Ohne `kcalOverride` wird der Mehrverbrauch geschätzt (MET-Tabelle, beim Laufen über die Distanz, beim Radfahren über das Tempo). Benötigt Schreibzugriff.",
          requestBody: {
            required: true,
            content: json(eingabe(trainingSchema), { sportart: "LAUFEN", dauerMin: 42, distanzKm: 8.1, durchschnittsPuls: 152 }),
          },
          responses: { "201": antwort("Angelegt", ref("Training")), ...SCHREIBEN },
        },
      },
      "/fitness/training/{id}": {
        delete: { tags: ["Fitness"], summary: "Training löschen", parameters: [parameter.id], responses: LOESCHEN },
      },
      "/fitness/gewicht": {
        get: {
          tags: ["Fitness"],
          summary: "Gewichtsverlauf",
          description: "Messungen im Zeitraum (Default: letzte 90 Tage) plus Statistik über alle Messungen: 7-Tage-Durchschnitt, Trend (Regression über 28 Tage) und Zielprognose.",
          parameters: [parameter.von, parameter.bis],
          responses: {
            "200": antwort(
              "Verlauf",
              objekt({
                von: DATUM,
                bis: DATUM,
                eintraege: { type: "array", items: ref("Gewicht") },
                statistik: objekt({
                  aktuellKg: n("number"),
                  geglaettet7TageKg: n("number"),
                  veraenderung7TageKg: n("number"),
                  veraenderung30TageKg: n("number"),
                  trendKgProWoche: n("number"),
                  prognose: objekt({
                    status: { type: "string", enum: ["KEIN_ZIEL", "ZU_WENIG_DATEN", "ERREICHT", "IN_RICHTUNG", "FALSCHE_RICHTUNG", "STAGNATION"] },
                    datum: n("string", { format: "date" }),
                    tage: n("integer"),
                  }),
                }),
              })
            ),
            ...LESEN_MIT_PARAMETERN,
          },
        },
        post: {
          tags: ["Fitness"],
          summary: "Gewicht speichern",
          description: "Ein Wert pro Tag — ein zweiter POST für denselben Tag überschreibt (Upsert). Ideal für Smart-Waagen. Benötigt Schreibzugriff.",
          requestBody: { required: true, content: json(eingabe(gewichtSchema), { gewichtKg: 82.4, koerperfettProzent: 18.5 }) },
          responses: { "201": antwort("Gespeichert", ref("Gewicht")), ...SCHREIBEN },
        },
      },
      "/fitness/gewicht/{id}": {
        delete: { tags: ["Fitness"], summary: "Messung löschen", parameters: [parameter.id], responses: LOESCHEN },
      },
      "/fitness/tageswerte": {
        get: {
          tags: ["Fitness"],
          summary: "Tageswerte lesen",
          description: "Schritte, Wasser, Schlaf, Ruhepuls eines Tages.",
          parameters: [parameter.datum],
          responses: { "200": antwort("Tageswerte", ref("Tageswerte")), ...LESEN_MIT_PARAMETERN },
        },
        put: {
          tags: ["Fitness"],
          summary: "Tageswerte setzen (Teil-Update)",
          description: "Nur gesendete Felder ändern sich; `null` löscht einen Wert. So kann z. B. Home Assistant stündlich nur `schritte` senden. Benötigt Schreibzugriff.",
          requestBody: { required: true, content: json(eingabe(tagesAktivitaetSchema), { schritte: 8432 }) },
          responses: { "200": antwort("Neuer Stand", ref("Tageswerte")), ...SCHREIBEN },
        },
      },
      "/fitness/tageswerte/wasser": {
        post: {
          tags: ["Fitness"],
          summary: "Wasser hinzufügen",
          description: "Addiert `ml` zum Tageswert (negativ = korrigieren, nie unter 0). Für „Glas getrunken“-Knöpfe. Benötigt Schreibzugriff.",
          requestBody: { required: true, content: json(eingabe(wasserHinzufuegenSchema), { ml: 250 }) },
          responses: { "200": antwort("Neuer Stand", ref("Tageswerte")), ...SCHREIBEN },
        },
      },
      "/fitness/lebensmittel": {
        get: {
          tags: ["Fitness"],
          summary: "Lebensmittel-Datenbank durchsuchen",
          description: "Referenz-Lebensmittel plus eigene Lebensmittel des Nutzers; Werte je 100 g.",
          parameters: [
            { name: "suche", in: "query", required: false, description: "Teilstring in Bezeichnung oder Kategorie (ohne Groß-/Kleinschreibung)", schema: { type: "string" } },
            { name: "limit", in: "query", required: false, schema: { type: "integer", minimum: 1, maximum: 200, default: 50 } },
          ],
          responses: {
            "200": antwort("Treffer", objekt({ suche: { type: "string" }, anzahl: { type: "integer" }, eintraege: { type: "array", items: ref("Lebensmittel") } })),
            ...LESEN_MIT_PARAMETERN,
          },
        },
      },
      "/finanzen/uebersicht": {
        get: {
          tags: ["Finanzen"],
          summary: "Finanz-Kennzahlen",
          description: "Dieselben Zahlen wie auf der Startseite (Referenzvermögen, Netto nach Schulden, Notgroschen, Immobilien-Cashflow, Ampel-Verteilung).",
          responses: {
            "200": antwort(
              "Kennzahlen",
              objekt({
                vermoegenReferenzEur: { type: "number" },
                vermoegenNettoEur: { type: "number" },
                immobilienEigenkapitalReferenzEur: { type: "number" },
                bargeldUndDepotsEur: { type: "number" },
                tagesgeldEur: { type: "number" },
                restschuldenEur: { type: "number" },
                fixkostenMonatlichEur: { type: "number" },
                notgroschenMonate: n("number"),
                immobilien: objekt({
                  gesamt: { type: "integer" },
                  imBesitz: { type: "integer" },
                  cashflowMonatlichEur: { type: "number" },
                  bruttorenditeSchnittProzent: n("number"),
                  ampel: objekt({ GRUEN: { type: "integer" }, GELB: { type: "integer" }, ROT: { type: "integer" } }),
                }),
                sparpositionen: objekt({
                  imBesitz: { type: "integer" },
                  groesste: { type: ["object", "null"], properties: { name: { type: "string" }, betrag: { type: "number" } } },
                }),
                szenarien: { type: "integer" },
              })
            ),
            ...LESEN,
          },
        },
      },
      "/home-assistant/sensoren": {
        get: {
          tags: ["Home Assistant"],
          summary: "Alle Sensorwerte",
          description: "Ein Request für alle Sensoren — in Home Assistant per `rest:`-Integration mit `value_template` auf einzelne Sensoren verteilen. Empfohlenes Intervall: 300 s.",
          responses: { "200": antwort("Sensorwerte", ref("HomeAssistantSensoren")), ...LESEN },
        },
      },
    }),
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", description: "API-Token (`tk_…`) aus /integrationen" },
      },
      schemas: {
        ...schemas,
        FotoAnalyseErgebnis: objekt({
          analyse: analyseSchema(),
          gespeichert: { type: "boolean" },
          eintraege: { type: "array", items: ref("Mahlzeit") },
        }),
      },
      responses: {
        UngueltigeAnfrage: antwort("Ungültige Anfrage (Parameter, Content-Type oder JSON)", ref("Fehler")),
        NichtAuthentifiziert: antwort("Token fehlt, ist unbekannt oder widerrufen", ref("Fehler")),
        KeinSchreibzugriff: antwort("Token ist nur zum Lesen berechtigt", ref("Fehler")),
        NichtGefunden: antwort("Eintrag existiert nicht (oder gehört einem anderen Nutzer)", ref("Fehler")),
        ZuGross: antwort("Body zu groß", ref("Fehler")),
        Validierung: antwort("Felder ungültig — Details je Feld", ref("Fehler"), {
          fehler: { code: "VALIDIERUNG", nachricht: "Eingabe ungültig.", details: [{ feld: "gewichtKg", nachricht: "Gewicht muss zwischen 20 und 400 kg liegen" }] },
        }),
        LimitErreicht: antwort("Tageslimit der KI-Analysen erreicht", ref("Fehler")),
        ExternerDienst: antwort("KI-Dienst nicht erreichbar oder Fehler", ref("Fehler")),
        NichtKonfiguriert: antwort("KI-Analyse ist auf diesem Server nicht eingerichtet", ref("Fehler")),
      },
    },
  };
}

