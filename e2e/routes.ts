// Von Nav.tsx gespiegelte Routen-Liste (primaryLinks + secondaryLinks) — bewusst
// dupliziert statt importiert, damit e2e/ unabhängig vom App-Quellcode bleibt
// (Playwright-Tests laufen nicht durch den Next.js-Compiler).
export const ROUTES = [
  { path: "/", label: "Dashboard" },
  { path: "/immobilien/objekte", label: "Immobilien" },
  { path: "/finanzuebersicht", label: "Finanzübersicht" },
  { path: "/szenarien", label: "Szenarien" },
  { path: "/fitness", label: "Fitness" },
  { path: "/fitness/ernaehrung", label: "Fitness — Ernährung" },
  { path: "/fitness/training", label: "Fitness — Training" },
  { path: "/fitness/gewicht", label: "Fitness — Gewicht" },
  { path: "/fitness/rechner", label: "Fitness — Sport-Rechner" },
  { path: "/fitness/profil", label: "Fitness — Ziele & Körperdaten" },
  { path: "/sparziel", label: "Sparziel-Rechner" },
  { path: "/steuerrechner", label: "Steuerrechner" },
  { path: "/kreditvergleich", label: "Kreditvergleich" },
  { path: "/kaufen-oder-anlegen", label: "Kaufen oder Anlegen" },
  { path: "/profil", label: "Profil" },
  { path: "/nutzer", label: "Nutzer" },
  { path: "/immobilien/referenzdaten", label: "Referenzdaten" },
] as const;
