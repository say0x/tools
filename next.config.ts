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
//
// KEIN upgrade-insecure-requests: die App wird nicht nur über den HTTPS-Reverse-
// Proxy (tools.sayox.de, siehe ADR-0006), sondern teils auch direkt per HTTP im
// lokalen Netz erreicht (z. B. http://<host-ip>:3000). Dieses Directive weist den
// Browser an, JEDE Unterressourcen-Anfrage (CSS/JS/Fonts) unabhängig vom Ladeweg
// der Seite selbst von http auf https hochzustufen — bei direktem HTTP-Zugriff
// ohne TLS auf Port 3000 schlägt das fehl und die Seite lädt komplett ungestyled
// (alle CSS-/JS-Requests brechen ab). Über den HTTPS-Proxy ändert das Fehlen des
// Directives nichts (dort gibt es ohnehin keine http-Unterressourcen).
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
