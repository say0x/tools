import { NeuesSzenarioForm } from "./NeuesSzenarioForm";

export default function NeuesSzenarioPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Neues Szenario</h1>
        <p className="mt-1 text-slate-400">
          Erst Name und Startjahr festlegen — Änderungen (Käufe, Verkäufe, Sparraten, Anschaffungen) fügst du danach hinzu.
        </p>
      </div>
      <NeuesSzenarioForm />
    </div>
  );
}
