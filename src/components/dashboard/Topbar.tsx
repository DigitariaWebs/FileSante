"use client";

import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { setSpeed, store } from "@/lib/filesante/store";

const SPEEDS = [
  { value: 1, label: "1× temps réel" },
  { value: 60, label: "60× — 1 s = 1 min" },
  { value: 600, label: "600× — démo rapide" },
];

export function Topbar() {
  const s = useFileSante();
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    setTime(formatClock(new Date()));
    const id = window.setInterval(() => setTime(formatClock(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  const currentSpeed = SPEEDS.find((sp) => sp.value === s.speed) ?? SPEEDS[1];

  return (
    <div className="flex h-13 items-center justify-between border-b border-(--ap-hairline) bg-(--ap-canvas) px-10">
      <div className="flex items-center gap-3 text-[13px] tracking-[-0.016em] text-[var(--ap-ink-muted-80)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--fs-primary)]" />
          <span>En direct</span>
        </span>
        <span className="text-[var(--ap-hairline)]">·</span>
        <span className="font-mono text-[12.5px] tabular-nums text-[var(--ap-ink-muted-48)]">
          {time}
        </span>
        <span className="text-[var(--ap-hairline)]">·</span>
        <span>HMR — zone Bleue</span>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="fs-btn fs-btn-pearl fs-btn-sm">
              <Icon name="gauge" size={14} />
              {currentSpeed.label}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Vitesse simulée (démo)</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={String(s.speed)}
              onValueChange={(v) => setSpeed(Number(v))}
            >
              {SPEEDS.map((sp) => (
                <DropdownMenuRadioItem key={sp.value} value={String(sp.value)}>
                  {sp.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={() => {
            if (confirm("Réinitialiser toutes les données de démo ?")) {
              store.reset();
            }
          }}
          className="fs-btn fs-btn-pearl fs-btn-sm"
          title="Réinitialiser la base de démo"
        >
          <Icon name="refresh" size={14} />
          Réinitialiser
        </button>
      </div>
    </div>
  );
}

function formatClock(d: Date): string {
  return d.toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
