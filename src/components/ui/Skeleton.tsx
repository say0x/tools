import { cn } from "@/lib/cn";

/** Platzhalter-Block für Ladezustände (`loading.tsx`) — Form/Größe wird per className vorgegeben. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-slate-800/60", className)} />;
}
