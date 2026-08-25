import { InfoTooltip } from "@/components/ui/InfoTooltip";

export function Stat({
  label,
  value,
  subValue,
  hilfe,
}: {
  label: string;
  value: string;
  subValue?: string;
  hilfe?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-xs text-slate-500">
        {label}
        {hilfe && <InfoTooltip text={hilfe} />}
      </div>
      <div className="font-medium text-slate-100">{value}</div>
      {subValue && <div className="text-xs text-slate-500">{subValue}</div>}
    </div>
  );
}
