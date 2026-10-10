import { describe, expect, it } from "vitest";
import { erzeugeApiToken, extrahiereBearerToken, hashApiToken, istTokenFormat } from "./token";

describe("erzeugeApiToken", () => {
  it("erzeugt ein Token im erwarteten Format mit passendem Hash und Präfix", () => {
    const t = erzeugeApiToken();
    expect(istTokenFormat(t.klartext)).toBe(true);
    expect(t.hash).toBe(hashApiToken(t.klartext));
    expect(t.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(t.klartext.startsWith(t.praefix)).toBe(true);
    expect(t.praefix).toHaveLength(9);
  });

  it("erzeugt jedes Mal ein anderes Token", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => erzeugeApiToken().klartext));
    expect(tokens.size).toBe(50);
  });
});

describe("hashApiToken", () => {
  it("ist SHA-256 (hex) — bekannter Testvektor für \"abc\"", () => {
    expect(hashApiToken("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("extrahiereBearerToken", () => {
  const token = erzeugeApiToken().klartext;

  it("liest Bearer-Header unabhängig von der Schreibweise des Schemas", () => {
    expect(extrahiereBearerToken(`Bearer ${token}`)).toBe(token);
    expect(extrahiereBearerToken(`bearer ${token}`)).toBe(token);
  });

  it.each([null, "", "Basic abc", `Bearer ${token} extra`, "Bearer tk_zu-kurz", `Token ${token}`])("lehnt %s ab", (header) => {
    expect(extrahiereBearerToken(header)).toBeNull();
  });
});
