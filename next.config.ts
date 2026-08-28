import type { NextConfig } from "next";

// Bewusst statische CSP über next.config.ts statt nonce-basiert über eine Proxy-Datei
// (siehe node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md):
// nonce-basierte CSP erzwingt dynamisches Rendering auf JEDER Route (keine Static-
// Optimierung/ISR mehr möglich) — für ein VPN-only-Einzelnutzer-Tool ohne öffentlichen
// Zugriff (ADR-0006) ein unverhältnismäßiger Performance-Tradeoff gegenüber dem
// zusätzlichen Schutz. 'unsafe-inline' bei script-src ist deshalb nötig (Next.js'
// eigene Bootstrap-/Hydration-Scripts sind ohne Nonce sonst blockiert); 'unsafe-inline'
// bei style-src wegen echter, unvermeidbarer inline style={{}}-Nutzung (dynamische
// Balkenbreite im Dashboard, Fallback-Styling in global-error.tsx, das bewusst ohne
// externes CSS auskommen muss). Alles andere bleibt streng: keine Plugins, kein
// Framing, keine externen Bild-/Font-/Verbindungsziele (die App lädt ohnehin nichts
// von Drittanbietern — next/font hostet Google Fonts zur Build-Zeit selbst).
const isDev = process.env.NODE_ENV === "development";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
