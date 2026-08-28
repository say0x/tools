import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import { ROUTES } from "./routes";

// Automatisierter a11y-Scan (axe-core) je Hauptroute. Deckt nur, was axe
// statisch/DOM-basiert erkennen kann (Kontrast, fehlende Labels, ARIA-Fehler,
// Landmark-Struktur) — ersetzt keine manuelle Tastatur-/Screenreader-Prüfung.
for (const route of ROUTES) {
  test(`${route.label} (${route.path}) hat keine axe-Violations`, async ({ page }) => {
    await page.goto(route.path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

    expect(
      results.violations,
      results.violations
        .map((v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.length} Fundstelle(n)\n${v.nodes.map((n) => n.target.join(" ")).join("\n")}`)
        .join("\n\n")
    ).toEqual([]);
  });
}
