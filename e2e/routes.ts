// Alle Seiten, die Smoke- und a11y-Tests besuchen — abgeleitet aus der
// Tool-Registry (Einstiegsseiten + Bereichs-Tabs), damit ein neues Tool
// automatisch mitgetestet wird. Relativer Import ohne @/-Alias: Playwright
// läuft nicht durch den Next.js-Compiler; die Registry ist dafür importfrei.
import { TOOLS } from "../src/lib/tool-registry";

export const ROUTES = TOOLS.flatMap((tool) => [
  { path: tool.href, label: tool.titel },
  ...(tool.bereiche ?? []).filter((b) => b.href !== tool.href).map((b) => ({ path: b.href, label: `${tool.titel} — ${b.label}` })),
]);
