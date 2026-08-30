import { test, expect } from "@playwright/test";

// Verifiziert die Datenisolation des lokalen Mehrbenutzer-Datenmodells (kein
// echtes Auth, siehe ADR-0009): zwei Test-User über /nutzer anlegen, ein
// Objekt unter User A anlegen, sicherstellen dass es für User B weder in der
// Liste noch per direkter Detail-URL sichtbar ist, dann zurück zu User A
// wechseln und die Sichtbarkeit erneut prüfen. Assertions über eindeutige
// Namen (Zeitstempel-Suffix) statt Listen-Länge, damit der Test robust
// bleibt, falls die DB bereits andere Test-User/Objekte enthält.
test.describe("Mehrbenutzer-Datenisolation", () => {
  test("Objekt eines Users ist für einen anderen User unsichtbar", async ({ page }) => {
    const suffix = Date.now();
    const userA = `E2E User A ${suffix}`;
    const userB = `E2E User B ${suffix}`;
    const objektName = `E2E Objekt ${suffix}`;

    await page.setViewportSize({ width: 1280, height: 800 });

    // 1. User A anlegen (wird laut NutzerForm direkt aktiviert).
    await page.goto("/nutzer");
    await page.getByLabel("Name").fill(userA);
    await page.getByRole("button", { name: "Anlegen & aktivieren" }).click();
    await expect(page.getByText(userA).first()).toBeVisible();

    // 2. Objekt unter User A anlegen.
    await page.goto("/immobilien/objekte/neu");
    await page.getByPlaceholder("z. B. Musterstraße 12, Köln").fill(objektName);
    await page.getByRole("button", { name: "Objekt anlegen" }).click();
    await page.waitForURL((url) => url.pathname.startsWith("/immobilien/objekte/") && !url.pathname.endsWith("/neu"));
    const objektUrl = page.url();

    await page.goto("/immobilien/objekte");
    await expect(page.getByText(objektName)).toBeVisible();

    // 3. User B anlegen (wird ebenfalls direkt aktiviert) — User A ist ab hier inaktiv.
    await page.goto("/nutzer");
    await page.getByLabel("Name").fill(userB);
    await page.getByRole("button", { name: "Anlegen & aktivieren" }).click();
    await expect(page.getByText(userB).first()).toBeVisible();

    // 4. Als User B ist das Objekt weder in der Liste noch per direkter Detail-URL sichtbar.
    await page.goto("/immobilien/objekte");
    await expect(page.getByText(objektName)).not.toBeVisible();

    // Next.js sendet bei notFound() innerhalb einer Server Component (nach
    // Beginn des Streamings) weiterhin HTTP 200 — der Status lässt sich nicht
    // mehr ändern, sobald die Antwort begonnen hat. Deshalb hier gegen den
    // gerenderten Not-Found-Inhalt prüfen statt gegen den HTTP-Status.
    await page.goto(objektUrl);
    await expect(page.getByText("This page could not be found")).toBeVisible();

    // 5. Zurück zu User A: Objekt wieder sichtbar.
    await page.goto("/nutzer");
    await page
      .locator("li", { hasText: userA })
      .getByRole("button", { name: "Aktivieren" })
      .click();

    await page.goto("/immobilien/objekte");
    await expect(page.getByText(objektName)).toBeVisible();
  });
});
