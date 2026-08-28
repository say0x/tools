import { describe, expect, it } from "vitest";
import { szenarioSchema, type SzenarioAenderungFormValues, type SzenarioFormValues } from "./szenario-schema";
import { VERMOEGENSVERLAUF_MAX_JAHRE } from "@/server/calc/constants";

function leereAenderung(overrides: Partial<SzenarioAenderungFormValues> = {}): SzenarioAenderungFormValues {
  return {
    typ: "IMMOBILIE_AUFNEHMEN",
    assetId: null,
    neueSparrateMonatlich: null,
    jahrAbHeute: null,
    bezeichnung: null,
    betrag: null,
    ...overrides,
  };
}

function validValues(aenderungen: SzenarioAenderungFormValues[] = []): SzenarioFormValues {
  return {
    name: "Testszenario",
    startjahr: new Date().getFullYear(),
    notizen: "",
    aenderungen,
  };
}

function pathOf(result: ReturnType<typeof szenarioSchema.safeParse>, path: string) {
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path.join(".").endsWith(path));
}

describe("szenarioSchema — Grundfelder", () => {
  it("akzeptiert gültige Werte ohne Änderungen", () => {
    expect(szenarioSchema.safeParse(validValues()).success).toBe(true);
  });

  it("lehnt einen fehlenden Namen ab", () => {
    const values = validValues();
    values.name = "";
    expect(szenarioSchema.safeParse(values).success).toBe(false);
  });

  it("lehnt ein Startjahr außerhalb des realistischen Bereichs ab", () => {
    const values = validValues();
    values.startjahr = 1899;
    expect(szenarioSchema.safeParse(values).success).toBe(false);
  });
});

describe("szenarioSchema — Änderungstyp IMMOBILIE_AUFNEHMEN", () => {
  it("verlangt eine assetId", () => {
    const values = validValues([leereAenderung({ typ: "IMMOBILIE_AUFNEHMEN", assetId: null })]);
    const result = szenarioSchema.safeParse(values);
    expect(result.success).toBe(false);
    expect(pathOf(result, "assetId")?.message).toMatch(/Objekt auswählen/);
  });

  it("akzeptiert eine gesetzte assetId", () => {
    const values = validValues([leereAenderung({ typ: "IMMOBILIE_AUFNEHMEN", assetId: "cmt7asset0000000000000000" })]);
    expect(szenarioSchema.safeParse(values).success).toBe(true);
  });
});

describe("szenarioSchema — Änderungstyp IMMOBILIE_VERKAUFEN", () => {
  it("verlangt eine assetId", () => {
    const values = validValues([
      leereAenderung({ typ: "IMMOBILIE_VERKAUFEN", assetId: null, jahrAbHeute: 5 }),
    ]);
    const result = szenarioSchema.safeParse(values);
    expect(result.success).toBe(false);
    expect(pathOf(result, "assetId")?.message).toMatch(/Objekt auswählen/);
  });

  it("verlangt ein Verkaufsjahr", () => {
    const values = validValues([
      leereAenderung({ typ: "IMMOBILIE_VERKAUFEN", assetId: "cmt7asset0000000000000000", jahrAbHeute: null }),
    ]);
    const result = szenarioSchema.safeParse(values);
    expect(result.success).toBe(false);
    expect(pathOf(result, "jahrAbHeute")?.message).toMatch(/Verkaufsjahr/);
  });

  it("akzeptiert assetId und Verkaufsjahr zusammen", () => {
    const values = validValues([
      leereAenderung({ typ: "IMMOBILIE_VERKAUFEN", assetId: "cmt7asset0000000000000000", jahrAbHeute: 5 }),
    ]);
    expect(szenarioSchema.safeParse(values).success).toBe(true);
  });
});

describe("szenarioSchema — Änderungstyp SPARRATE_AENDERN", () => {
  it("verlangt eine assetId", () => {
    const values = validValues([
      leereAenderung({ typ: "SPARRATE_AENDERN", assetId: null, neueSparrateMonatlich: 300 }),
    ]);
    const result = szenarioSchema.safeParse(values);
    expect(result.success).toBe(false);
    expect(pathOf(result, "assetId")?.message).toMatch(/Objekt auswählen/);
  });

  it("verlangt eine neue Sparrate", () => {
    const values = validValues([
      leereAenderung({ typ: "SPARRATE_AENDERN", assetId: "cmt7asset0000000000000000", neueSparrateMonatlich: null }),
    ]);
    const result = szenarioSchema.safeParse(values);
    expect(result.success).toBe(false);
    expect(pathOf(result, "neueSparrateMonatlich")?.message).toMatch(/neue Sparrate/);
  });

  it("akzeptiert assetId und neue Sparrate zusammen (auch 0)", () => {
    const values = validValues([
      leereAenderung({ typ: "SPARRATE_AENDERN", assetId: "cmt7asset0000000000000000", neueSparrateMonatlich: 0 }),
    ]);
    expect(szenarioSchema.safeParse(values).success).toBe(true);
  });
});

