import { describe, expect, it } from "vitest";
import { validiereBackup } from "./restore-schema";
import { defaultPropertyFormValues } from "@/lib/property-form-defaults";

function rawObjekt(overrides: Record<string, unknown> = {}) {
  const d = defaultPropertyFormValues();
  return {
    id: "objekt-1",
    assetId: "asset-objekt-1",
    createdAt: "2024-01-01T00:00:00.000Z",
    asset: { id: "asset-objekt-1", name: "Testobjekt", besitzstatus: d.besitzstatus },
    kaufpreis: d.kaufpreis,
    kaufdatum: "2024-01-01T00:00:00.000Z",
    wohnflaeche: d.wohnflaeche,
    bundesland: d.bundesland,
    lagetyp: d.lagetyp,
    objekttyp: d.objekttyp,
    baujahr: d.baujahr,
    anzahlEinheiten: d.anzahlEinheiten,
    grunderwerbsteuerProzent: d.grunderwerbsteuerProzent,
    grunderwerbsteuerOverride: d.grunderwerbsteuerOverride,
    notarProzent: d.notarProzent,
    notarOverride: d.notarOverride,
    grundbuchProzent: d.grundbuchProzent,
    grundbuchOverride: d.grundbuchOverride,
    maklerprovisionProzent: d.maklerprovisionProzent,
    maklerprovisionOverride: d.maklerprovisionOverride,
    sanierungsmodus: d.sanierungsmodus,
    sofortinvestitionPauschal: d.sofortinvestitionPauschal,
    gebaeudeWohnflaecheGesamt: d.gebaeudeWohnflaecheGesamt,
    miteigentumsanteilProzent: d.miteigentumsanteilProzent,
    miteigentumsanteilOverride: d.miteigentumsanteilOverride,
    kaltmieteMonatlich: d.kaltmieteMonatlich,
    mietsteigerungProzentJaehrlich: d.mietsteigerungProzentJaehrlich,
    wertsteigerungProzentJaehrlich: d.wertsteigerungProzentJaehrlich,
    kostensteigerungProzentJaehrlich: d.kostensteigerungProzentJaehrlich,
    hausgeldUmlagefaehigMonatlich: d.hausgeldUmlagefaehigMonatlich,
    hausgeldNichtUmlagefaehigMonatlich: d.hausgeldNichtUmlagefaehigMonatlich,
    grundsteuerJaehrlich: d.grundsteuerJaehrlich,
    instandhaltungsruecklageMonatlich: d.instandhaltungsruecklageMonatlich,
    instandhaltungsruecklageOverride: d.instandhaltungsruecklageOverride,
    verwaltungskostenMonatlich: d.verwaltungskostenMonatlich,
    leerstandsquoteProzent: d.leerstandsquoteProzent,
    versicherungJaehrlich: d.versicherungJaehrlich,
    versicherungUmlagefaehig: d.versicherungUmlagefaehig,
    afaSatzProzent: d.afaSatzProzent,
    afaSatzProzentOverride: d.afaSatzProzentOverride,
    afaSonderabschreibung: d.afaSonderabschreibung,
    ansprechpartnerName: d.ansprechpartnerName,
    ansprechpartnerTelefon: d.ansprechpartnerTelefon,
    ansprechpartnerEmail: d.ansprechpartnerEmail,
    ansprechpartnerNotizen: d.ansprechpartnerNotizen,
    notizen: d.notizen,
    quelleUrl: d.quelleUrl,
    financing: { id: "financing-1", ...d.financing },
    gewerke: [] as unknown[],
    exit: { id: "exit-1", ...d.exit },
    ...overrides,
  };
}

function rawProfil(overrides: Record<string, unknown> = {}) {
  return {
    id: "profil-1",
    nettoEinkommenMonatlich: 3000,
    bruttoEinkommenMonatlich: 4000,
    zuVersteuerndesEinkommenJaehrlich: 40000,
    zvEOverride: false,
    fixkostenMonatlich: 1500,
    vorhandenesEigenkapital: 50000,
    maxSchuldendienstquoteProzent: 35,
    mindestLiquiditaetsreserveEuro: 10000,
    mietanrechnungProzent: 80,
    mindestEigenkapitalrenditeProzent: 4,
    eigenkapitalPruefungAbEuro: 5000,
    cashflowStartverlustMaxProzentKaltmiete: 30,
    cashflowUmschlagjahr: 10,
    gehaltssteigerungProzentJaehrlich: 2,
    inflationProzentJaehrlich: 2,
    bundesland: "NORDRHEIN_WESTFALEN",
    kirchensteuerpflichtig: false,
    beschaeftigungsstatus: "ANGESTELLT",
    gesetzlichKrankenversichert: true,
    kinderlos: false,
    liabilities: [] as unknown[],
    ...overrides,
  };
}

