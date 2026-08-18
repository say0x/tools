import Link from "next/link";
import { Card, CardTitle } from "@/components/ui/Card";

const tools = [
  {
    href: "/immobilien/objekte",
    title: "Immobilien-Rechner",
    description: "Objekte erfassen, Kennzahlen berechnen, vergleichen — rechnet sich der Kauf?",
    active: true,
  },
  {
    href: "/finanzuebersicht",
    title: "Finanzübersicht",
    description: "Wertpapiere, Tagesgeld & Immobilien-Cashflow zusammen betrachten — wie viel Geld hast du in wie vielen Jahren wirklich zur Verfügung?",
    active: true,
  },
  {
    href: "/szenarien",
    title: "Szenarien",
    description: "„Was wäre, wenn…“ — Käufe, Verkäufe, Sparraten & Anschaffungen durchspielen, ohne deine echten Daten zu verändern.",
    active: true,
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Tool-Suite</h1>
        <p className="mt-1 text-slate-400">Interne Finanz- und Investment-Werkzeuge.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Link key={tool.title} href={tool.active ? tool.href : "#"} className={!tool.active ? "pointer-events-none" : ""}>
            <Card className={!tool.active ? "opacity-50" : "transition-colors hover:border-slate-700"}>
              <div className="flex items-center justify-between">
                <CardTitle className="mb-1">{tool.title}</CardTitle>
                {!tool.active && (
                  <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-500">
                    bald verfügbar
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">{tool.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
