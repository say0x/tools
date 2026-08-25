"use client";

// Greift nur, wenn das Root-Layout selbst wirft (z. B. Font-Ladefehler) — muss deshalb
// <html>/<body> selbst mitbringen und bewusst ohne Abhängigkeit von globals.css oder
// den UI-Komponenten auskommen, falls genau das die Ursache des Fehlers ist.

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="de">
      <body style={{ background: "#020617", color: "#f1f5f9", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 24px" }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Etwas ist schiefgelaufen</h1>
          <p style={{ marginTop: 8, color: "#cbd5e1", fontSize: 14 }}>
            Die App konnte nicht geladen werden. Ein erneuter Versuch hilft oft schon.
          </p>
          {error.digest && (
            <p style={{ marginTop: 8, color: "#64748b", fontSize: 12 }}>Fehler-ID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: "#2563eb",
              color: "white",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Erneut versuchen
          </button>
        </div>
      </body>
    </html>
  );
}
