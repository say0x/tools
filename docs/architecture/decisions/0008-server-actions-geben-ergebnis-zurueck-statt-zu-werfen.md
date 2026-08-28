# ADR-0008 — Server Actions geben ein ActionResult zurück statt Fehler zu werfen

**Status**: Accepted

## Context

Formulare und Admin-Widgets (`PropertyForm.tsx`, `ProfileForm.tsx`, `FinanzuebersichtClient.tsx`, `SzenarioClient.tsx`, die sechs Referenzdaten-Widgets, `ExportButton.tsx`) riefen ihre Server Action clientseitig über `try { await action(values) } catch (err) { setServerFehler(err.message) }` auf — die Server Actions selbst warfen bei Validierungsfehlern (`throw new Error("Ungültige Eingabe: …")`) oder unerwarteten Fehlern eine reguläre `Error`.

Das funktionierte in jedem lokalen `npm run dev`-Test während der gesamten bisherigen Entwicklung. Beim Accessibility/Performance-Audit (2026-08-28) wurde bei einem gezielten Test gegen einen echten Produktions-Build (`npm run build && npm run start`, nicht `next dev`) empirisch entdeckt: Next.js redigiert in Produktion jede aus einer Server Action geworfene Fehlermeldung, bevor sie den Client erreicht — statt `"Ungültige Eingabe: zvE muss positiv sein"` kam beim Nutzer nur `"Minified React error #441; visit https://react.dev/errors/441 …"` an. Serverseitig wurde die echte Meldung weiterhin korrekt nach stdout geloggt (Next.js' eigenes Default-Verhalten) — nur der Weg zum Client war betroffen.

Dieses Verhalten ist von Next.js beabsichtigt (schützt vor versehentlichem Leaken interner Fehlerdetails aus RSC-Rendering) und nicht per Konfigurationsflag abschaltbar. Die offiziell dokumentierte Lösung für Server Actions: Fehlertexte, die beim Nutzer ankommen sollen, als regulären Rückgabewert übergeben statt zu werfen — ein normaler Rückgabewert durchläuft die Redaktions-Logik nicht, weil er kein Error-Objekt an der RSC-Grenze ist.

## Decision

Alle Server Actions, deren Rückmeldung ein Formular/Widget dem Nutzer anzeigt, geben `ActionResult<T>` zurück (`src/server/actions/result.ts`, `{ success: true; data: T } | { success: false; error: string }`) statt zu werfen. Der gemeinsame Helper `ausfuehren(fn)` kapselt das try/catch, loggt jeden abgefangenen Fehler serverseitig mit Kontext-Präfix (`[server-action]`) und lässt `redirect()`/`notFound()`/etc. über `unstable_rethrow()` unverändert durch (sonst würde `erstelleObjekt`s Redirect nach dem Anlegen fälschlich als Fehler abgefangen).

Betroffen: alle Funktionen in `property.ts` (`erstelleObjekt`, `aktualisiereObjekt`), `profile.ts`, `finanzuebersicht.ts`, `szenario.ts` (`erstelleSzenario`, `aktualisiereSzenario`), `asset.ts`, `reference-data.ts` (alle sieben) und `export.ts`, sowie deren jeweilige Client-Aufrufer.

**Nicht** betroffen: Server Actions ohne clientseitiges try/catch der Fehlermeldung (`loescheObjekt`, `loescheObjekte`, `dupliziereObjekt`, `loescheSzenario`) — dort ist ein unerwarteter Fehler tatsächlich unerwartet, das Hochreichen zur nächsten `error.tsx`-Boundary (die ohnehin nur eine generische Meldung + Fehler-ID zeigt, nie `err.message`) ist das korrekte Verhalten und von der Redaktion nicht betroffen. Ebenso unbetroffen: reine `lade*`-Loader, die direkt aus Server Components gelesen werden, nicht clientseitig aufgerufen.

## Reason

Der Rückgabewert-Ansatz ist die von Next.js selbst dokumentierte Lösung für genau dieses Problem, nicht eine Umgehung. Er behebt gleichzeitig einen zweiten, verwandten Fehler: der bisherige Client-Fallback `err instanceof Error ? err.message : "Speichern fehlgeschlagen."` griff nie für unerwartete Fehler, weil auch eine redigierte Next.js-Fehlermeldung weiterhin `instanceof Error` ist — der freundliche Fallback-Text kam nie zustande, der Nutzer sah immer den kryptischen Minified-Text. Mit `ausfuehren()` ist die Unterscheidung "erwarteter Validierungsfehler mit lesbarer Meldung" vs. "unerwarteter Fehler" wieder das, was der ursprüngliche Code sichtbar beabsichtigt hatte.

## Consequences

- Jede neue Server Action, deren Fehlertext ein Formular anzeigen soll, muss `ausfuehren()` verwenden — ein `throw new Error(...)`, das clientseitig per `err.message` gelesen wird, ist in Produktion praktisch immer ein stiller Bug (er funktioniert nur im Dev-Server).
- Warum das bisher unentdeckt blieb: die gesamte Playwright/manuelle QS dieses Projekts lief bislang ausschließlich gegen `npm run dev` (siehe `docs/qa/overview.md`), nie gegen einen `npm run build && npm run start`-Produktions-Build mit einem tatsächlich ausgelösten Fehlerpfad — ein Hinweis, dass QS-Läufe mit echten Fehlerszenarien künftig auch gegen einen Produktions-Build gehören, nicht nur `dev`.
- `ausfuehren()` erfordert Next.js' `unstable_rethrow` (aktuell mit `unstable_`-Präfix, kein Stable-API-Versprechen) — bei einem Next.js-Major-Upgrade prüfen, ob sich Name/Verhalten geändert hat.
