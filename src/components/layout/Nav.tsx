import Link from "next/link";

const links = [
  { href: "/", label: "Start" },
  { href: "/immobilien/objekte", label: "Immobilien" },
  { href: "/profil", label: "Profil" },
  { href: "/immobilien/referenzdaten", label: "Referenzdaten" },
];

export function Nav() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-100">
          tools<span className="text-blue-500">.</span>
        </Link>
        <nav className="flex gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
