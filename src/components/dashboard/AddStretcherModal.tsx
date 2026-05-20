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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addCiviere } from "@/lib/filesante/store";
import type { CiviereReason, HospitalCode } from "@/lib/filesante/types";

const REASONS: { value: CiviereReason; label: string }[] = [
  { value: "LABO", label: "Laboratoire" },
  { value: "RADIO", label: "Radiologie" },
  { value: "CONSULTANT", label: "Consultant" },
  { value: "OTHER", label: "Autre" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  hospital?: HospitalCode;
};

export function AddStretcherModal({ open, onClose, hospital = "HMR" }: Props) {
  const [name, setName] = useState("");
  const [num, setNum] = useState<string>("1");
  const [reason, setReason] = useState<CiviereReason>("LABO");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseInt(num, 10);
    if (!name.trim()) {
      setError("Nom du patient requis");
      return;
    }
    if (Number.isNaN(n) || n < 1 || n > 20) {
      setError("Numéro de civière entre 1 et 20");
      return;
    }
    addCiviere({
      patientName: name.trim(),
      stretcherNum: n,
      reason,
      hospital,
    });
    setName("");
    setNum("1");
    setReason("LABO");
    setError(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="fs-dash-page sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="fs-display-md text-[24px]!">
            Ajouter une civière
          </DialogTitle>
          <DialogDescription className="fs-body text-[var(--ap-ink-muted-48)]">
            Patient transféré sur civière à l&apos;urgence. Statut initial :
            attente résultats.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="mt-4 flex flex-col gap-4">
          <div>
            <Label
              htmlFor="civ-name"
              className="text-[12.5px] font-medium text-[var(--ap-ink-muted-80)]"
            >
              Nom du patient
            </Label>
            <Input
              id="civ-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jean Dupont"
              className="mt-1.5 h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="civ-num"
                className="text-[12.5px] font-medium text-[var(--ap-ink-muted-80)]"
              >
                Civière n° (1–20)
              </Label>
              <Input
                id="civ-num"
                type="number"
                min={1}
                max={20}
                value={num}
                onChange={(e) => setNum(e.target.value)}
                className="mt-1.5 h-11 font-mono tabular-nums"
              />
            </div>
            <div>
              <Label
                htmlFor="civ-reason"
                className="text-[12.5px] font-medium text-[var(--ap-ink-muted-80)]"
              >
                Motif d&apos;attente
              </Label>
              <Select
                value={reason}
                onValueChange={(v) => setReason(v as CiviereReason)}
              >
                <SelectTrigger id="civ-reason" className="mt-1.5 h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              Ajouter
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
