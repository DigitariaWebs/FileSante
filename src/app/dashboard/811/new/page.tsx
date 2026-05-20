"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { RegistrationModal } from "@/components/dashboard/RegistrationModal";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CLINICS, SECTORS, SYMPTOMS } from "@/data/clinics";
import { addPatient, addReferral } from "@/lib/filesante/store";
import type {
  ContactMethod,
  HospitalCode,
  Patient,
  Priority,
} from "@/lib/filesante/types";

const HOSPITALS: { code: HospitalCode; name: string }[] = [
  { code: "HMR", name: "HMR — Maisonneuve-Rosemont" },
  { code: "HND", name: "HND — Notre-Dame" },
  { code: "HSC", name: "HSC — Sacré-Cœur" },
  { code: "HGM", name: "HGM — Général de Montréal" },
];

export default function HotlineNew() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [sector, setSector] = useState<string>(SECTORS[0]);
  const [priority, setPriority] = useState<Priority>("P4");
  const [contact, setContact] = useState<ContactMethod>("SMS");
  const [hospital, setHospital] = useState<HospitalCode>("HMR");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [created, setCreated] = useState<Patient | null>(null);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);

  const ranked = useMemo(() => {
    return [...CLINICS]
      .filter((c) => c.loadInitial < 0.95)
      .sort((a, b) => {
        // Prioritize sector match, then lowest load
        const sa = a.sector === sector ? 0 : 1;
        const sb = b.sector === sector ? 0 : 1;
        if (sa !== sb) return sa - sb;
        return a.loadInitial - b.loadInitial;
      })
      .slice(0, 4);
  }, [sector]);

  function toggleSymptom(s: string) {
    setSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }

  function reset() {
    setFirstName("");
    setLastName("");
    setPhone("");
    setSector(SECTORS[0]);
    setPriority("P4");
    setContact("SMS");
    setHospital("HMR");
    setSymptoms([]);
    setNotes("");
    setConsent(false);
    setErrors({});
    setSelectedResource(null);
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Requis";
    if (!lastName.trim()) e.lastName = "Requis";
    if (!phone.trim()) e.phone = "Requis";
    else if (!/[0-9]{7,}/.test(phone.replace(/\D/g, "")))
      e.phone = "Numéro invalide";
    if (symptoms.length === 0 && !notes.trim())
      e.symptoms = "Sélectionnez au moins un symptôme ou ajoutez une note";
    if (!consent) e.consent = "Consentement requis";
    return e;
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const motif =
      symptoms.length > 0
        ? `${symptoms.join(", ")}${notes.trim() ? ` — ${notes.trim()}` : ""}`
        : notes.trim();
    const p = addPatient({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      motif,
      priority,
      contact,
      origin: "HOME_811",
      hospital,
      consent: true,
    });

    // Bidirectional referral — also push to the chosen clinic's inbox.
    const target =
      CLINICS.find((c) => c.name === selectedResource) ?? ranked[0];
    if (target) {
      addReferral({
        patientId: p.id,
        patientInitials:
          firstName.trim().charAt(0).toUpperCase() +
          lastName.trim().charAt(0).toUpperCase(),
        patientName: `${firstName.trim()} ${lastName.trim()}`,
        source: "HOTLINE_811",
        sourceLabel: "Info-Santé 811",
        motif,
        priority,
        destinationId: target.id,
        slaMinutes: 5,
      });
    }

    setCreated(p);
    reset();
  }

  return (
    <>
      <PageHeader
        eyebrow="Info-Santé 811 · Nouvelle évaluation"
        title="Orienter un appelant"
        description="Triagez par téléphone, identifiez la ressource optimale, envoyez par SMS."
        actions={
          <Link href="/dashboard/811" className="fs-btn fs-btn-pearl">
            Annuler
          </Link>
        }
      />

      <div className="px-10 py-10">
        <form
          onSubmit={submit}
          className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-[1.2fr_1fr]"
        >
          {/* LEFT — evaluation form */}
          <div className="flex flex-col gap-6">
            <Section title="Identité de l'appelant">
              <div className="grid gap-5 md:grid-cols-2">
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
                <Field
                  label="Téléphone"
                  htmlFor="phone"
                  error={errors.phone}
                >
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
            </Section>

            <Section title="Évaluation rapide">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Secteur de l'appelant" htmlFor="sector">
                  <Select value={sector} onValueChange={setSector}>
                    <SelectTrigger id="sector" className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Priorité perçue (CTAS)" htmlFor="prio">
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
              </div>

              <div className="mt-5">
                <Label className="text-[12.5px] font-medium text-[var(--ap-ink-muted-80)]">
                  Symptômes signalés
                </Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SYMPTOMS.map((s) => {
                    const on = symptoms.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSymptom(s)}
                        className={`fs-chip cursor-pointer transition-colors ${
                          on ? "fs-chip-primary" : ""
                        }`}
                        style={
                          on
                            ? {
                                borderColor: "var(--fs-primary)",
                              }
                            : { borderColor: "transparent" }
                        }
                      >
                        {on && <Icon name="check" size={12} />}
                        {s}
                      </button>
                    );
                  })}
                </div>
                {errors.symptoms && (
                  <p className="mt-2 text-[12px] text-[#c8102e]">
                    {errors.symptoms}
                  </p>
                )}
              </div>

              <div className="mt-5">
                <Field
                  label="Notes additionnelles"
                  htmlFor="notes"
                  full
                >
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(ev) => setNotes(ev.target.value)}
                    rows={3}
                    placeholder="Antécédents, durée, contexte..."
                    className="fs-input fs-input-rect resize-none py-3"
                  />
                </Field>
              </div>
            </Section>

            <Section title="Destination de repli (urgence)">
              <Field label="Hôpital si re-routage urgent" htmlFor="hosp">
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
            </Section>

            <Section title="Consentement">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-[14px] transition-colors ${
                  errors.consent
                    ? "border-[#c8102e] bg-[rgba(200,16,46,0.04)]"
                    : "border-[var(--ap-hairline)] bg-[var(--ap-canvas-parchment)] hover:border-[var(--ap-ink-muted-48)]"
                }`}
              >
                <Checkbox
                  checked={consent}
                  onCheckedChange={(v) => setConsent(v === true)}
                  className="mt-0.5"
                />
                <span className="text-[var(--ap-ink-muted-80)]">
                  <b className="font-semibold text-[var(--ap-ink)]">
                    Loi 25 — consentement verbal recueilli.
                  </b>{" "}
                  L&apos;appelant autorise la collecte de ses renseignements
                  personnels pour orientation vers une ressource de première
                  ligne et la réception de notifications SMS.
                </span>
              </label>
              {errors.consent && (
                <p className="mt-2 text-[12px] text-[#c8102e]">
                  {errors.consent}
                </p>
              )}
            </Section>

            {Object.keys(errors).length > 0 && (
              <div className="rounded-2xl border border-[#c8102e]/40 bg-[rgba(200,16,46,0.06)] px-4 py-3 text-[13px] text-[#c8102e]">
                Veuillez corriger les champs surlignés.
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={reset}
                className="fs-btn fs-btn-pearl"
              >
                Effacer
              </button>
              <button type="submit" className="fs-btn fs-btn-primary">
                Inscrire et envoyer SMS
                <Icon name="arrowRight" size={14} />
              </button>
            </div>
          </div>

          {/* RIGHT — recommendation panel */}
          <aside className="flex flex-col gap-6">
            <div className="fs-dash-card sticky top-[80px] p-6">
              <div className="fs-eyebrow">Algorithme</div>
              <h3 className="fs-tagline mt-1">Ressource optimale</h3>
              <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
                Classement par secteur + capacité actuelle.
              </p>

              <div className="mt-5 space-y-3">
                {ranked.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--ap-hairline)] bg-[var(--ap-canvas-parchment)] p-4 text-[13px] text-[var(--ap-ink-muted-80)]">
                    Aucune ressource disponible dans ce secteur. Envisager
                    re-routage urgence.
                  </div>
                ) : (
                  ranked.map((r, i) => {
                    const pct = Math.round(r.loadInitial * 100);
                    const color =
                      r.loadInitial > 0.85
                        ? "#c8102e"
                        : r.loadInitial > 0.6
                          ? "#a06400"
                          : "#1a6d2f";
                    const active = selectedResource === r.name;
                    return (
                      <button
                        type="button"
                        key={r.name}
                        onClick={() => setSelectedResource(r.name)}
                        className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                          active
                            ? "border-[var(--fs-primary)] bg-[rgba(30,144,214,0.04)]"
                            : "border-[var(--ap-hairline)] bg-[var(--ap-canvas)] hover:border-[var(--ap-ink-muted-48)]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="fs-chip">{r.type}</span>
                          <div className="min-w-0 flex-1">
                            <div className="text-[14px] font-semibold tracking-[-0.016em] text-[var(--ap-ink)]">
                              {r.name}
                            </div>
                            <div className="text-[11.5px] text-[var(--ap-ink-muted-48)]">
                              {r.sector} · ETA {r.eta}
                            </div>
                          </div>
                          <div
                            className="font-mono text-[13px] font-semibold tabular-nums"
                            style={{ color }}
                          >
                            {pct}%
                          </div>
                        </div>
                        <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--ap-canvas-parchment)]">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: color }}
                          />
                        </div>
                        {i === 0 && (
                          <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--fs-primary)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--fs-primary)]" />
                            Recommandation prioritaire
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-[var(--ap-hairline)] bg-[var(--ap-canvas-parchment)] p-4 text-[12px] text-[var(--ap-ink-muted-80)]">
                <b className="text-[var(--ap-ink)]">À l&apos;inscription</b> —
                un code à 4 chiffres + QR est envoyé à l&apos;appelant par
                SMS. La clinique destinataire reçoit la demande en temps réel.
              </div>
            </div>
          </aside>
        </form>

        <RegistrationModal patient={created} onClose={() => setCreated(null)} />
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fs-dash-card p-6">
      <h3 className="fs-tagline">{title}</h3>
      <div className="mt-5">{children}</div>
    </div>
  );
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
      {error && (
        <span className="text-[12px] text-[#c8102e]">{error}</span>
      )}
    </div>
  );
}
