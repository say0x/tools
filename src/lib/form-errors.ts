import type { FieldErrors, FieldValues } from "react-hook-form";

/** Sammelt alle react-hook-form-Fehlermeldungen (auch verschachtelte Objekte/Array-Felder) in einer flachen Liste. */
export function flattenFormErrors(errors: FieldErrors<FieldValues>): string[] {
  const meldungen: string[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    if ("message" in node && typeof (node as { message?: unknown }).message === "string") {
      meldungen.push((node as { message: string }).message);
      return;
    }
    for (const value of Object.values(node as Record<string, unknown>)) {
      walk(value);
    }
  };
  walk(errors);
  return meldungen;
}
