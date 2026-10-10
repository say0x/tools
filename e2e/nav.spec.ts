import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page } from "@playwright/test";

const axeVerstoesse = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  return violations.map((v) => `${v.id}: ${v.help} — ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
};

test.describe("Kopfzeile", () => {
  for (const breite of [375, 640, 768, 1024, 1280]) {
    test(`kein seitlicher Überlauf und einzeilig bei ${breite}px`, async ({ page }) => {
      await page.setViewportSize({ width: breite, height: 800 });
      await page.goto("/szenarien");
      const masse = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        breite: document.documentElement.clientWidth,
        hoehe: document.querySelector("header")!.getBoundingClientRect().height,
      }));
      expect(masse.scroll).toBeLessThanOrEqual(masse.breite);
      expect(masse.hoehe).toBeLessThan(70);
    });
  }

  test("Aktive Route ist per aria-current erkennbar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/szenarien");
    const kopfzeile = page.getByRole("navigation", { name: "Hauptnavigation" });
    await expect(kopfzeile.getByRole("link", { name: "Szenarien", exact: true })).toHaveAttribute("aria-current", "page");
  });
});

test.describe("„Alle Tools“-Panel", () => {
  test("öffnet per Klick, schließt per Escape (Fokus zurück), Außen-Klick und Link-Klick", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const knopf = page.getByRole("button", { name: "Alle Tools" });
    const panel = page.getByRole("navigation", { name: "Alle Tools" });

    await expect(knopf).toHaveAttribute("aria-expanded", "false");
    await knopf.click();
    await expect(knopf).toHaveAttribute("aria-expanded", "true");
    await expect(panel.getByText("Gesundheit & Fitness")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(knopf).toBeFocused();

    await knopf.click();
    await page.mouse.click(640, 700);
    await expect(panel).toBeHidden();

    await knopf.click();
    await panel.getByRole("link", { name: /Steuerrechner/ }).click();
    await expect(page).toHaveURL(/\/steuerrechner$/);
    await expect(panel).toBeHidden();
  });

  test("liegt über dem Seiteninhalt (kein Element verdeckt einen Eintrag)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // /integrationen hat direkt unter der Kopfzeile einen deaktivierten Button (opacity → eigene Ebene).
    await page.goto("/integrationen");
    await page.getByRole("button", { name: "Alle Tools" }).click();
    const links = page.getByRole("navigation", { name: "Alle Tools" }).getByRole("link");
    expect(await links.count()).toBeGreaterThan(5);
    for (let i = 0; i < (await links.count()); i++) {
      const link = links.nth(i);
      const oben = await link.evaluate((el) => {
        const r = el.getBoundingClientRect();
        const treffer = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return treffer === el || el.contains(treffer);
      });
      expect(oben, await link.innerText()).toBe(true);
    }
  });

  test("mobil: Nutzerwechsel und alle Kategorien im Panel, ohne axe-Verstöße", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/fitness");
    await page.getByRole("button", { name: "Alle Tools" }).click();
    const panel = page.getByRole("navigation", { name: "Alle Tools" });
    await expect(panel.getByRole("link", { name: /^Profil/ })).toBeVisible();
    await expect(panel.getByRole("link", { name: /Fitness & Ernährung/ })).toHaveAttribute("aria-current", "page");
    expect(await axeVerstoesse(page)).toEqual([]);
  });
});

test.describe("Befehlspalette", () => {
  test("Strg+K öffnet, Tippen filtert (auch ohne Umlaute), Enter navigiert", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.keyboard.press("Control+k");
    const eingabe = page.getByRole("combobox", { name: /suchen/i });
    await expect(eingabe).toBeFocused();

    await eingabe.fill("ernahrung");
    await expect(page.getByRole("option").first()).toContainText("Ernährung");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/fitness\/ernaehrung$/);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("„/“ öffnet, Pfeiltasten wählen, Escape schließt und gibt den Fokus zurück", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const suchKnopf = page.getByRole("button", { name: "Suchen" });
    await suchKnopf.focus();
    await page.keyboard.press("/");
    const eingabe = page.getByRole("combobox", { name: /suchen/i });
    await expect(eingabe).toBeFocused();

    await eingabe.fill("neues");
    const optionen = page.getByRole("option");
    await expect(optionen.first()).toHaveAttribute("aria-selected", "true");
    await page.keyboard.press("ArrowDown");
    await expect(optionen.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(eingabe).toHaveAttribute("aria-activedescendant", (await optionen.nth(1).getAttribute("id"))!);

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(suchKnopf).toBeFocused();
  });

  test("„/“ in einem Eingabefeld tippt ein Zeichen statt die Suche zu öffnen", async ({ page }) => {
    await page.goto("/integrationen");
    const feld = page.getByLabel("Name des Tokens");
    await feld.fill("a/b");
    await expect(feld).toHaveValue("a/b");
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("leere Suche zeigt zuletzt verwendete Tools zuerst; keine axe-Verstöße", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/kreditvergleich");
    await page.goto("/");
    await page.getByRole("button", { name: "Suchen" }).click();
    const erste = page.getByRole("option").first();
    await expect(erste).toContainText("Kreditvergleich");
    await expect(erste).toContainText("Zuletzt verwendet");
    expect(await axeVerstoesse(page)).toEqual([]);
  });
});
