import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type SwitchProps = InputHTMLAttributes<HTMLInputElement> & {
  /**
   * Für Stellen, an denen der Aufrufer den Switch bereits in ein eigenes <label> mit sichtbarem
   * Text einbettet: verzichtet auf das eigene <label>, um kein ungültiges verschachtelte-<label>-HTML
   * zu erzeugen. Das äußere <label> übernimmt dann Klickfläche und Accessible Name. Ohne umschließendes
   * <label> am Aufrufer bitte stattdessen aria-label direkt an Switch übergeben.
   */
  bare?: boolean;
};

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { className, bare = false, ...props },
  ref
) {
  const track = (
    <span className={cn("relative inline-block h-6 w-11 shrink-0", bare && className)}>
      <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
      <span className="absolute inset-0 rounded-full bg-slate-700 transition-colors peer-checked:bg-blue-600" />
      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
    </span>
  );

  if (bare) return track;

  return <label className={cn("inline-flex cursor-pointer items-center gap-2", className)}>{track}</label>;
});
