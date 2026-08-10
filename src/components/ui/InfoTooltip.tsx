"use client";

import { useState } from "react";

export function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        onBlur={() => setOpen(false)}
        aria-label="Hinweis anzeigen"
        className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-600 text-[10px] font-normal leading-none text-slate-500 hover:border-blue-500 hover:text-blue-400"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 z-20 mb-1.5 w-64 -translate-x-1/2 rounded-md border border-slate-700 bg-slate-900 p-2.5 text-xs font-normal normal-case leading-snug text-slate-300 shadow-xl"
        >
          {text}
        </span>
      )}
    </span>
  );
}
