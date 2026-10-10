import { Card } from "@/components/ui/Card";

export function Kennzahl({ label, wert, hinweis, warnung }: { label: string; wert: string; hinweis?: string; warnung?: boolean }) {
  return (
    <Card className={warnung ? "border-amber-900/50 bg-amber-950/10" : undefined}>
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`mt-1 text-xl font-semibold tabular-nums ${warnung ? "text-amber-400" : "text-slate-100"}`}>{wert}</div>
      {hinweis && <div className="mt-1 text-xs text-slate-400">{hinweis}</div>}
    </Card>
  );
}
