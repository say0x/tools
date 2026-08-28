import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("flex flex-col gap-1", className)}>
      <span className="flex items-center gap-1 text-sm font-medium text-slate-300">{label}</span>
      <div
        className={
          error
            ? "[&_input]:border-red-500 [&_input]:focus:border-red-500 [&_input]:focus:ring-red-500 [&_select]:border-red-500 [&_select]:focus:border-red-500 [&_select]:focus:ring-red-500 [&_textarea]:border-red-500 [&_textarea]:focus:border-red-500 [&_textarea]:focus:ring-red-500"
            : undefined
        }
      >
        {children}
      </div>
      {hint && !error && <span className="text-xs text-slate-400">{hint}</span>}
      {error && (
        <span role="alert" className="text-xs text-red-400">
          {error}
        </span>
      )}
    </label>
  );
}
