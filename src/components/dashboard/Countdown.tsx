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
  if (target === null) return <span className="text-[var(--fs-ink-3)]">—</span>;
  const remainingMs = target - s.simClock;
  if (remainingMs <= 0)
    return <span className="text-red-600 font-medium">échu</span>;
  const totalSec = Math.floor(remainingMs / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return (
    <span className="font-mono text-[13px] tabular-nums">
      {prefix && <span className="text-[var(--fs-ink-3)]">{prefix} </span>}
      {min}m {sec.toString().padStart(2, "0")}s
    </span>
  );
}
