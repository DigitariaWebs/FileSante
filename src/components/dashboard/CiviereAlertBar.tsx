"use client";

import { useMemo } from "react";

import { Icon } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { dismissCiviereAlert } from "@/lib/filesante/store";
import type { HospitalCode } from "@/lib/filesante/types";

const REASON_LABEL = {
  LABO: "Labo",
  RADIO: "Radio",
  CONSULTANT: "Consultant",
  OTHER: "Autre",
};

type Props = {
  hospital?: HospitalCode;
};

export function CiviereAlertBar({ hospital = "HMR" }: Props) {
  const s = useFileSante();
  const alerts = useMemo(() => {
    return s.civieres.filter(
      (c) =>
        c.hospital === hospital &&
        c.status === "AWAITING_RESULTS" &&
        c.alertDismissedAt === null,
    );
  }, [s.civieres, hospital]);

  if (alerts.length === 0) return null;

  return (
    <div
      className="rounded-2xl border border-[#ffd789] bg-[#fff8e6] px-5 py-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ffd789] text-[#a06400]">
          <Icon name="warning" size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="fs-tagline text-[15px]! text-[#a06400]">
            {alerts.length} civière{alerts.length === 1 ? "" : "s"} en attente
            de résultats
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {alerts.slice(0, 5).map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-2 rounded-full border border-[#ffd789] bg-white px-2.5 py-1 text-[12px] text-[#7a5500]"
              >
                <span className="font-mono font-semibold tabular-nums">
                  #{c.stretcherNum}
                </span>
                <span>·</span>
                <span>{c.patientName}</span>
                <span className="text-[#a06400]">({REASON_LABEL[c.reason]})</span>
                <button
                  type="button"
                  onClick={() => dismissCiviereAlert(c.id)}
                  className="ml-1 grid h-4 w-4 place-items-center rounded-full text-[#a06400] hover:bg-[#fff8e6]"
                  aria-label={`Masquer civière #${c.stretcherNum}`}
                >
                  <Icon name="x" size={11} strokeWidth={2} />
                </button>
              </span>
            ))}
            {alerts.length > 5 && (
              <span className="text-[12px] text-[#7a5500]">
                + {alerts.length - 5} autres
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
