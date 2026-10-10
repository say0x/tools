import { expect, test } from "@playwright/test";

// Token-Lebenszyklus über die echte Oberfläche und die echte API: erstellen →
// benutzen → Rechte prüfen → widerrufen → abgewiesen. Legt keine Fitness-Daten
// an (Schreibversuch läuft mit einem Lese-Token und wird abgewiesen).
test("API-Token: erstellen, nutzen, widerrufen", async ({ page, request }) => {
  const name = `e2e-${Date.now()}`;
  await page.goto("/integrationen");

  await page.getByLabel("Name des Tokens").fill(name);
  const schalter = page.locator("label", { hasText: "Darf schreiben" });
  if (await schalter.locator("input").isChecked()) await schalter.click();
  await page.getByRole("button", { name: "Token erstellen" }).click();

  const hinweis = page.getByRole("status");
  await expect(hinweis).toContainText(name);
  const token = (await hinweis.locator("pre").innerText()).trim();
  expect(token).toMatch(/^tk_[A-Za-z0-9_-]{43}$/);
  await page.getByRole("button", { name: "Ich habe es gespeichert" }).click();
  await expect(page.getByRole("status")).toHaveCount(0);

  const auth = { Authorization: `Bearer ${token}` };
  const ich = await request.get("/api/v1/ich", { headers: auth });
  expect(ich.status()).toBe(200);
  expect((await ich.json()).token).toMatchObject({ name, schreibzugriff: false });

  const schreiben = await request.post("/api/v1/fitness/tageswerte/wasser", { headers: auth, data: { ml: 250 } });
  expect(schreiben.status()).toBe(403);
  expect((await schreiben.json()).fehler.code).toBe("KEIN_SCHREIBZUGRIFF");

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: `Token ${name} widerrufen` }).click();
  await expect(page.getByRole("button", { name: `Token ${name} widerrufen` })).toHaveCount(0);

  const danach = await request.get("/api/v1/ich", { headers: auth });
  expect(danach.status()).toBe(401);
  expect(danach.headers()["www-authenticate"]).toContain("Bearer");
});

test("API: Status und Spezifikation ohne Token, Daten nur mit Token", async ({ request }) => {
  const status = await request.get("/api/v1/status");
  expect(status.status()).toBe(200);
  expect((await status.json()).datenbank).toBe("ok");

  const spec = await request.get("/api/v1/openapi.json");
  expect((await spec.json()).openapi).toBe("3.1.0");

  for (const pfad of ["/api/v1/fitness/tag", "/api/v1/finanzen/uebersicht", "/api/v1/home-assistant/sensoren"]) {
    expect((await request.get(pfad)).status(), pfad).toBe(401);
  }
});
