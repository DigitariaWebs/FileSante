"use client";

import { Icon } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { setConfirmDelay } from "@/lib/filesante/store";
import type { HospitalCode } from "@/lib/filesante/types";

type Props = {
  hospital: HospitalCode;
};

export function ConfirmDelayCard({ hospital }: Props) {
  const s = useFileSante();
  const current = s.hospitalSettings[hospital]?.confirmDelayMin ?? 15;

  function onChange(v: number) {
    setConfirmDelay(hospital, v);
  }

  return (
    <section className="fs-dash-card flex flex-wrap items-center gap-5 p-5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[rgba(30,144,214,0.1)] text-[var(--fs-primary)]">
        <Icon name="clock" size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="fs-eyebrow">Délai de confirmation · {hospital}</div>
        <h3 className="fs-tagline mt-0.5">
          Patient répond OUI dans {current} min après notification
        </h3>
        <p className="mt-1 text-[12px] text-[var(--ap-ink-muted-80)]">
          Appliqué uniquement aux prochaines notifications. Les patients déjà
          notifiés conservent leur fenêtre courante.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={1}
          max={15}
          step={1}
          value={current}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="h-2 w-44 cursor-pointer appearance-none rounded-full bg-[var(--ap-canvas-parchment)] accent-[var(--fs-primary)]"
          aria-label={`Délai confirmation ${hospital}`}
        />
        <span className="font-mono text-[20px] font-semibold tabular-nums text-[var(--ap-ink)]">
          {current}
          <span className="ml-0.5 text-[12px] font-medium text-[var(--ap-ink-muted-48)]">
            min
          </span>
        </span>
      </div>
    </section>
  );
}
