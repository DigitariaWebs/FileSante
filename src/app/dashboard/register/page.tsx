"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { RegistrationModal } from "@/components/dashboard/RegistrationModal";
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<Patient | null>(null);

  function reset() {
    setFirstName("");
    setLastName("");
    setPhone("");
    setMotif("");
    setPriority("P4");
    setContact("SMS");
    setConsent(false);
    setErrors({});
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Requis";
    if (!lastName.trim()) e.lastName = "Requis";
    if (!phone.trim()) e.phone = "Requis";
    else if (!/[0-9]{7,}/.test(phone.replace(/\D/g, "")))
      e.phone = "Numéro invalide";
    if (!motif.trim()) e.motif = "Requis";
    if (!consent) e.consent = "Consentement requis";
    return e;
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const p = addPatient({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      motif: motif.trim(),
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
      <PageHeader
        eyebrow="Opérations"
        title="Nouvelle inscription"
        description="Saisissez un patient P4 ou P5 dans la file FileSanté."
      />

      <div className="px-10 py-10">
        <form onSubmit={submit} className="fs-dash-card mx-auto max-w-[760px]">
          <SectionHeader
            title="Origine"
            description="Où se trouve actuellement le patient ?"
          />
          <div className="grid grid-cols-2 gap-3 px-8 pb-7">
            <OriginButton
              active={origin === "DESK"}
              onClick={() => setOrigin("DESK")}
              title="Sur place"
              sub="Patient présent au triage"
            />
            <OriginButton
              active={origin === "HOME_811"}
              onClick={() => setOrigin("HOME_811")}
              title="811 / Domicile"
              sub="Appel ou portail patient"
            />
          </div>

          <Divider />

          <SectionHeader title="Identité et contact" />
          <div className="grid gap-5 px-8 pb-7 md:grid-cols-2">
            <Field label="Prénom" htmlFor="first" error={errors.firstName}>
              <Input
                id="first"
                value={firstName}
                onChange={(ev) => setFirstName(ev.target.value)}
                placeholder="Marie"
                className="h-11"
                aria-invalid={!!errors.firstName}
              />
            </Field>
            <Field label="Nom" htmlFor="last" error={errors.lastName}>
              <Input
                id="last"
                value={lastName}
                onChange={(ev) => setLastName(ev.target.value)}
                placeholder="Tremblay"
                className="h-11"
                aria-invalid={!!errors.lastName}
              />
            </Field>
            <Field label="Téléphone" htmlFor="phone" error={errors.phone}>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(ev) => setPhone(ev.target.value)}
                placeholder="+1 514 555 4218"
                className="h-11 font-mono tabular-nums"
                aria-invalid={!!errors.phone}
              />
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
          </div>

          <Divider />

          <SectionHeader
            title="Clinique"
            description="Hôpital de destination · priorité CTAS."
          />
          <div className="grid gap-5 px-8 pb-7 md:grid-cols-2">
            <Field label="Hôpital" htmlFor="hosp">
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
            <Field label="Priorité CTAS" htmlFor="prio">
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
            <Field
              label="Motif de consultation"
              htmlFor="motif"
              full
              error={errors.motif}
            >
              <Input
                id="motif"
                value={motif}
                onChange={(ev) => setMotif(ev.target.value)}
                placeholder="Douleur lombaire persistante depuis 3 jours"
                className="h-11"
                aria-invalid={!!errors.motif}
              />
            </Field>
          </div>

          <Divider />

          <SectionHeader title="Consentement" />
          <div className="px-8 pb-7">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-[14px] transition-colors ${
                errors.consent
                  ? "border-[#ff453a] bg-[rgba(255,69,58,0.04)]"
                  : "border-[var(--ap-hairline)] bg-[var(--ap-canvas-parchment)] hover:border-[var(--ap-ink-muted-48)]"
              }`}
            >
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
                className="mt-0.5"
              />
              <span className="text-[var(--ap-ink-muted-80)]">
                <b className="text-[var(--ap-ink)] font-semibold">
                  Loi 25 — consentement.
                </b>{" "}
                Le patient autorise la collecte de ses renseignements
                personnels pour le routage vers une ressource de première ligne
                et la réception de notifications SMS. Tous les accès sont
                journalisés.
              </span>
            </label>
            {errors.consent && (
              <p className="mt-2 text-[12.5px] text-[#c8102e]">
                {errors.consent}
              </p>
            )}
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="mx-8 mb-5 rounded-xl border border-[#ffcfca] bg-[rgba(255,69,58,0.06)] px-4 py-3 text-[13px] text-[#a02016]">
              Veuillez corriger les champs surlignés.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 border-t border-[var(--ap-hairline)] px-8 py-5">
            <button
              type="button"
              onClick={reset}
              className="fs-btn fs-btn-pearl"
            >
              Effacer
            </button>
            <button type="submit" className="fs-btn fs-btn-primary">
              Inscrire le patient
              <ArrowRight size={14} strokeWidth={1.8} />
            </button>
          </div>
        </form>

        <RegistrationModal patient={created} onClose={() => setCreated(null)} />
      </div>
    </>
  );
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="px-8 pt-7 pb-4">
      <h3 className="fs-tagline text-[17px]!">{title}</h3>
      {description && (
        <p className="fs-body mt-1 text-[var(--ap-ink-muted-48)]">
          {description}
        </p>
      )}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-[var(--ap-hairline)]" />;
}

function Field({
  label,
  htmlFor,
  full,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  full?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${full ? "md:col-span-2" : ""}`}>
      <Label
        htmlFor={htmlFor}
        className="text-[12.5px] font-medium text-[var(--ap-ink-muted-80)]"
      >
        {label}
      </Label>
      {children}
      {error && <span className="text-[12px] text-[#c8102e]">{error}</span>}
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
      className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors ${
        active
          ? "border-[var(--fs-primary)] bg-[rgba(30,144,214,0.06)]"
          : "border-[var(--ap-hairline)] bg-[var(--ap-canvas)] hover:border-[var(--ap-ink-muted-48)]"
      }`}
    >
      <span className="text-[15px] font-semibold text-[var(--ap-ink)] tracking-[-0.016em]">
        {title}
      </span>
      <span className="mt-0.5 text-[12.5px] text-[var(--ap-ink-muted-48)]">
        {sub}
      </span>
    </button>
  );
}
