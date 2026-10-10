import { Suspense } from "react";
import { FitnessTabs } from "./FitnessTabs";

export default function FitnessLayout({ children }: LayoutProps<"/fitness">) {
  return (
    <div className="flex flex-col gap-6">
      {/* useSearchParams() in den Tabs braucht eine Suspense-Grenze, sonst
          bricht das Prerendering der statischen Unterseiten (Sport-Rechner). */}
      <Suspense fallback={<div className="h-10 border-b border-slate-800" />}>
        <FitnessTabs />
      </Suspense>
      {children}
    </div>
  );
}
