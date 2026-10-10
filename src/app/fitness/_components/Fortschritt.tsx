import { cn } from "@/lib/cn";

/**
 * Horizontaler Fortschrittsbalken mit Text-Label (Zustand nie nur über Farbe):
 * bis 100 % Blau, darüber Amber und ein "über Ziel"-Hinweis im Text.
 */
export function Fortschritt({
  label,
  ist,
  ziel,
  einheit,
  formatieren = (n) => String(Math.round(n)),
}: {
  label: string;
  ist: number;
  ziel: number;
  einheit: string;
  formatieren?: (n: number) => string;
}) {
  const prozent = ziel > 0 ? (ist / ziel) * 100 : 0;
  const ueber = prozent > 100;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-400">
          <span className={cn("font-medium", ueber ? "text-amber-400" : "text-slate-100")}>{formatieren(ist)}</span> /{" "}
          {ziel > 0 ? `${formatieren(ziel)} ${einheit}` : "—"}
          {ziel > 0 && <span className="ml-1 text-xs">({Math.round(prozent)} %{ueber ? ", über Ziel" : ""})</span>}
        </span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-800"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(prozent)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full", ueber ? "bg-amber-500" : "bg-blue-500")}
          style={{ width: `${Math.min(100, prozent)}%` }}
        />
      </div>
    </div>
  );
}
