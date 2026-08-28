import { test, expect } from "@playwright/test";

test.describe("Hauptnavigation", () => {
  test("'Weitere Tools'-Dropdown: öffnet per Klick, schließt per Escape und Außen-Klick", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    const trigger = page.getByRole("button", { name: "Weitere Tools" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(menu).toBeHidden();

    await trigger.click();
    await expect(menu).toBeVisible();
    await page.mouse.click(10, 10);
    await expect(menu).toBeHidden();
  });

  test("Mobile Menü: Toggle-Button spiegelt Zustand in aria-expanded/aria-label", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");

    const toggle = page.getByRole("button", { name: "Menü öffnen" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");

    await toggle.click();
    await expect(page.getByRole("button", { name: "Menü schließen" })).toHaveAttribute("aria-expanded", "true");
    const mobileNav = page.getByRole("navigation", { name: "Hauptnavigation (mobil)" });
    await expect(mobileNav.getByRole("link", { name: "Profil", exact: true })).toBeVisible();
  });

  test("Aktive Route ist per aria-current und aktivem Nav-Link erkennbar", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/szenarien");
    await expect(page.getByRole("link", { name: "Szenarien", exact: true })).toHaveAttribute("aria-current", "page");
  });
});
