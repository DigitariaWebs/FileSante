"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Icon } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import type { HospitalCode } from "@/lib/filesante/types";

type Props = {
  hospital?: HospitalCode | "ALL";
};

export function PendingCallsBar({ hospital = "ALL" }: Props) {
  const s = useFileSante();
  const calls = useMemo(() => {
    return s.patients.filter(
      (p) =>
        p.contact === "CALL" &&
        (p.status === "AWAITING_CONFIRMATION" ||
          p.status === "AWAITING_CONFIRMATION_FINAL") &&
        (hospital === "ALL" || p.hospital === hospital),
    );
  }, [s.patients, hospital]);

  if (calls.length === 0) return null;

  return (
    <div
      className="rounded-2xl border border-[rgba(30,144,214,0.3)] bg-[rgba(30,144,214,0.06)] px-5 py-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[rgba(30,144,214,0.15)] text-[var(--fs-primary)]">
          <Icon name="phoneOff" size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="fs-tagline text-[15px]! text-[var(--fs-primary)]">
            {calls.length} patient{calls.length === 1 ? "" : "s"} à rappeler par
            téléphone
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {calls.slice(0, 6).map((p) => {
              const phoneClean = p.phone.replace(/[^+\d]/g, "");
              return (
                <a
                  key={p.id}
                  href={`tel:${phoneClean}`}
                  className="inline-flex items-center gap-2 rounded-full border border-[rgba(30,144,214,0.3)] bg-white px-2.5 py-1 text-[12px] text-[var(--fs-primary)] hover:bg-[rgba(30,144,214,0.05)]"
                  title={`Appeler ${phoneClean}`}
                >
                  <span className="font-semibold">{p.firstName} {p.lastName}</span>
                  <span>·</span>
                  <span className="font-mono tabular-nums">{phoneClean}</span>
                  <span>·</span>
                  <span className="font-mono">code {p.code}</span>
                </a>
              );
            })}
            {calls.length > 6 && (
              <Link
                href="/dashboard/triage/calls"
                className="text-[12px] text-[var(--fs-primary)] underline"
              >
                + {calls.length - 6} autres
              </Link>
            )}
          </div>
        </div>
        <Link
          href="/dashboard/triage/calls"
          className="fs-btn fs-btn-pearl fs-btn-sm"
        >
          Voir tout
        </Link>
      </div>
    </div>
  );
}
