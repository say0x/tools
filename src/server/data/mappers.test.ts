import { describe, expect, it } from "vitest";
import { splitPropertyData } from "./mappers";
import { defaultPropertyFormValues } from "@/lib/property-form-defaults";
import type { PropertyFormValues } from "@/server/actions/property";

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
