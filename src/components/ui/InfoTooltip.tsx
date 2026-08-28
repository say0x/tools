"use client";

import { useId, useState } from "react";

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        aria-label="Hinweis anzeigen"
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[10px] font-normal leading-none text-slate-400 hover:border-blue-500 hover:text-blue-400"
      >
        i
      </button>
      {open && (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 z-20 mb-1.5 w-64 -translate-x-1/2 rounded-md border border-slate-700 bg-slate-900 p-2.5 text-xs font-normal normal-case leading-snug text-slate-300 shadow-xl"
        >
          {text}
        </span>
      )}
    </span>
  );
}
