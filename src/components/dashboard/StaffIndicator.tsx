"use client";

import { Icon } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";

export function StaffIndicator() {
  const s = useFileSante();
  const civPct =
    s.staff.civieresTotal > 0
      ? Math.round((s.staff.civieresAvail / s.staff.civieresTotal) * 100)
      : 0;
  const civColor =
    civPct < 20 ? "#c8102e" : civPct < 50 ? "#a06400" : "#1a6d2f";

  return (
    <section className="fs-dash-card flex flex-wrap items-center gap-6 p-5">
      <Pill icon="userPlus" label="Infirmières" value={s.staff.nurses} />
      <Pill icon="userPlus" label="Médecins" value={s.staff.doctors} />
      <Pill
        icon="archive"
        label="Civières disponibles"
        value={`${s.staff.civieresAvail}/${s.staff.civieresTotal}`}
        valueColor={civColor}
        sub={`${civPct}% libres`}
      />
      <div className="ml-auto flex items-center gap-2 text-[12.5px] text-[var(--ap-ink-muted-80)]">
        <Icon name="clock" size={14} />
        <span>{s.staff.shiftLabel}</span>
      </div>
    </section>
  );
}

function Pill({
  icon,
  label,
  value,
  valueColor,
  sub,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  label: string;
  value: string | number;
  valueColor?: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="fs-icon-chip">
        <Icon name={icon} size={14} />
      </div>
      <div>
        <div className="text-[11px] uppercase tracking-[0.06em] text-[var(--ap-ink-muted-48)]">
          {label}
        </div>
        <div
          className="font-mono text-[18px] font-semibold leading-none tabular-nums"
          style={{ color: valueColor ?? "var(--ap-ink)" }}
        >
          {value}
        </div>
        {sub && (
          <div className="mt-0.5 text-[11px] text-[var(--ap-ink-muted-48)]">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
