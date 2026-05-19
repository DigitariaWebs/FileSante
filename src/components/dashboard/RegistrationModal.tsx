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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-[-0.02em]">
            Patient inscrit
          </DialogTitle>
          <DialogDescription>
            Remettez le code et le QR au patient. SMS envoyé au {patient.phone}.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3 flex items-center gap-5">
          <QrCard value={qrPayload} />
          <div className="flex flex-1 flex-col gap-3">
            <div>
              <div className="text-xs font-semibold tracking-[0.04em] text-[var(--fs-ink-3)] uppercase">
                Code retour
              </div>
              <div className="mt-1 font-display text-[44px] leading-none font-semibold tracking-[0.04em] text-[var(--fs-primary)]">
                {patient.code}
              </div>
            </div>
            <div className="rounded-xl border border-[var(--fs-line)] bg-[var(--fs-bg-soft-2)] p-3 text-[13px]">
              <div className="font-semibold text-[var(--fs-ink)]">
                {patient.firstName} {patient.lastName}
              </div>
              <div className="mt-1 text-[var(--fs-ink-2)]">
                {patient.priority} · {patient.motif}
              </div>
              <div className="mt-1 text-[var(--fs-ink-3)]">
                {patient.hospital} ·{" "}
                {patient.origin === "DESK" ? "Triage sur place" : "Origine 811"}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onClose} className="fs-pill">
            Terminé
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
