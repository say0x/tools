import { describe, expect, it } from "vitest";
import { schaetzeZvEAusBrutto } from "./zve-schaetzung";

describe("schaetzeZvEAusBrutto", () => {
  it("zieht Pauschbeträge und geschätzte Vorsorgeaufwendungen vom Brutto ab", () => {
    // 60.000 - 1.230 (Werbungskosten) - 36 (Sonderausgaben) - 12.000 (20% Vorsorge) = 46.734
    expect(schaetzeZvEAusBrutto(60000)).toBeCloseTo(46734, 2);
  });

  it("wird nie negativ, auch bei sehr niedrigem Brutto", () => {
    expect(schaetzeZvEAusBrutto(0)).toBe(0);
    expect(schaetzeZvEAusBrutto(500)).toBe(0);
  });

  it("steigt streng monoton mit dem Brutto-Einkommen", () => {
    expect(schaetzeZvEAusBrutto(80000)).toBeGreaterThan(schaetzeZvEAusBrutto(60000));
  });
});
