"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { wechsleNutzerFormAction } from "@/server/actions/user";

interface UserSwitcherMenuProps {
  users: { id: string; name: string }[];
  activeUserId: string;
}

export function UserSwitcherMenu({ users, activeUserId }: UserSwitcherMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const aktiverName = users.find((u) => u.id === activeUserId)?.name ?? "Nutzer";

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Test-User wechseln — kein echtes Login, siehe /nutzer"
        className="flex items-center gap-1.5 rounded-md border border-slate-800 px-3 py-1.5 text-sm text-slate-300 transition-colors hover:bg-slate-800"
      >
        <span className="max-w-[8rem] truncate">{aktiverName}</span>
        <svg viewBox="0 0 24 24" className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-56 rounded-md border border-slate-800 bg-slate-900 p-1 shadow-lg shadow-black/30"
        >
          <p className="px-3 py-1.5 text-xs text-slate-500">Test-User (kein echtes Login)</p>
          {users.map((u) => (
            <form key={u.id} action={wechsleNutzerFormAction.bind(null, u.id)} role="none">
              <button
                type="submit"
                role="menuitem"
                onClick={() => setOpen(false)}
                disabled={u.id === activeUserId}
                className={cn(
                  "block w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                  u.id === activeUserId
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                )}
              >
                {u.name}
                {u.id === activeUserId && " (aktiv)"}
              </button>
            </form>
          ))}
          <Link
            href="/nutzer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 block rounded-md border-t border-slate-800 px-3 py-2 pt-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
          >
            Nutzer verwalten
          </Link>
        </div>
      )}
    </div>
  );
}
