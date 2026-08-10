import { cn } from "@/lib/cn";

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