function rawTagesgeld(overrides: Record<string, unknown> = {}) {
  return {
    id: "tagesgeld-1",
    assetId: "asset-sparposition-1",
    createdAt: "2024-01-01T00:00:00.000Z",
    asset: { name: "Testkonto", besitzstatus: "BESITZE_ICH" },
    betrag: 5000,
    zinsProzentJaehrlich: 2,
    sparplanBetragMonatlich: 100,
    sparplanSteigerungProzentJaehrlich: 0,
    ...overrides,
  };
}

function rawWertpapier(overrides: Record<string, unknown> = {}) {
  return {
    id: "wertpapier-1",
    assetId: "asset-wertpapier-1",
    createdAt: "2024-01-01T00:00:00.000Z",
    asset: { name: "Test-ETF", besitzstatus: "BESITZE_ICH" },
    betrag: 10000,
    renditeProzentJaehrlich: 7,
    sparplanBetragMonatlich: 200,
    sparplanSteigerungProzentJaehrlich: 2,
    ...overrides,
  };
}

function rawSzenario(overrides: Record<string, unknown> = {}) {
  return {
    id: "szenario-1",
    createdAt: "2024-01-01T00:00:00.000Z",
    name: "Testszenario",
    startjahr: new Date().getFullYear(),
    notizen: "",
    aenderungen: [] as unknown[],
    ...overrides,
  };
}

function validBackup(overrides: Record<string, unknown> = {}) {
  return {
    exportiertAm: "2024-01-01T00:00:00.000Z",
    objekte: [rawObjekt()],
    profil: rawProfil(),
    sparpositionen: { wertpapiere: [], tagesgeld: [rawTagesgeld()] },
    szenarien: [rawSzenario()],
    // wird beim Restore ignoriert (siehe restore-schema.ts) — muss ein
    // vollständiger Export trotzdem klaglos durchlaufen.
    referenzdaten: { irgendwas: 123 },
    standardwerte: { irgendwas: 456 },
    ...overrides,
  };
}

describe("validiereBackup — Grundfall", () => {
  it("akzeptiert ein vollständiges, gültiges Backup und liefert die richtigen Zählungen", () => {
    const result = validiereBackup(validBackup());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.objekte).toHaveLength(1);
      expect(result.data.sparpositionen).toHaveLength(1);
      expect(result.data.szenarien).toHaveLength(1);
      expect(result.data.profil).not.toBeNull();
      expect(result.data.exportiertAm).toBe("2024-01-01T00:00:00.000Z");
    }
  });

  it("akzeptiert ein Backup ohne Profil (noch nie gespeichert)", () => {
    const result = validiereBackup(validBackup({ profil: null }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.profil).toBeNull();
    }
  });

  it("akzeptiert ein leeres Backup (keine Objekte/Sparpositionen/Szenarien, kein Profil)", () => {
    const result = validiereBackup(
      validBackup({ objekte: [], profil: null, sparpositionen: { wertpapiere: [], tagesgeld: [] }, szenarien: [] })
    );
    expect(result.success).toBe(true);
  });

  it("wandelt Decimal-Strings (wie sie Prisma Decimal.toJSON() liefert) korrekt in Zahlen um", () => {
    const result = validiereBackup(validBackup({ objekte: [rawObjekt({ kaufpreis: "250000.00" })] }));
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.objekte[0].values.kaufpreis).toBe(250000);
    }
  });

  it("liest Wertpapierpositionen (renditeProzentJaehrlich) und Tagesgeldkonten (zinsProzentJaehrlich) korrekt aus ihren unterschiedlich benannten Zinsfeldern", () => {
    const result = validiereBackup(
      validBackup({ sparpositionen: { wertpapiere: [rawWertpapier()], tagesgeld: [rawTagesgeld()] } })
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sparpositionen).toHaveLength(2);
      const wertpapier = result.data.sparpositionen.find((s) => s.values.art === "WERTPAPIERDEPOT");
      const tagesgeld = result.data.sparpositionen.find((s) => s.values.art === "TAGESGELD");
      expect(wertpapier?.values.renditeProzentJaehrlich).toBe(7);
      expect(tagesgeld?.values.renditeProzentJaehrlich).toBe(2);
    }
  });
});

