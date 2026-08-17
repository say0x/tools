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

const besitzstatusClasses: Record<Besitzstatus, string> = {
  BESITZE_ICH: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  POTENZIELLE_ANSCHAFFUNG: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  SPEKULATION: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  VERKAUFT: "bg-slate-500/15 text-slate-500 border-slate-600/30",
  ARCHIVIERT: "bg-slate-500/15 text-slate-500 border-slate-600/30",
};

export function BesitzstatusBadge({ status }: { status: Besitzstatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium", besitzstatusClasses[status])}>
      {BESITZSTATUS_LABELS[status]}
    </span>
  );
}
