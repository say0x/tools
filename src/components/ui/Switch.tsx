import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Switch = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Switch(
  { className, ...props },
  ref
) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2", className)}>
      <span className="relative inline-block h-6 w-11 shrink-0">
        <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
        <span className="absolute inset-0 rounded-full bg-slate-700 transition-colors peer-checked:bg-blue-600" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
});
