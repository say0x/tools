export function formatEuro(n: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    n
  );
}

/** Deutsche Zahlformatierung (Tausenderpunkt, Komma-Dezimaltrennzeichen) für nicht-monetäre Zahlen wie Kaufpreisfaktor. */
export function formatNumber(n: number, decimals = 2): string {
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}

/** Prozentwert oder "n/v" bei null — z. B. EK-Rendite ohne EK-Einsatz, rechnerisch nicht definiert statt irreführend 0%. */
export function formatProzentOderNv(n: number | null): string {
  return n === null ? "n/v" : `${n}%`;
}
