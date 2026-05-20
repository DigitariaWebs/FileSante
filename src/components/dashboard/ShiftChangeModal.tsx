"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeShift } from "@/lib/filesante/store";

type Props = {
  open: boolean;
  current: { firstName: string; lastName: string };
  onClose: () => void;
};

export function ShiftChangeModal({ open, current, onClose }: Props) {
  const [first, setFirst] = useState(current.firstName);
  const [last, setLast] = useState(current.lastName);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!first.trim() || !last.trim()) {
      setError("Prénom et nom requis");
      return;
    }
    changeShift(first.trim(), last.trim());
    setError(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="fs-dash-page sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="fs-display-md text-[24px]!">
            Changement de quart
          </DialogTitle>
          <DialogDescription className="fs-body text-[var(--ap-ink-muted-48)]">
            Identifiez l&apos;infirmière prenant la relève. Les SMS sortants
            sont signés du quart en cours.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
          <div>
            <Label
              htmlFor="sh-first"
              className="text-[12.5px] font-medium text-[var(--ap-ink-muted-80)]"
            >
              Prénom
            </Label>
            <Input
              id="sh-first"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              className="mt-1.5 h-11"
            />
          </div>
          <div>
            <Label
              htmlFor="sh-last"
              className="text-[12.5px] font-medium text-[var(--ap-ink-muted-80)]"
            >
              Nom
            </Label>
            <Input
              id="sh-last"
              value={last}
              onChange={(e) => setLast(e.target.value)}
              className="mt-1.5 h-11"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-[#c8102e]/40 bg-[rgba(200,16,46,0.06)] px-3 py-2 text-[12.5px] text-[#c8102e]">
              {error}
            </div>
          )}

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="fs-btn fs-btn-pearl"
            >
              Annuler
            </button>
            <button type="submit" className="fs-btn fs-btn-primary">
              Confirmer
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
