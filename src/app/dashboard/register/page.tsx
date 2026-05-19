"use client";

import { useState } from "react";

import { RegistrationModal } from "@/components/dashboard/RegistrationModal";
import { Topbar } from "@/components/dashboard/Topbar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addPatient } from "@/lib/filesante/store";
import type {
  ContactMethod,
  HospitalCode,
  Origin,
  Patient,
  Priority,
} from "@/lib/filesante/types";

const HOSPITALS: { code: HospitalCode; name: string }[] = [
  { code: "HMR", name: "HMR — Maisonneuve-Rosemont" },
  { code: "HND", name: "HND — Notre-Dame" },
  { code: "HSC", name: "HSC — Sacré-Cœur" },
  { code: "HGM", name: "HGM — Général de Montréal" },
];

export default function RegisterPage() {
  const [origin, setOrigin] = useState<Origin>("DESK");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [motif, setMotif] = useState("");
  const [priority, setPriority] = useState<Priority>("P4");
  const [contact, setContact] = useState<ContactMethod>("SMS");
  const [hospital, setHospital] = useState<HospitalCode>("HMR");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Patient | null>(null);

  function reset() {
    setFirstName("");
    setLastName("");
    setPhone("");
    setMotif("");
    setPriority("P4");
    setContact("SMS");
    setConsent(false);
    setError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName || !lastName || !phone || !motif) {
      setError("Tous les champs sont requis.");
      return;
    }
    if (!consent) {
      setError("Consentement Loi 25 requis.");
      return;
    }
    const p = addPatient({
      firstName,
      lastName,
      phone,
      motif,
      priority,
      contact,
      origin,
      hospital,
      consent: true,
    });
    setCreated(p);
    reset();
  }

  return (
    <>
      <Topbar title="Inscription patient P4 / P5" />
      <div className="px-8 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <form
            onSubmit={submit}
            className="rounded-2xl border border-[var(--fs-line)] bg-white p-6"
          >
            <div className="mb-6">
              <Label className="mb-2 inline-block">Origine</Label>
              <div className="grid grid-cols-2 gap-2">
                <OriginButton
                  active={origin === "DESK"}
                  onClick={() => setOrigin("DESK")}
                  title="Sur place"
                  sub="Patient au triage"
                />
                <OriginButton
                  active={origin === "HOME_811"}
                  onClick={() => setOrigin("HOME_811")}
                  title="811 / Domicile"
                  sub="Appel ou portail patient"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Prénom" htmlFor="first">
                <Input
                  id="first"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Marie"
                  className="h-11"
                />
              </Field>
              <Field label="Nom" htmlFor="last">
                <Input
                  id="last"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Tremblay"
                  className="h-11"
                />
              </Field>
              <Field label="Téléphone" htmlFor="phone">
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 514 555 4218"
                  className="h-11"
                />
              </Field>
              <Field label="Hôpital de destination" htmlFor="hosp">
                <Select
                  value={hospital}
                  onValueChange={(v) => setHospital(v as HospitalCode)}
                >
                  <SelectTrigger id="hosp" className="h-11 w-full">
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
              </Field>
              <Field label="Priorité (CTAS)" htmlFor="prio">
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as Priority)}
                >
                  <SelectTrigger id="prio" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P4">P4 — moins urgent</SelectItem>
                    <SelectItem value="P5">P5 — non urgent</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Méthode de contact" htmlFor="contact">
                <Select
                  value={contact}
                  onValueChange={(v) => setContact(v as ContactMethod)}
                >
                  <SelectTrigger id="contact" className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="CALL">Appel</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Motif de consultation" htmlFor="motif" full>
                <Input
                  id="motif"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Douleur lombaire persistante depuis 3 jours"
                  className="h-11"
                />
              </Field>
            </div>

            <label className="mt-6 flex cursor-pointer items-start gap-2.5 rounded-xl border border-[var(--fs-line)] bg-[var(--fs-bg-soft-2)] p-3.5 text-[13px]">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
                className="mt-0.5"
              />
              <span className="text-[var(--fs-ink-2)]">
                <b className="text-[var(--fs-ink)]">Consentement Loi 25.</b> Le
                patient autorise la collecte de ses renseignements personnels
                pour le routage vers une ressource de première ligne et la
                réception de notifications SMS.
              </span>
            </label>

            {error && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={reset}
                className="h-11 rounded-full border border-[var(--fs-line)] bg-white px-5 text-sm font-medium text-[var(--fs-ink-2)] hover:border-[var(--fs-primary)]"
              >
                Effacer
              </button>
              <button type="submit" className="fs-pill" style={{ height: 46 }}>
                Inscrire
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
          </form>

          <aside className="rounded-2xl border border-[var(--fs-line)] bg-white p-6">
            <div className="fs-sec-eyebrow">Rappel — workflow</div>
            <ol className="mt-3 space-y-3 text-[13.5px] text-[var(--fs-ink-2)]">
              <Step n={1} title="Triage CTAS">
                P1–P3 → urgence standard. P4–P5 → FileSanté.
              </Step>
              <Step n={2} title="Inscription">
                Saisir identité, motif, priorité et consentement Loi 25.
              </Step>
              <Step n={3} title="Code + QR">
                Système génère un code à 4 chiffres et un QR. SMS envoyé.
              </Step>
              <Step n={4} title="Statut: REGISTERED">
                Patient quitte l&apos;urgence. T-60 → demande de confirmation.
              </Step>
            </ol>
          </aside>
        </div>

        <RegistrationModal patient={created} onClose={() => setCreated(null)} />
      </div>
    </>
  );
}

function Field({
  label,
  htmlFor,
  full,
  children,
}: {
  label: string;
  htmlFor: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "md:col-span-2" : ""}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function OriginButton({
  active,
  onClick,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start rounded-xl border px-4 py-3 text-left transition-colors ${
        active
          ? "border-[var(--fs-primary)] bg-[var(--fs-bg-soft)]"
          : "border-[var(--fs-line)] bg-white hover:border-[var(--fs-primary)]"
      }`}
    >
      <span className="text-sm font-semibold text-[var(--fs-ink)]">
        {title}
      </span>
      <span className="text-xs text-[var(--fs-ink-3)]">{sub}</span>
    </button>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 inline-grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--fs-primary)] bg-white text-xs font-semibold text-[var(--fs-primary)]">
        {n}
      </span>
      <span>
        <b className="text-[var(--fs-ink)]">{title}.</b> {children}
      </span>
    </li>
  );
}
