import { test, expect } from "@playwright/test";

// Nicht-mutierender Check der freistehenden Sport-Rechner (kein DB-Schreibzugriff),
// Referenzwerte siehe src/server/calc/fitness/sportrechner.test.ts.
test("Sport-Rechner: Riegel-Prognose, Herzfrequenzzonen und 1RM", async ({ page }) => {
  await page.goto("/fitness/rechner");

  await page.locator('label:has-text("Distanz (km)") input').fill("10");
  await page.locator('label:has-text("Zeit") input').fill("50:00");
  await expect(page.getByText("5:00 min/km").first()).toBeVisible();
  await expect(page.getByRole("cell", { name: "1:50:19" })).toBeVisible();

  await page.locator('label:has-text("Alter") input').fill("40");
  await page.locator('label:has-text("Ruhepuls") input').fill("60");
  await expect(page.getByRole("cell", { name: "132–144 bpm" })).toBeVisible();

  await page.locator('label:has-text("Gewicht (kg)") input').fill("100");
  await page.locator('label:has-text("Wiederholungen") input').fill("5");
  await expect(page.getByText("116,7 kg")).toBeVisible();
  await expect(page.getByText("112,5 kg")).toBeVisible();
});
