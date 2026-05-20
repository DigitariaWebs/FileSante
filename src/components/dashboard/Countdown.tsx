"use client";

import { useFileSante } from "@/hooks/useFileSante";

export function Countdown({
  target,
  prefix,
}: {
  target: number | null;
  prefix?: string;
}) {
  const s = useFileSante();
  if (target === null)
    return <span className="text-[var(--ap-ink-muted-48)]">—</span>;
  const remainingMs = target - s.simClock;
  if (remainingMs <= 0)
    return (
      <span className="font-medium text-[var(--ap-status-danger-hard)]">
        échu
      </span>
    );
  const totalSec = Math.floor(remainingMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return (
    <span className="font-mono text-[12.5px] tabular-nums tracking-[-0.1px]">
      {prefix && (
        <span className="text-[var(--ap-ink-muted-48)] font-sans"> {prefix} </span>
      )}
      {min}:{sec.toString().padStart(2, "0")}
    </span>
  );
}