describe("szenarioSchema — Änderungstyp EINMALIGE_ANSCHAFFUNG", () => {
  it("verlangt eine Bezeichnung, einen Betrag und ein Jahr — aber keine assetId", () => {
    const values = validValues([leereAenderung({ typ: "EINMALIGE_ANSCHAFFUNG" })]);
    const result = szenarioSchema.safeParse(values);
    expect(result.success).toBe(false);
    expect(pathOf(result, "bezeichnung")).toBeDefined();
    expect(pathOf(result, "betrag")).toBeDefined();
    expect(pathOf(result, "jahrAbHeute")).toBeDefined();
    expect(pathOf(result, "assetId")).toBeUndefined();
  });

  it("meldet nur das jeweils fehlende Feld einzeln", () => {
    const nurBezeichnungFehlt = validValues([
      leereAenderung({ typ: "EINMALIGE_ANSCHAFFUNG", bezeichnung: null, betrag: 5000, jahrAbHeute: 2 }),
    ]);
    const result = szenarioSchema.safeParse(nurBezeichnungFehlt);
    expect(result.success).toBe(false);
    expect(pathOf(result, "bezeichnung")).toBeDefined();
    expect(pathOf(result, "betrag")).toBeUndefined();
    expect(pathOf(result, "jahrAbHeute")).toBeUndefined();
  });

  it("akzeptiert Bezeichnung, Betrag und Jahr zusammen, ohne assetId", () => {
    const values = validValues([
      leereAenderung({ typ: "EINMALIGE_ANSCHAFFUNG", bezeichnung: "Neues Auto", betrag: 25_000, jahrAbHeute: 3, assetId: null }),
    ]);
    expect(szenarioSchema.safeParse(values).success).toBe(true);
  });
});

describe("szenarioSchema — jahrAbHeute-Obergrenze", () => {
  it("akzeptiert das Maximum (VERMOEGENSVERLAUF_MAX_JAHRE)", () => {
    const values = validValues([
      leereAenderung({
        typ: "EINMALIGE_ANSCHAFFUNG",
        bezeichnung: "Grenzfall",
        betrag: 1000,
        jahrAbHeute: VERMOEGENSVERLAUF_MAX_JAHRE,
      }),
    ]);
    expect(szenarioSchema.safeParse(values).success).toBe(true);
  });

  it("lehnt ein Jahr über dem Maximum ab, weil es im Vermögensverlauf nie sichtbar würde", () => {
    const values = validValues([
      leereAenderung({
        typ: "EINMALIGE_ANSCHAFFUNG",
        bezeichnung: "Zu weit in der Zukunft",
        betrag: 1000,
        jahrAbHeute: VERMOEGENSVERLAUF_MAX_JAHRE + 1,
      }),
    ]);
    expect(szenarioSchema.safeParse(values).success).toBe(false);
  });

  it("lehnt ein negatives Jahr ab", () => {
    const values = validValues([
      leereAenderung({ typ: "EINMALIGE_ANSCHAFFUNG", bezeichnung: "Vergangenheit", betrag: 1000, jahrAbHeute: -1 }),
    ]);
    expect(szenarioSchema.safeParse(values).success).toBe(false);
  });
});

describe("szenarioSchema — mehrere Änderungen gemischt", () => {
  it("validiert jede Änderung unabhängig anhand ihres eigenen Typs", () => {
    const values = validValues([
      leereAenderung({ typ: "IMMOBILIE_AUFNEHMEN", assetId: "cmt7asset0000000000000001" }),
      leereAenderung({ typ: "EINMALIGE_ANSCHAFFUNG", bezeichnung: "Renovierung", betrag: 10_000, jahrAbHeute: 1 }),
    ]);
    expect(szenarioSchema.safeParse(values).success).toBe(true);
  });

  it("meldet einen Fehler für die richtige Position im Array, wenn nur eine von mehreren Änderungen ungültig ist", () => {
    const values = validValues([
      leereAenderung({ typ: "IMMOBILIE_AUFNEHMEN", assetId: "cmt7asset0000000000000001" }),
      leereAenderung({ typ: "IMMOBILIE_AUFNEHMEN", assetId: null }),
    ]);
    const result = szenarioSchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join(".") === "aenderungen.1.assetId");
      expect(issue).toBeDefined();
    }
  });
});
