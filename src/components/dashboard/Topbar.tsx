"use client";

import { useFileSante } from "@/hooks/useFileSante";
import { setSpeed, store } from "@/lib/filesante/store";

const SPEEDS = [
  { value: 1, label: "1× réel" },
  { value: 60, label: "60× (1 s = 1 min)" },
  { value: 600, label: "600× (rapide)" },
];

export function Topbar({ title }: { title: string }) {
  const s = useFileSante();
  return (
    <header className="sticky top-0 z-10 flex h-[68px] items-center justify-between border-b border-[var(--fs-line)] bg-white/90 px-8 backdrop-blur">
      <h1 className="font-display text-[20px] font-semibold tracking-[-0.01em] text-[var(--fs-ink)]">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-[var(--fs-line)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--fs-ink-2)]">
          <span className="fs-pulse-dot" />
          Démo · vitesse simulée
        </div>
        <select
          value={s.speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="h-9 rounded-lg border border-[var(--fs-line)] bg-white px-3 text-sm font-medium text-[var(--fs-ink)] outline-none focus:border-[var(--fs-primary)]"
        >
          {SPEEDS.map((sp) => (
            <option key={sp.value} value={sp.value}>
              {sp.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => {
            if (confirm("Réinitialiser toutes les données de démo ?")) {
              store.reset();
            }
          }}
          className="h-9 rounded-lg border border-[var(--fs-line)] bg-white px-3 text-sm font-medium text-[var(--fs-ink-2)] hover:border-[var(--fs-primary)] hover:text-[var(--fs-primary)]"
        >
          Réinitialiser
        </button>
      </div>
    </header>
  );
}
