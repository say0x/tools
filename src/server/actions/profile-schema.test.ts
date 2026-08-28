import { describe, expect, it } from "vitest";
import { profileSchema, type ProfileFormValues } from "./profile-schema";

type Liability = ProfileFormValues["liabilities"][number];

function validLiability(overrides: Partial<Liability> = {}): Liability {
  return {
    id: null,
    bezeichnung: "Autokredit",
    monatlicheRate: 250,
    restschuld: 8_000,
    ...overrides,
  };
}

function validValues(): ProfileFormValues {
  return {
    nettoEinkommenMonatlich: 3500,
    bruttoEinkommenMonatlich: 5000,
    zuVersteuerndesEinkommenJaehrlich: 42_000,
    zvEOverride: false,
    fixkostenMonatlich: 1500,
    vorhandenesEigenkapital: 50_000,
    maxSchuldendienstquoteProzent: 35,
    mindestLiquiditaetsreserveEuro: 10_000,
    mietanrechnungProzent: 80,
    mindestEigenkapitalrenditeProzent: 4,
    eigenkapitalPruefungAbEuro: 20_000,
    cashflowStartverlustMaxProzentKaltmiete: 20,
    cashflowUmschlagjahr: 5,
    liabilities: [validLiability()],
  };
}

describe("profileSchema — Grundfelder", () => {
  it("akzeptiert gültige Werte", () => {
    expect(profileSchema.safeParse(validValues()).success).toBe(true);
  });

  it("akzeptiert eine leere Kredit-Liste", () => {
    const values = validValues();
    values.liabilities = [];
    expect(profileSchema.safeParse(values).success).toBe(true);
  });

  it("lehnt negatives Netto-Einkommen ab", () => {
    const values = validValues();
    values.nettoEinkommenMonatlich = -1;
    expect(profileSchema.safeParse(values).success).toBe(false);
  });

  it("lehnt eine Schuldendienstquote über 100% ab", () => {
    const values = validValues();
    values.maxSchuldendienstquoteProzent = 101;
    expect(profileSchema.safeParse(values).success).toBe(false);
  });

  it("lehnt eine negative Mindest-Liquiditätsreserve ab", () => {
    const values = validValues();
    values.mindestLiquiditaetsreserveEuro = -1;
    expect(profileSchema.safeParse(values).success).toBe(false);
  });

  it("akzeptiert eine negative Mindest-EK-Rendite (realistischer Bereich erlaubt Verluste)", () => {
    const values = validValues();
    values.mindestEigenkapitalrenditeProzent = -10;
    expect(profileSchema.safeParse(values).success).toBe(true);
  });
});

describe("profileSchema — cashflowUmschlagjahr", () => {
  it("lehnt einen nicht-ganzzahligen Wert ab", () => {
    const values = validValues();
    values.cashflowUmschlagjahr = 5.5;
    expect(profileSchema.safeParse(values).success).toBe(false);
  });

  it("lehnt 0 ab (Minimum ist 1)", () => {
    const values = validValues();
    values.cashflowUmschlagjahr = 0;
    expect(profileSchema.safeParse(values).success).toBe(false);
  });

  it("akzeptiert das Maximum von 50", () => {
    const values = validValues();
    values.cashflowUmschlagjahr = 50;
    expect(profileSchema.safeParse(values).success).toBe(true);
  });

  it("lehnt 51 ab (über dem Maximum)", () => {
    const values = validValues();
    values.cashflowUmschlagjahr = 51;
    expect(profileSchema.safeParse(values).success).toBe(false);
  });
});

describe("profileSchema — liabilities", () => {
  it("akzeptiert id: null für neu hinzugefügte Kredite", () => {
    const values = validValues();
    values.liabilities = [validLiability({ id: null })];
    expect(profileSchema.safeParse(values).success).toBe(true);
  });

  it("akzeptiert eine gesetzte id für bestehende Kredite", () => {
    const values = validValues();
    values.liabilities = [validLiability({ id: "cmt7existingliability0000" })];
    expect(profileSchema.safeParse(values).success).toBe(true);
  });

  it("lehnt eine fehlende Bezeichnung ab", () => {
    const values = validValues();
    values.liabilities = [validLiability({ bezeichnung: "" })];
    expect(profileSchema.safeParse(values).success).toBe(false);
  });

  it("lehnt eine negative Restschuld ab", () => {
    const values = validValues();
    values.liabilities = [validLiability({ restschuld: -1 })];
    expect(profileSchema.safeParse(values).success).toBe(false);
  });

  it("lehnt eine negative monatliche Rate ab", () => {
    const values = validValues();
    values.liabilities = [validLiability({ monatlicheRate: -1 })];
    expect(profileSchema.safeParse(values).success).toBe(false);
  });
});
