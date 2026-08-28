import { cn } from "@/lib/cn";
import { BESITZSTATUS_LABELS, type Besitzstatus } from "@/lib/asset";

const ampelClasses: Record<"GRUEN" | "GELB" | "ROT", string> = {
  GRUEN: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  GELB: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  ROT: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function AmpelBadge({ status, label }: { status: "GRUEN" | "GELB" | "ROT"; label?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", ampelClasses[status])}>
      {label ?? status}
    </span>
  );
}

// Eigene Farbfamilie pro Status statt Ampel-Grün/Gelb/Rot: Besitzstatus ist eine
// kategoriale Einordnung ("was ist das für ein Objekt"), keine Bewertung wie die
// Ampel ("rechnet sich das?"). BESITZE_ICH nutzte zuvor dieselbe Emerald-Farbe wie
// AmpelBadge GRUEN — beide Badges stehen in derselben Zeile (ObjekteListClient) und
// waren dadurch nicht auf einen Blick zu unterscheiden.
const besitzstatusClasses: Record<Besitzstatus, string> = {
  BESITZE_ICH: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  // text-blue-400 lag mit 4.38:1 knapp unter dem WCAG-AA-Schwellwert 4.5:1 (axe-core,
  // e2e/accessibility.spec.ts) — blue-300 statt der 400er-Stufe wie bei den übrigen Badges,
  // weil Blau bei gleicher Tailwind-Stufe wahrnehmbar dunkler wirkt als Violet/Emerald/Amber/Rot.
  POTENZIELLE_ANSCHAFFUNG: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  SPEKULATION: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  VERKAUFT: "bg-slate-500/15 text-slate-400 border-slate-600/30",
  ARCHIVIERT: "bg-slate-500/15 text-slate-400 border-slate-600/30",
};

export function BesitzstatusBadge({ status }: { status: Besitzstatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", besitzstatusClasses[status])}>
      {BESITZSTATUS_LABELS[status]}
    </span>
  );
}
