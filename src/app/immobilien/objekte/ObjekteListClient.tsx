"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { AmpelBadge, BesitzstatusBadge } from "@/components/ui/Badge";
import { formatEuro } from "@/lib/format";
import { AMPEL_LABELS } from "@/lib/labels";
import { BESITZSTAENDE, BESITZSTATUS_LABELS, type Besitzstatus } from "@/lib/asset";
import { loescheObjekte } from "@/server/actions/property";
import { DeleteObjectButton } from "./[id]/DeleteObjectButton";
import { DuplicateObjectButton } from "./DuplicateObjectButton";

export interface ObjektListItem {
  id: string;
  name: string;
  kaufpreis: number;
  besitzstatus: Besitzstatus;
  bruttomietrenditeProzent: number;
  monatlicherCashflowNachSteuer: number;
  ampel: "GRUEN" | "GELB" | "ROT";
}

const AMPEL_OPTIONS = ["GRUEN", "GELB", "ROT"] as const;

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button type="button" variant={active ? "secondary" : "ghost"} size="sm" onClick={onClick} aria-pressed={active}>
      {children}
    </Button>
  );
}

export function ObjekteListClient({ objekte }: { objekte: ObjektListItem[] }) {
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [suche, setSuche] = useState("");
  const [activeBesitzstatus, setActiveBesitzstatus] = useState<Set<Besitzstatus>>(new Set());
  const [activeAmpel, setActiveAmpel] = useState<Set<(typeof AMPEL_OPTIONS)[number]>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const gefiltert = useMemo(() => {
    const suchbegriff = suche.trim().toLowerCase();
    return objekte.filter(
      (o) =>
        (suchbegriff === "" || o.name.toLowerCase().includes(suchbegriff)) &&
        (activeBesitzstatus.size === 0 || activeBesitzstatus.has(o.besitzstatus)) &&
        (activeAmpel.size === 0 || activeAmpel.has(o.ampel))
    );
  }, [objekte, suche, activeBesitzstatus, activeAmpel]);

  const alleSichtbarenAusgewaehlt = gefiltert.length > 0 && gefiltert.every((o) => selectedIds.has(o.id));

  const toggleSetValue = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };

  const toggleOne = (id: string) => setSelectedIds((prev) => toggleSetValue(prev, id));

  const toggleAlleSichtbaren = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (alleSichtbarenAusgewaehlt) {
        gefiltert.forEach((o) => next.delete(o.id));
      } else {
        gefiltert.forEach((o) => next.add(o.id));
      }
      return next;
    });
  };

  const handleBulkDelete = () => {
    const ids = Array.from(selectedIds);
    const bestaetigung =
      ids.length === 1 ? "Ausgewähltes Objekt wirklich löschen?" : `${ids.length} ausgewählte Objekte wirklich löschen?`;
    if (!confirm(bestaetigung)) return;
    startDeleteTransition(async () => {
      await loescheObjekte(ids);
      setSelectedIds(new Set());
      router.refresh();
    });
  };

  return (
    <form action="/immobilien/objekte/vergleich" method="get" className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <Input
          type="search"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Objekt nach Name suchen…"
          aria-label="Objekte durchsuchen"
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Status:</span>
          <FilterButton active={activeBesitzstatus.size === 0} onClick={() => setActiveBesitzstatus(new Set())}>
            Alle
          </FilterButton>
          {BESITZSTAENDE.map((status) => (
            <FilterButton
              key={status}
              active={activeBesitzstatus.has(status)}
              onClick={() => setActiveBesitzstatus((prev) => toggleSetValue(prev, status))}
            >
              {BESITZSTATUS_LABELS[status]}
            </FilterButton>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Ampel:</span>
          <FilterButton active={activeAmpel.size === 0} onClick={() => setActiveAmpel(new Set())}>
            Alle
          </FilterButton>
          {AMPEL_OPTIONS.map((status) => (
            <FilterButton
              key={status}
              active={activeAmpel.has(status)}
              onClick={() => setActiveAmpel((prev) => toggleSetValue(prev, status))}
            >
              {AMPEL_LABELS[status]}
            </FilterButton>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={alleSichtbarenAusgewaehlt}
            onChange={toggleAlleSichtbaren}
            disabled={gefiltert.length === 0}
            className="h-4 w-4 accent-blue-600"
          />
          Alle sichtbaren auswählen
        </label>
        <p className="text-xs text-slate-500" aria-live="polite">
          {gefiltert.length} von {objekte.length} Objekten angezeigt · {selectedIds.size} ausgewählt
        </p>
      </div>

      {gefiltert.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-400">Keine Objekte für diese Filterauswahl.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {gefiltert.map((o) => (
            <Card key={o.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="ids"
                  value={o.id}
                  checked={selectedIds.has(o.id)}
                  onChange={() => toggleOne(o.id)}
                  aria-label={`${o.name} zum Vergleich auswählen`}
                  className="mt-1.5 h-4 w-4 accent-blue-600"
                />
                <div>
                  <Link href={`/immobilien/objekte/${o.id}`} className="font-medium text-slate-100 hover:underline">
                    {o.name}
                  </Link>
                  <div className="mt-1 text-sm text-slate-500">{formatEuro(o.kaufpreis)}</div>
                  <div className="mt-1.5">
                    <BesitzstatusBadge status={o.besitzstatus} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:flex sm:items-center">
                <Stat label="Bruttorendite" value={`${o.bruttomietrenditeProzent}%`} />
                <Stat label="Cashflow n. St." value={`${formatEuro(o.monatlicherCashflowNachSteuer)}/Mon.`} />
                <AmpelBadge status={o.ampel} />
              </div>

              <div className="flex gap-2">
                <Link href={`/immobilien/objekte/${o.id}`}>
                  <Button variant="secondary" size="sm">
                    Öffnen
                  </Button>
                </Link>
                <DuplicateObjectButton id={o.id} />
                <DeleteObjectButton id={o.id} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="secondary" disabled={selectedIds.size === 0}>
          Ausgewählte vergleichen{selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={selectedIds.size === 0 || isDeleting}
          onClick={handleBulkDelete}
        >
          {isDeleting ? "Löscht…" : `Ausgewählte löschen${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
        </Button>
      </div>
    </form>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-100">{value}</div>
    </div>
  );
}
