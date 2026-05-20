"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/Icon";
import { setSurge } from "@/lib/filesante/store";

const DELAYS = [15, 30, 45] as const;

type Props = {
  open: boolean;
  current: number;
  onClose: () => void;
};

export function SurgeModal({ open, current, onClose }: Props) {
  function pick(min: 0 | 15 | 30 | 45) {
    setSurge(min);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="fs-dash-page sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="fs-display-md text-[24px]!">
            Mode surcharge
          </DialogTitle>
          <DialogDescription className="fs-body text-[var(--ap-ink-muted-48)]">
            Ajoute un délai supplémentaire à toutes les nouvelles inscriptions.
            Les patients en attente reçoivent un SMS.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {DELAYS.map((d) => {
            const active = current === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => pick(d)}
                className={`rounded-2xl border p-4 text-center transition-colors ${
                  active
                    ? "border-[#a06400] bg-[#fff8e6]"
                    : "border-[var(--ap-hairline)] hover:border-[var(--ap-ink-muted-48)]"
                }`}
              >
                <div className="fs-eyebrow">délai</div>
                <div className="mt-2 font-mono text-[28px] font-semibold tabular-nums text-[var(--ap-ink)]">
                  +{d}
                </div>
                <div className="text-[11.5px] text-[var(--ap-ink-muted-48)]">
                  minutes
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center justify-between gap-2">
          {current > 0 ? (
            <div className="inline-flex items-center gap-2 text-[12.5px] text-[#a06400]">
              <Icon name="warning" size={14} />
              Surcharge active : +{current} min
            </div>
          ) : (
            <div className="text-[12.5px] text-[var(--ap-ink-muted-48)]">
              Aucune surcharge active
            </div>
          )}
          <div className="flex gap-2">
            {current > 0 && (
              <button
                type="button"
                onClick={() => pick(0)}
                className="fs-btn fs-btn-danger"
              >
                Désactiver
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="fs-btn fs-btn-pearl"
            >
              Fermer
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
