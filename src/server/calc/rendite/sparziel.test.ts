import { describe, expect, it } from "vitest";
import { findeJahrBisZielbetrag } from "./sparziel";

describe("findeJahrBisZielbetrag", () => {
  it("gibt 0 zurück, wenn der Startwert das Ziel schon erfüllt", () => {
    expect(findeJahrBisZielbetrag([10000, 12000, 14000], 10000)).toBe(0);
    expect(findeJahrBisZielbetrag([10000, 12000, 14000], 5000)).toBe(0);
  });

  it("findet das erste Jahr, in dem der Zielbetrag erreicht oder überschritten wird", () => {
    expect(findeJahrBisZielbetrag([10000, 12000, 14000, 16000], 13000)).toBe(2);
    expect(findeJahrBisZielbetrag([10000, 12000, 14000, 16000], 16000)).toBe(3);
  });

  it("gibt null zurück, wenn das Ziel innerhalb der Reihe nicht erreicht wird", () => {
    expect(findeJahrBisZielbetrag([10000, 10500, 11000], 50000)).toBeNull();
  });
});
