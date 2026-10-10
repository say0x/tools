// Alle Seiten, die Smoke- und a11y-Tests besuchen — abgeleitet aus der
// Tool-Registry (Startseite, Einstiegsseiten, Bereichs-Tabs, Schnellzugriffe),
// damit ein neues Tool automatisch mitgetestet wird. Relativer Import ohne
// @/-Alias: Playwright läuft nicht durch den Next.js-Compiler; die Registry
// ist dafür importfrei.
import { STARTSEITE, TOOLS } from "../src/lib/tool-registry";

export const ROUTES = [
  { path: STARTSEITE.href, label: "Dashboard" },
  ...TOOLS.flatMap((tool) => [
    { path: tool.href, label: tool.titel },
    ...[...(tool.bereiche ?? []), ...(tool.schnellzugriffe ?? [])]
      .filter((b) => b.href !== tool.href)
      .map((b) => ({ path: b.href, label: `${tool.titel} — ${b.label}` })),
  ]),
];
