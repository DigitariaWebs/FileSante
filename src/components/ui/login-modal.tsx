"use client";

import { useRouter } from "next/navigation";
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

const HOSPITALS = [
  { code: "HMR", name: "HMR — Maisonneuve-Rosemont" },
  { code: "HND", name: "HND — Notre-Dame" },
  { code: "HSC", name: "HSC — Sacré-Cœur" },
  { code: "HGM", name: "HGM — Général de Montréal" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LoginModal({ open, onOpenChange }: Props) {
  const router = useRouter();
  const [first, setFirst] = useState("Marie");
  const [last, setLast] = useState("Tremblay");
  const [code, setCode] = useState("HMR");

  function submit() {
    // Pilot — weak auth, no password. Push hospital code via query.
    router.push(`/dashboard?h=${code}&u=${first}+${last}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-[-0.02em]">
            Connexion au portail
          </DialogTitle>
          <DialogDescription>
            Démo pilote — aucun mot de passe requis.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="f-first">Prénom</Label>
            <Input
              id="f-first"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              placeholder="Marie"
              className="h-11"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="f-last">Nom</Label>
            <Input
              id="f-last"
              value={last}
              onChange={(e) => setLast(e.target.value)}
              placeholder="Tremblay"
              className="h-11"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-code">Code d&apos;hôpital</Label>
          <Select value={code} onValueChange={setCode}>
            <SelectTrigger id="f-code" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOSPITALS.map((h) => (
                <SelectItem key={h.code} value={h.code}>
                  {h.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-[#ffe3a3] bg-[#fff7e6] p-3.5 text-[12.5px] text-[#7a5b14]">
          <span className="text-sm">⚠</span>
          <div>
            <b className="text-[#5e4408]">Authentification faible (pilote).</b>{" "}
            Aucun mot de passe n&apos;est demandé — l&apos;identification se
            fait par <b>prénom + nom + code d&apos;hôpital</b>. Tous les accès
            sont journalisés.
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2.5">
          <a href="#" className="text-[13px] text-[var(--fs-ink-3)]">
            Besoin d&apos;aide ?
          </a>
          <button
            type="button"
            onClick={submit}
            className="fs-pill"
            style={{ height: 46 }}
          >
            Entrer dans la file
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
