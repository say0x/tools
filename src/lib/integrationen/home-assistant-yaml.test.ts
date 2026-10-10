import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse, type CollectionTag, type ScalarTag } from "yaml";
import { erzeugeOpenApiSpezifikation } from "@/server/api/openapi";
import { HA_SENSOREN, curlBeispiele, haRestCommandYaml, haSecretsYaml, haSensorYaml } from "./home-assistant-yaml";

/** Basis-URL, mit der die Snippets in docs/integrations/home-assistant.md erzeugt sind. */
const DOKU_BASIS_URL = "http://tools.lan:3000";

const secretTag: ScalarTag = { tag: "!secret", resolve: (wert: string) => ({ secret: wert }) };
const leseYaml = (text: string) => parse(text, { customTags: [secretTag as ScalarTag | CollectionTag] });

const sensorSchema = erzeugeOpenApiSpezifikation().components.schemas.HomeAssistantSensoren as {
  properties: Record<string, { properties?: Record<string, unknown> }>;
};

describe("Home-Assistant-Konfiguration", () => {
  it("ist gültiges YAML mit der erwarteten Struktur", () => {
    const sensoren = leseYaml(haSensorYaml(DOKU_BASIS_URL));
    const rest = sensoren.rest[0];
    expect(rest.resource).toBe(`${DOKU_BASIS_URL}/api/v1/home-assistant/sensoren`);
    expect(rest.headers.Authorization).toEqual({ secret: "tools_api_auth" });
    expect(rest.sensor).toHaveLength(HA_SENSOREN.length);
    expect(rest.binary_sensor).toHaveLength(1);

    const befehle = leseYaml(haRestCommandYaml(DOKU_BASIS_URL)).rest_command;
    expect(Object.keys(befehle)).toEqual(["tools_wasser", "tools_gewicht", "tools_schritte", "tools_training"]);
    expect(befehle.tools_schritte.method).toBe("PUT");
    expect(befehle.tools_wasser.content_type).toBe("application/json");

    expect(leseYaml(haSecretsYaml()).tools_api_auth).toMatch(/^Bearer tk_/);
  });

  it("jeder Sensor verweist auf ein Feld, das die API wirklich liefert", () => {
    for (const s of HA_SENSOREN) {
      const [gruppe, feld] = s.wert.split(".");
      expect(sensorSchema.properties[gruppe]?.properties, s.wert).toHaveProperty(feld);
    }
  });

  it("unique_ids sind eindeutig", () => {
    const ids = leseYaml(haSensorYaml(DOKU_BASIS_URL)).rest[0].sensor.map((s: { unique_id: string }) => s.unique_id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("Geldbeträge haben keine state_class measurement (HA lehnt das für Währungen ab)", () => {
    for (const s of HA_SENSOREN.filter((x) => x.einheit === "EUR")) expect(s.statistik, s.name).toBeFalsy();
  });

  it("die Doku enthält exakt die generierten Snippets", () => {
    const doku = readFileSync(path.join(process.cwd(), "docs/integrations/home-assistant.md"), "utf8");
    expect(doku).toContain(haSecretsYaml());
    expect(doku).toContain(haSensorYaml(DOKU_BASIS_URL));
    expect(doku).toContain(haRestCommandYaml(DOKU_BASIS_URL));
  });

  it("alle YAML-Blöcke der Doku (Automationen, Karten) sind gültiges YAML", () => {
    const doku = readFileSync(path.join(process.cwd(), "docs/integrations/home-assistant.md"), "utf8");
    const bloecke = [...doku.matchAll(/```yaml\n([\s\S]*?)```/g)].map((m) => m[1]);
    expect(bloecke.length).toBeGreaterThanOrEqual(8);
    for (const block of bloecke) expect(() => leseYaml(block), block.slice(0, 80)).not.toThrow();
  });

  it("curl-Beispiele nutzen die Umgebungsvariable statt eines Tokens", () => {
    for (const b of curlBeispiele(DOKU_BASIS_URL)) {
      expect(b.befehl).toContain("$TOOLS_TOKEN");
      expect(b.befehl).not.toMatch(/tk_[A-Za-z0-9_-]{10,}/);
    }
  });
});
