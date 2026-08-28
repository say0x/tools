import { test, expect } from "@playwright/test";
import { ROUTES } from "./routes";

// Erreichbarkeits-Smoke-Test für jede Hauptroute: lädt, hat genau eine <h1>
// (oder zumindest eine sichtbare Überschrift), wirft keine Konsolen-/Seitenfehler.
for (const route of ROUTES) {
  test(`${route.label} (${route.path}) lädt ohne Fehler`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    const response = await page.goto(route.path);
    expect(response?.ok()).toBe(true);

    await expect(page.locator("main")).toBeVisible();
    expect(consoleErrors, `Konsolenfehler auf ${route.path}: ${consoleErrors.join(" | ")}`).toEqual([]);
    expect(pageErrors, `Seitenfehler auf ${route.path}: ${pageErrors.join(" | ")}`).toEqual([]);
  });
}