describe("validiereBackup — Strukturfehler", () => {
  it("lehnt eine völlig falsche Struktur ab, statt zu crashen", () => {
    const result = validiereBackup({ irgendwas: "kein Backup" });
    expect(result.success).toBe(false);
  });

  it("lehnt null/undefined/einen String statt eines Objekts ab", () => {
    expect(validiereBackup(null).success).toBe(false);
    expect(validiereBackup(undefined).success).toBe(false);
    expect(validiereBackup("kaputt").success).toBe(false);
  });
});

describe("validiereBackup — Fachliche Wertebereiche (wiederverwendet über propertySchema etc.)", () => {
  it("lehnt ein Objekt mit Kaufpreis 0 ab (verletzt propertySchema) und nennt den Objektnamen", () => {
    const result = validiereBackup(
      validBackup({ objekte: [rawObjekt({ kaufpreis: 0, asset: { id: "asset-objekt-1", name: "Kaputtes Objekt", besitzstatus: "BESITZE_ICH" } })] })
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/Kaputtes Objekt/);
    }
  });

  it("lehnt eine negative Restschuld in den Verbindlichkeiten ab (verletzt profileSchema)", () => {
    const result = validiereBackup(
      validBackup({ profil: rawProfil({ liabilities: [{ id: "liability-1", bezeichnung: "Autokredit", monatlicheRate: 200, restschuld: -1 }] }) })
    );
    expect(result.success).toBe(false);
  });

  it("lehnt eine unrealistische Gehaltssteigerung über 100% ab", () => {
    const result = validiereBackup(validBackup({ profil: rawProfil({ gehaltssteigerungProzentJaehrlich: 150 }) }));
    expect(result.success).toBe(false);
  });

  it("sammelt mehrere Fehler aus verschiedenen Bereichen in einem Durchgang statt nur den ersten zu melden", () => {
    const result = validiereBackup(
      validBackup({
        objekte: [rawObjekt({ kaufpreis: 0 })],
        profil: rawProfil({ gehaltssteigerungProzentJaehrlich: 150 }),
      })
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.split("\n").length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("validiereBackup — Szenario-Referenzen", () => {
  it("akzeptiert eine Szenario-Änderung, die ein im Backup enthaltenes Objekt referenziert", () => {
    const result = validiereBackup(
      validBackup({
        szenarien: [rawSzenario({ aenderungen: [{ id: "aenderung-1", typ: "IMMOBILIE_AUFNEHMEN", assetId: "asset-objekt-1", neueSparrateMonatlich: null, jahrAbHeute: null, bezeichnung: null, betrag: null, alternativanlageRenditeProzent: null }] })],
      })
    );
    expect(result.success).toBe(true);
  });

  it("akzeptiert eine Szenario-Änderung, die eine im Backup enthaltene Sparposition referenziert", () => {
    const result = validiereBackup(
      validBackup({
        szenarien: [rawSzenario({ aenderungen: [{ id: "aenderung-1", typ: "SPARRATE_AENDERN", assetId: "asset-sparposition-1", neueSparrateMonatlich: 200, jahrAbHeute: null, bezeichnung: null, betrag: null, alternativanlageRenditeProzent: null }] })],
      })
    );
    expect(result.success).toBe(true);
  });

  it("lehnt eine Szenario-Änderung ab, die ein nicht im Backup enthaltenes Objekt/Position referenziert", () => {
    const result = validiereBackup(
      validBackup({
        szenarien: [rawSzenario({ aenderungen: [{ id: "aenderung-1", typ: "IMMOBILIE_AUFNEHMEN", assetId: "unbekannte-id", neueSparrateMonatlich: null, jahrAbHeute: null, bezeichnung: null, betrag: null, alternativanlageRenditeProzent: null }] })],
      })
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toMatch(/nicht im Backup enthalten/);
    }
  });
});
