import { test, expect } from "@playwright/test";

// Steuerrechner ist rein clientseitig (keine DB-Abhängigkeit) — eignet sich
// deshalb als deterministischer Vertreter für "Eingabe ändert sich → Ergebnis
// rechnet live neu", ohne Seed-Daten zu brauchen.
test("Steuerrechner: Bruttoeinkommen ändern aktualisiert die Steuerkennzahlen live", async ({ page }) => {
  await page.goto("/steuerrechner");

  const einkommensteuerCard = page.getByText("Einkommensteuer (Jahr)").locator("..");
  const vorher = await einkommensteuerCard.textContent();

  const bruttoInput = page.getByRole("spinbutton").first();
  await bruttoInput.fill("120000");
  await bruttoInput.blur();

  await expect(einkommensteuerCard).not.toHaveText(vorher ?? "");
});

test("Steuerrechner: manuelles zvE-Override macht das zvE-Feld editierbar", async ({ page }) => {
  await page.goto("/steuerrechner");

  const zveInput = page.getByRole("spinbutton").nth(1);
  await expect(zveInput).toBeDisabled();

  // Switch ist ein sr-only Checkbox mit eigenem sichtbaren Track-Overlay — die native
  // Checkbox selbst gilt Playwright wegen ihrer Größe/Position als nicht klickbar, deshalb
  // über das unmittelbar umschließende <label> (bedient den Klick per HTML-Label-Assoziation).
  // Nicht das äußere Field-<label> nehmen — das würde stattdessen das zvE-Textfeld aktivieren,
  // weil ein <label> mit mehreren Controls beim Klick das erste enthaltene Control anspricht.
  await page.getByRole("checkbox").locator("xpath=ancestor::label[1]").click();

  await expect(zveInput).toBeEnabled();
});
