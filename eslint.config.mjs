import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generierte Reports, nicht Teil des Quellcodes.
    "coverage/**",
    "playwright-report/**",
  ]),
  // Erzwingt mechanisch, was docs/immobilien-rechner.md als Prinzip dokumentiert:
  // src/server/calc/ ist framework-frei (kein React, kein Next.js, kein Prisma) und
  // läuft dadurch identisch server- wie clientseitig (z. B. Sparziel-Rechner direkt
  // im Browser). Bisher nur Konvention — ohne diese Regel bricht ein zukünftiger
  // Import das Prinzip lautlos.
  {
    files: ["src/server/calc/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react/*", "react-dom", "react-dom/*"],
              message: "src/server/calc/ ist framework-frei — keine React-Importe (siehe docs/immobilien-rechner.md).",
            },
            {
              group: ["next", "next/*"],
              message: "src/server/calc/ ist framework-frei — keine Next.js-Importe (siehe docs/immobilien-rechner.md).",
            },
            {
              group: ["@prisma/*", "@/generated/prisma/**", "@/server/db"],
              message: "src/server/calc/ speichert/liest keine Daten selbst — keine Prisma-Importe (siehe docs/immobilien-rechner.md).",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
