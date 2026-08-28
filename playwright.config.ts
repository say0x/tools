import { defineConfig, devices } from "@playwright/test";

// Lokale, opt-in E2E-Suite gegen eine echte, laufende Instanz — kein Teil der
// GitHub-Actions-CI (die läuft ohne Postgres/laufenden Server, siehe
// .github/workflows/ci.yml). Setup & Ausführen: docs/qa/overview.md.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "retain-on-failure",
    // Optional: für Umgebungen mit vorinstalliertem, nicht-standardmäßig
    // abgelegtem Chromium (z. B. Sandboxes ohne Internetzugriff für
    // `playwright install`) statt des von Playwright verwalteten Browsers.
    ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
      : {}),
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
