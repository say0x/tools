import { describe, expect, it } from "vitest";
import { Decimal } from "@prisma/client/runtime/client";
import {
  splitPropertyData,
  toPropertyInput,
  toProfileInput,
  toPropertyFormValues,
  toSparpositionFormValues,
  type PropertyWithAsset,
  type WertpapierpositionWithAsset,
  type TagesgeldkontoWithAsset,
} from "./mappers";
import { defaultPropertyFormValues } from "@/lib/property-form-defaults";
import type { PropertyFormValues } from "@/server/actions/property";

// Deckt Decimal->number-Konvertierung ab (server/data/mappers.ts, Wandlung von Prisma-
// Zeilen zurück in die von der Calc-Engine/Formularen erwartete number-Form) — bisher
// ungetestet, obwohl genau hier während der Decimal-Migration ein Fehler entstehen
// könnte, den TypeScript nicht fängt (ein vergessenes .toNumber() liefert zur Laufzeit
// ein Decimal-Objekt statt einer number, bleibt aber "kompatibel" bis zur Berechnung).
const dec = (value: number) => new Decimal(value);

function buildPropertyRow(overrides: Partial<PropertyWithAsset> = {}): PropertyWithAsset {
  return {
    id: "prop_1",
    assetId: "asset_1",
    kaufpreis: dec(450000),
    kaufdatum: new Date("2024-05-01"),
    wohnflaeche: 82.5,
    bundesland: "BAYERN",
    lagetyp: "GROSSSTADT",
    objekttyp: "EIGENTUMSWOHNUNG",
    baujahr: 1998,
    anzahlEinheiten: 1,
    grunderwerbsteuerProzent: dec(3.5),
    grunderwerbsteuerOverride: false,
    notarProzent: dec(1.5),
    notarOverride: true,
    grundbuchProzent: dec(0.5),
    grundbuchOverride: false,
    maklerprovisionProzent: dec(3.57),
    maklerprovisionOverride: false,
    sanierungsmodus: "PAUSCHAL",
    sofortinvestitionPauschal: dec(5000),
    gebaeudeWohnflaecheGesamt: 400,
    miteigentumsanteilProzent: dec(20.63),
    miteigentumsanteilOverride: false,
    kaltmieteMonatlich: dec(950),
    mietsteigerungProzentJaehrlich: dec(1.5),
    wertsteigerungProzentJaehrlich: dec(2.1),
    kostensteigerungProzentJaehrlich: dec(2.2),
    hausgeldUmlagefaehigMonatlich: dec(120),
    hausgeldNichtUmlagefaehigMonatlich: dec(80),
    grundsteuerJaehrlich: dec(360),
    instandhaltungsruecklageMonatlich: dec(45),
    instandhaltungsruecklageOverride: false,
    verwaltungskostenMonatlich: dec(25),
    leerstandsquoteProzent: dec(2),
    versicherungJaehrlich: dec(200),
    versicherungUmlagefaehig: true,
    afaSatzProzent: dec(2),
    afaSatzProzentOverride: false,
    afaSonderabschreibung: false,
    ansprechpartnerName: "Max Mustermann",
    ansprechpartnerTelefon: "0170 1234567",
    ansprechpartnerEmail: "makler@example.com",
    ansprechpartnerNotizen: "",
    notizen: "Instandhaltungsrücklage geschätzt",
    quelleUrl: "https://example.com/expose/1",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    financing: {
      id: "fin_1",
      propertyId: "prop_1",
      eigenkapital: dec(50000),
      zinssatzProzent: dec(3.8),
      anfaenglicheTilgungProzent: dec(2),
      zinsbindungJahre: 10,
      finanzierungsart: "FINANZIERUNG_110",
      eigenkapitalquoteManuellProzent: dec(11.11),
      anschlusszinsAufschlagProzent: dec(1),
      sondertilgungProzent: dec(5),
      sondertilgungMaxProzent: dec(5),
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    gewerke: [
      {
        id: "gewerk_1",
        propertyId: "prop_1",
        gewerk: "DACH",
        zustand: 3,
        eigentumsTyp: "SONDEREIGENTUM",
        geschaetzteKostenOverride: dec(8000),
        kommentar: "vor 5 Jahren erneuert",
        baujahr: 2019,
        verglasung: null,
        sofortSanieren: true,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ],
    exit: {
      id: "exit_1",
      propertyId: "prop_1",
      geplant: true,
      haltedauerJahre: 12,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    asset: {
      id: "asset_1",
      type: "IMMOBILIE",
      name: "Musterstraße 12, München",
      besitzstatus: "BESITZE_ICH",
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    },
    ...overrides,
  } as unknown as PropertyWithAsset;
}

describe("splitPropertyData", () => {
  it("trennt name und besitzstatus von den Property-Feldern", () => {
    const values: PropertyFormValues = {
      ...defaultPropertyFormValues(),
      name: "Musterstraße 12",
      besitzstatus: "BESITZE_ICH",
    };

    const { name, besitzstatus, property } = splitPropertyData(values);

    expect(name).toBe("Musterstraße 12");
    expect(besitzstatus).toBe("BESITZE_ICH");
    expect(property).not.toHaveProperty("name");
    expect(property).not.toHaveProperty("besitzstatus");
  });

  it("wandelt das kaufdatum von einem YYYY-MM-DD-String in ein Date-Objekt um", () => {
    const values: PropertyFormValues = { ...defaultPropertyFormValues(), kaufdatum: "2028-03-17" };

    const { property } = splitPropertyData(values);

    expect(property.kaufdatum).toBeInstanceOf(Date);
    expect(property.kaufdatum.toISOString().slice(0, 10)).toBe("2028-03-17");
  });

  it("trennt financing, gewerke und exit als eigene Top-Level-Felder ab, statt sie in property zu belassen", () => {
    const values: PropertyFormValues = {
      ...defaultPropertyFormValues(),
      financing: { ...defaultPropertyFormValues().financing, zinssatzProzent: 4.2 },
      gewerke: [
        {
          gewerk: "DACH",
          zustand: 3,
          eigentumsTyp: "SONDEREIGENTUM",
          geschaetzteKostenOverride: null,
          kommentar: "",
          baujahr: null,
          verglasung: null,
          sofortSanieren: true,
        },
      ],
      exit: { geplant: true, haltedauerJahre: 8 },
    };

    const { property, financing, gewerke, exit } = splitPropertyData(values);

    expect(financing.zinssatzProzent).toBe(4.2);
    expect(gewerke).toHaveLength(1);
    expect(gewerke[0].gewerk).toBe("DACH");
    expect(exit).toEqual({ geplant: true, haltedauerJahre: 8 });
    expect(property).not.toHaveProperty("financing");
    expect(property).not.toHaveProperty("gewerke");
    expect(property).not.toHaveProperty("exit");
  });

  it("behält alle übrigen skalaren Property-Felder unverändert bei", () => {
    const values: PropertyFormValues = {
      ...defaultPropertyFormValues(),
      kaufpreis: 312500,
      wohnflaeche: 82.5,
      bundesland: "BAYERN",
      baujahr: 1978,
    };

    const { property } = splitPropertyData(values);

    expect(property.kaufpreis).toBe(312500);
    expect(property.wohnflaeche).toBe(82.5);
    expect(property.bundesland).toBe("BAYERN");
    expect(property.baujahr).toBe(1978);
  });

  it("lässt eine leere gewerke-Liste unverändert durch", () => {
    const { gewerke } = splitPropertyData(defaultPropertyFormValues());

    expect(gewerke).toEqual([]);
  });
});

describe("toPropertyInput", () => {
  it("wandelt jedes Decimal-Feld korrekt in eine number um", () => {
    const input = toPropertyInput(buildPropertyRow());

    expect(input).toMatchObject({
      kaufpreis: 450000,
      wohnflaeche: 82.5,
      grunderwerbsteuerProzent: 3.5,
      grunderwerbsteuerOverride: false,
      notarProzent: 1.5,
      notarOverride: true,
      grundbuchProzent: 0.5,
      maklerprovisionProzent: 3.57,
      sofortinvestitionPauschal: 5000,
      gebaeudeWohnflaecheGesamt: 400,
      miteigentumsanteilProzent: 20.63,
      kaltmieteMonatlich: 950,
      mietsteigerungProzentJaehrlich: 1.5,
      wertsteigerungProzentJaehrlich: 2.1,
      kostensteigerungProzentJaehrlich: 2.2,
      hausgeldUmlagefaehigMonatlich: 120,
      hausgeldNichtUmlagefaehigMonatlich: 80,
      grundsteuerJaehrlich: 360,
      instandhaltungsruecklageMonatlich: 45,
      verwaltungskostenMonatlich: 25,
      leerstandsquoteProzent: 2,
      versicherungJaehrlich: 200,
      versicherungUmlagefaehig: true,
      afaSatzProzent: 2,
    });
    // Alle Werte müssen echte numbers sein, nicht nur numerisch gleichwertige Decimal-Objekte.
    for (const [key, value] of Object.entries(input)) {
      if (typeof value === "number") continue;
      expect(value, `Feld "${key}" ist kein primitiver Typ: ${JSON.stringify(value)}`).not.toBeInstanceOf(Decimal);
    }
  });

  it("wandelt financing korrekt um, inkl. der nullable eigenkapitalquoteManuellProzent", () => {
    const input = toPropertyInput(buildPropertyRow());

    expect(input.financing).toEqual({
      eigenkapital: 50000,
      zinssatzProzent: 3.8,
      anfaenglicheTilgungProzent: 2,
      zinsbindungJahre: 10,
      finanzierungsart: "FINANZIERUNG_110",
      eigenkapitalquoteManuellProzent: 11.11,
      anschlusszinsAufschlagProzent: 1,
      sondertilgungProzent: 5,
      sondertilgungMaxProzent: 5,
    });
  });

  it("fällt bei financing=null auf die dokumentierten Default-Werte zurück", () => {
    const input = toPropertyInput(buildPropertyRow({ financing: null }));

    expect(input.financing).toEqual({
      eigenkapital: 0,
      zinssatzProzent: 3.5,
      anfaenglicheTilgungProzent: 2,
      zinsbindungJahre: 10,
      finanzierungsart: "FINANZIERUNG_110",
      eigenkapitalquoteManuellProzent: null,
      anschlusszinsAufschlagProzent: 1,
      sondertilgungProzent: 0,
      sondertilgungMaxProzent: 5,
    });
  });

  it("fällt bei exit=null auf { geplant: false, haltedauerJahre: 10 } zurück", () => {
    const input = toPropertyInput(buildPropertyRow({ exit: null }));

    expect(input.exit).toEqual({ geplant: false, haltedauerJahre: 10 });
  });

  it("behandelt eine null eigenkapitalquoteManuellProzent als null, nicht als 0", () => {
    const row = buildPropertyRow();
    row.financing!.eigenkapitalquoteManuellProzent = null;

    const input = toPropertyInput(row);

    expect(input.financing.eigenkapitalquoteManuellProzent).toBeNull();
  });

  it("wandelt gewerke inkl. nullable geschaetzteKostenOverride um", () => {
    const input = toPropertyInput(buildPropertyRow());

    expect(input.gewerke).toEqual([
      {
        gewerk: "DACH",
        zustand: 3,
        eigentumsTyp: "SONDEREIGENTUM",
        geschaetzteKostenOverride: 8000,
        baujahr: 2019,
        verglasung: null,
        sofortSanieren: true,
      },
    ]);
  });

  it("lässt geschaetzteKostenOverride=null bei den Gewerken unverändert null", () => {
    const row = buildPropertyRow();
    row.gewerke[0].geschaetzteKostenOverride = null;

    const input = toPropertyInput(row);

    expect(input.gewerke[0].geschaetzteKostenOverride).toBeNull();
  });
});

describe("toProfileInput", () => {
  it("liefert PROFIL_DEFAULT_WERTE mit leeren liabilities, wenn kein Profil existiert", () => {
    const input = toProfileInput(null);

    expect(input).toEqual({
      nettoEinkommenMonatlich: 0,
      bruttoEinkommenMonatlich: 0,
      zuVersteuerndesEinkommenJaehrlich: 0,
      zvEOverride: false,
      fixkostenMonatlich: 0,
      vorhandenesEigenkapital: 0,
      maxSchuldendienstquoteProzent: 35,
      mindestLiquiditaetsreserveEuro: 10000,
      mietanrechnungProzent: 80,
      mindestEigenkapitalrenditeProzent: 4,
      eigenkapitalPruefungAbEuro: 5000,
      cashflowStartverlustMaxProzentKaltmiete: 30,
      cashflowUmschlagjahr: 10,
      liabilities: [],
    });
  });

  it("wandelt ein bestehendes Profil inkl. liabilities korrekt in numbers um", () => {
    const row = {
      id: "profile_1",
      nettoEinkommenMonatlich: dec(3200),
      bruttoEinkommenMonatlich: dec(4500),
      zuVersteuerndesEinkommenJaehrlich: dec(48000),
      zvEOverride: true,
      fixkostenMonatlich: dec(1200),
      vorhandenesEigenkapital: dec(75000),
      maxSchuldendienstquoteProzent: dec(35),
      mindestLiquiditaetsreserveEuro: dec(15000),
      mietanrechnungProzent: dec(80),
      mindestEigenkapitalrenditeProzent: dec(4.5),
      eigenkapitalPruefungAbEuro: dec(5000),
      cashflowStartverlustMaxProzentKaltmiete: dec(30),
      cashflowUmschlagjahr: 8,
      gehaltssteigerungProzentJaehrlich: dec(2),
      inflationProzentJaehrlich: dec(2),
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      liabilities: [
        { id: "l1", profileId: "profile_1", bezeichnung: "Autokredit", monatlicheRate: dec(250), restschuld: dec(8000), createdAt: new Date(), updatedAt: new Date() },
      ],
    } as unknown as Parameters<typeof toProfileInput>[0];

    const input = toProfileInput(row);

    expect(input.nettoEinkommenMonatlich).toBe(3200);
    expect(input.cashflowUmschlagjahr).toBe(8);
    expect(input.liabilities).toEqual([{ bezeichnung: "Autokredit", monatlicheRate: 250, restschuld: 8000 }]);
  });
});

describe("toPropertyFormValues", () => {
  it("kombiniert toPropertyInput mit den Formular-spezifischen Feldern", () => {
    const values = toPropertyFormValues(buildPropertyRow());

    expect(values.name).toBe("Musterstraße 12, München");
    expect(values.besitzstatus).toBe("BESITZE_ICH");
    expect(values.kaufpreis).toBe(450000); // aus toPropertyInput übernommen
    expect(values.kaufdatum).toBe("2024-05-01"); // Date -> "YYYY-MM-DD"
    expect(values.notizen).toBe("Instandhaltungsrücklage geschätzt");
    expect(values.quelleUrl).toBe("https://example.com/expose/1");
  });

  it("ergänzt kommentar als leeren String, wenn null (anders als toPropertyInput.gewerke)", () => {
    const row = buildPropertyRow();
    row.gewerke[0].kommentar = null;

    const values = toPropertyFormValues(row);

    expect(values.gewerke[0].kommentar).toBe("");
  });
});

describe("toSparpositionFormValues", () => {
  it("wandelt Wertpapierpositionen um, inkl. renditeProzentJaehrlich", () => {
    const wertpapier = {
      asset: { id: "asset_wp", name: "MSCI World ETF", besitzstatus: "BESITZE_ICH" },
      betrag: dec(40000),
      renditeProzentJaehrlich: dec(7),
      sparplanBetragMonatlich: dec(200),
      sparplanSteigerungProzentJaehrlich: dec(2),
    } as unknown as WertpapierpositionWithAsset;

    const [values] = toSparpositionFormValues([wertpapier], []);

    expect(values).toEqual({
      assetId: "asset_wp",
      art: "WERTPAPIERDEPOT",
      name: "MSCI World ETF",
      besitzstatus: "BESITZE_ICH",
      betrag: 40000,
      renditeProzentJaehrlich: 7,
      sparplanBetragMonatlich: 200,
      sparplanSteigerungProzentJaehrlich: 2,
    });
  });

  it("wandelt Tagesgeldkonten um und mappt zinsProzentJaehrlich auf renditeProzentJaehrlich", () => {
    const tagesgeld = {
      asset: { id: "asset_tg", name: "Tagesgeld Bank X", besitzstatus: "BESITZE_ICH" },
      betrag: dec(20000),
      zinsProzentJaehrlich: dec(3.2),
      sparplanBetragMonatlich: dec(0),
      sparplanSteigerungProzentJaehrlich: dec(0),
    } as unknown as TagesgeldkontoWithAsset;

    const [values] = toSparpositionFormValues([], [tagesgeld]);

    expect(values).toEqual({
      assetId: "asset_tg",
      art: "TAGESGELD",
      name: "Tagesgeld Bank X",
      besitzstatus: "BESITZE_ICH",
      betrag: 20000,
      renditeProzentJaehrlich: 3.2,
      sparplanBetragMonatlich: 0,
      sparplanSteigerungProzentJaehrlich: 0,
    });
  });
});
