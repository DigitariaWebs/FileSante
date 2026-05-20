"use client";

import { useMemo } from "react";

import { Icon } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { dismissExpiryAlert } from "@/lib/filesante/store";
import type { HospitalCode } from "@/lib/filesante/types";

const KIND_LABEL = {
  NO_RESPONSE: "Pas de réponse",
  NO_SHOW: "Non-présentation",
};

type Props = {
  hospital?: HospitalCode | "ALL";
};

export function ExpiryAlertBar({ hospital = "ALL" }: Props) {
  const s = useFileSante();
  const alerts = useMemo(() => {
    return s.expiryAlerts.filter(
      (a) =>
        a.dismissedAt === null && (hospital === "ALL" || a.hospital === hospital),
    );
  }, [s.expiryAlerts, hospital]);

  if (alerts.length === 0) return null;

  return (
    <div
      className="rounded-2xl border border-[rgba(200,16,46,0.4)] bg-[rgba(200,16,46,0.06)] px-5 py-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[rgba(200,16,46,0.15)] text-[#c8102e]">
          <Icon name="warning" size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="fs-tagline text-[15px]! text-[#c8102e]">
            {alerts.length} patient{alerts.length === 1 ? "" : "s"} expiré
            {alerts.length === 1 ? "" : "s"} — place libérée
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {alerts.slice(0, 6).map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(200,16,46,0.3)] bg-white px-2.5 py-1 text-[12px] text-[#7a0e22]"
              >
                <span className="font-mono font-semibold tabular-nums">
                  {a.hospital}
                </span>
                <span>·</span>
                <span>{a.patientName}</span>
                <span className="text-[#c8102e]">({KIND_LABEL[a.kind]})</span>
                <button
                  type="button"
                  onClick={() => dismissExpiryAlert(a.id)}
                  className="ml-1 grid h-4 w-4 place-items-center rounded-full text-[#c8102e] hover:bg-[rgba(200,16,46,0.1)]"
                  aria-label={`Masquer alerte ${a.patientName}`}
                >
                  <Icon name="x" size={11} strokeWidth={2} />
                </button>
              </span>
            ))}
            {alerts.length > 6 && (
              <span className="text-[12px] text-[#7a0e22]">
                + {alerts.length - 6} autres
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
