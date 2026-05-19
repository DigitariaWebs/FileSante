"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Patient } from "@/lib/filesante/types";

import { QrCard } from "./QrCard";

type Props = {
  patient: Patient | null;
  onClose: () => void;
};

export function RegistrationModal({ patient, onClose }: Props) {
  if (!patient) return null;
  const qrPayload = `filesante:${patient.id}:${patient.code}`;
  return (
    <Dialog open={!!patient} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="fs-dash-page sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="fs-display-md text-[26px]!">
            Patient inscrit
          </DialogTitle>
          <DialogDescription className="fs-body text-[var(--ap-ink-muted-48)]">
            Remettez le code et le QR au patient. SMS envoyé au {patient.phone}.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex items-center gap-6">
          <QrCard value={qrPayload} />
          <div className="flex flex-1 flex-col gap-4">
            <div>
              <div className="fs-eyebrow">Code retour</div>
              <div className="mt-1.5 font-[var(--ap-font-display)] text-[44px] leading-none font-semibold tracking-[0.04em] text-[var(--fs-primary)] tabular-nums">
                {patient.code}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--ap-hairline)] bg-[var(--ap-canvas-parchment)] p-3.5 text-[13.5px]">
              <div className="font-semibold text-[var(--ap-ink)]">
                {patient.firstName} {patient.lastName}
              </div>
              <div className="mt-1 text-[var(--ap-ink-muted-80)]">
                {patient.priority} · {patient.motif}
              </div>
              <div className="mt-1 text-[var(--ap-ink-muted-48)]">
                {patient.hospital} ·{" "}
                {patient.origin === "DESK" ? "Triage sur place" : "Origine 811"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button type="button" onClick={onClose} className="fs-btn fs-btn-primary">
            Terminé
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
