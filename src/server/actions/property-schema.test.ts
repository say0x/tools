import { describe, expect, it } from "vitest";
import { propertySchema } from "./property-schema";
import { defaultPropertyFormValues } from "@/lib/property-form-defaults";

function validValues() {
  const values = defaultPropertyFormValues();
  values.name = "Testobjekt";
  return values;
}

describe("propertySchema — Sondertilgung", () => {
  it("akzeptiert eine Sondertilgung innerhalb der vertraglichen Max-Grenze", () => {
    const values = validValues();
    values.financing.sondertilgungProzent = 5;
    values.financing.sondertilgungMaxProzent = 5;
    expect(propertySchema.safeParse(values).success).toBe(true);
  });

  it("akzeptiert den Standardfall: keine Sondertilgung geplant (0%)", () => {
    const values = validValues();
    expect(values.financing.sondertilgungProzent).toBe(0);
    expect(propertySchema.safeParse(values).success).toBe(true);
  });

  it("lehnt eine Sondertilgung über der vertraglichen Max-Grenze ab", () => {
    const values = validValues();
    values.financing.sondertilgungProzent = 10;
    values.financing.sondertilgungMaxProzent = 5;
    const result = propertySchema.safeParse(values);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find((i) => i.path.join(".") === "financing.sondertilgungProzent");
      expect(issue).toBeDefined();
      expect(issue?.message).toMatch(/darf die vertraglich maximale Sondertilgung nicht überschreiten/);
    }
  });

  it("lehnt eine negative Sondertilgung oder Max-Grenze ab", () => {
    const negativeProzent = validValues();
    negativeProzent.financing.sondertilgungProzent = -1;
    expect(propertySchema.safeParse(negativeProzent).success).toBe(false);

    const negativeMax = validValues();
    negativeMax.financing.sondertilgungMaxProzent = -1;
    expect(propertySchema.safeParse(negativeMax).success).toBe(false);
  });
});
