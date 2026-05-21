"use client";

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
import { auth, ROLE_HOME, type AuthRole } from "@/lib/filesante/auth";
import type { HospitalCode } from "@/lib/filesante/types";
import { useRouter } from "next/navigation";
import { useState } from "react";





















type RoleKey = AuthRole;

const ROLES: { key: RoleKey; label: string; href: string }[] = [
  { key: "TRIAGE", label: "🩺 Triage urgences", href: ROLE_HOME.TRIAGE },
  {
    key: "HOTLINE_811",
    label: "📞 Info-Santé 811",
    href: ROLE_HOME.HOTLINE_811,
  },
  {
    key: "DIRECTION",
    label: "🏥 Direction d'hôpital",
    href: ROLE_HOME.DIRECTION,
  },
  { key: "MSSS", label: "🏛️ Gouvernement du Québec", href: ROLE_HOME.MSSS },
  {
    key: "CLINIQUE",
    label: "🏘️ Première ligne (GMF / CLSC)",
    href: ROLE_HOME.CLINIQUE,
  },
  { key: "PATIENT", label: "👤 Patient", href: ROLE_HOME.PATIENT },
];

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
  const [first, setFirst] = useState("Claude");
  const [last, setLast] = useState("Yann");
  const [hospital, setHospital] = useState("HMR");
  const [role, setRole] = useState<RoleKey>("TRIAGE");

  const showHospital = role === "TRIAGE" || role === "DIRECTION";

  function submit() {
    const target = ROLES.find((r) => r.key === role)!.href;
    auth.login({
      role,
      firstName: first.trim() || "—",
      lastName: last.trim() || "—",
      hospital: showHospital ? (hospital as HospitalCode) : undefined,
    });
    // Mirror hospital binding into the legacy key consumed by triage pages
    // (kept in sync so existing components still work).
    if (showHospital && typeof window !== "undefined") {
      try {
        window.localStorage.setItem("filesante.triage.hospital", hospital);
      } catch {
        /* ignore */
      }
    }
    router.push(target);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl tracking-[-0.02em]">
            Connexion au portail
          </DialogTitle>
          <DialogDescription>
            Démo pilote — choisissez votre rôle, aucun mot de passe requis.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="f-role">Rôle</Label>
          <Select value={role} onValueChange={(v) => setRole(v as RoleKey)}>
            <SelectTrigger id="f-role" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.key} value={r.key}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-2 flex gap-3">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="f-first">Prénom</Label>
            <Input
              id="f-first"
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              placeholder="Claude"
              className="h-11"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="f-last">Nom</Label>
            <Input
              id="f-last"
              value={last}
              onChange={(e) => setLast(e.target.value)}
              placeholder="Yann"
              className="h-11"
            />
          </div>
        </div>

        {showHospital && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="f-hospital">Code d&apos;hôpital</Label>
            <Select value={hospital} onValueChange={setHospital}>
              <SelectTrigger id="f-hospital" className="h-11 w-full">
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
        )}

        <div className="mt-4 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={submit}
            className="fs-pill"
            style={{ height: 46 }}
          >
            Entrer
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
