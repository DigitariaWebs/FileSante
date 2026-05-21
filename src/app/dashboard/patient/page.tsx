"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { Countdown } from "@/components/dashboard/Countdown";
import { QrCard } from "@/components/dashboard/QrCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Checkbox } from "@/components/ui/checkbox";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { CLINICS, type Clinic } from "@/data/clinics";
import { useFileSante } from "@/hooks/useFileSante";
import {
  activatePatient,
  cancelPatient,
  confirmPatient,
  markArrived,
} from "@/lib/filesante/store";
import type {
  HospitalCode,
  Patient,
  PatientStatus,
  Referral,
} from "@/lib/filesante/types";

const DEFAULT_CODE = "1875"; // Olivier Bélanger — AWAITING_CONFIRMATION

// Canadian phone: optional +1, then 10 digits. Accepts spaces/dashes/parens.
const CANADIAN_PHONE_RE = /^\+?1?[\s().-]*(\d[\s().-]*){10}$/;

function isValidCanadianPhone(v: string): boolean {
  return CANADIAN_PHONE_RE.test(v.trim());
}

const STEPS: { key: PatientStatus[]; label: string; tag: string }[] = [
  { key: ["REGISTERED"], label: "Inscrit", tag: "À la maison" },
  {
    key: ["AWAITING_CONFIRMATION", "AWAITING_CONFIRMATION_FINAL"],
    label: "Confirmation",
    tag: "Répondez OUI / NON",
  },
  { key: ["CONFIRMED"], label: "Confirmé", tag: "Fenêtre 60 min" },
  { key: ["ARRIVED", "COMPLETED"], label: "Arrivé", tag: "Triage retour" },
];

type Phase =
  | "lookup"
  | "activation"
  | "waiting"
  | "soon"
  | "depart"
  | "closed";

const HOSPITAL_INFO: Record<
  HospitalCode,
  { name: string; address: string; phone: string }
> = {
  HMR: {
    name: "Hôpital Maisonneuve-Rosemont",
    address: "5415, boul. de l'Assomption, Montréal",
    phone: "+1 514 252-3400",
  },
  HND: {
    name: "Hôpital Notre-Dame",
    address: "1560, rue Sherbrooke Est, Montréal",
    phone: "+1 514 413-8777",
  },
  HSC: {
    name: "Hôpital du Sacré-Cœur",
    address: "5400, boul. Gouin Ouest, Montréal",
    phone: "+1 514 338-2222",
  },
  HGM: {
    name: "Hôpital général de Montréal",
    address: "1650, av. Cedar, Montréal",
    phone: "+1 514 934-1934",
  },
};

// Subtle phase tints — full bg stays soft. Urgency conveyed via banner/pill inside,
// not by saturating the whole page.
const PHASE_GRADIENT: Record<Phase, string> = {
  lookup: "#ffffff",
  activation: "#ffffff",
  waiting: "#ffffff",
  soon: "#ffffff",
  depart: "#ffffff",
  closed: "#ffffff",
};

function statusToPhase(p?: Patient): Phase {
  if (!p) return "lookup";
  if (p.activatedAt === null) return "activation";
  if (p.status === "REGISTERED") return "waiting";
  if (
    p.status === "AWAITING_CONFIRMATION" ||
    p.status === "AWAITING_CONFIRMATION_FINAL"
  )
    return "soon";
  if (p.status === "CONFIRMED") return "depart";
  return "closed";
}

export default function PatientPage() {
  return (
    <Suspense fallback={null}>
      <PatientInner />
    </Suspense>
  );
}

function PatientInner() {
  const s = useFileSante();
  const params = useSearchParams();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);
  // Accept both ?code= (legacy) and ?token= (QR payload) as aliases.
  const initialCode = (
    params.get("code") ??
    params.get("token") ??
    DEFAULT_CODE
  ).trim();
  const [codeInput, setCodeInput] = useState(initialCode);
  const [activeCode, setActiveCode] = useState(initialCode);

  const patient = useMemo(
    () => s.patients.find((p) => p.code === activeCode),
    [s.patients, activeCode],
  );

  const sms = useMemo(() => {
    if (!patient) return [];
    return s.sms
      .filter((m) => m.patientId === patient.id)
      .sort((a, b) => b.at - a.at);
  }, [s.sms, patient]);

  const acceptedReferral: Referral | undefined = useMemo(() => {
    if (!patient) return undefined;
    return s.referrals
      .filter((r) => r.patientId === patient.id && r.status === "ACCEPTED")
      .sort((a, b) => (b.decidedAt ?? 0) - (a.decidedAt ?? 0))[0];
  }, [s.referrals, patient]);

  const destinationClinic: Clinic | undefined = useMemo(() => {
    if (!acceptedReferral) return undefined;
    return CLINICS.find((c) => c.id === acceptedReferral.destinationId);
  }, [acceptedReferral]);

  function submitLookup(e: React.FormEvent) {
    e.preventDefault();
    setActiveCode(codeInput.trim());
  }

  const phase = statusToPhase(patient);

  return (
    <div
      className="min-h-screen px-4 py-6 sm:px-6 sm:py-10 transition-colors"
      style={{ background: PHASE_GRADIENT[phase] }}
    >
      <div className="mx-auto max-w-230">
        <LookupForm
          codeInput={codeInput}
          setCodeInput={setCodeInput}
          submit={submitLookup}
          phase={phase}
        />

        {!hydrated ? (
          <PatientSkeleton />
        ) : !patient ? (
          <NotFound code={activeCode} />
        ) : (
          <PatientView
            patient={patient}
            phase={phase}
            sms={sms}
            destinationClinic={destinationClinic}
          />
        )}

        <HelpBar phase={phase} />
      </div>
    </div>
  );
}

function LookupForm({
  codeInput,
  setCodeInput,
  submit,
  phase,
}: {
  codeInput: string;
  setCodeInput: (v: string) => void;
  submit: (e: React.FormEvent) => void;
  phase: Phase;
}) {
  const dark = phase === "waiting" || phase === "soon" || phase === "depart";
  return (
    <form
      onSubmit={submit}
      className={`mb-8 flex flex-col gap-3 rounded-2xl border p-5 backdrop-blur-md sm:flex-row sm:items-end ${
        dark
          ? "border-white/30 bg-white/15"
          : "border-[var(--ap-hairline)] bg-[var(--ap-canvas)]"
      }`}
    >
      <div className="flex-1">
        <label
          htmlFor="code"
          className={`fs-eyebrow mb-1.5 inline-block ${dark ? "text-white/80!" : ""}`}
        >
          Code retour à 4 chiffres
        </label>
        <input
          id="code"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          inputMode="numeric"
          maxLength={4}
          placeholder="4218"
          className={`fs-input font-mono text-center text-[22px] tracking-[0.32em] tabular-nums ${
            dark
              ? "border-white/40 bg-white/10 text-white placeholder:text-white/60"
              : ""
          }`}
        />
      </div>
      <button
        type="submit"
        className={dark ? "fs-btn fs-btn-pearl" : "fs-btn fs-btn-primary"}
      >
        Consulter ma file
      </button>
    </form>
  );
}

function PatientSkeleton() {
  return (
    <div className="fs-dash-card animate-pulse px-6 py-14 flex flex-col items-center gap-4">
      <div className="h-10 w-10 rounded-full bg-(--ap-surface-strong)" />
      <div className="h-5 w-48 rounded-lg bg-(--ap-surface-strong)" />
      <div className="h-4 w-64 rounded-lg bg-(--ap-surface-strong)" />
    </div>
  );
}

function NotFound({ code }: { code: string }) {
  const looksLikeToken = code.trim().length > 0;
  return (
    <div className="fs-dash-card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-(--ap-surface-strong) text-(--ap-ink-muted-48)">
        <Icon name="search" size={22} />
      </div>
      <div>
        <div className="fs-tagline">
          {looksLikeToken
            ? `QR ou code invalide : ${code}`
            : "Aucun code fourni"}
        </div>
        <p className="mt-1 text-[14px] text-(--ap-ink-muted-80)">
          {looksLikeToken
            ? "Ce QR n'est lié à aucun dossier actif. Présentez-vous au triage pour un nouveau code, ou composez 811."
            : "Scannez votre QR d'inscription ou saisissez votre code retour à 4 chiffres."}
        </p>
      </div>
      <Link href="/" className="fs-btn fs-btn-ghost">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}

function PatientView({
  patient,
  phase,
  sms,
  destinationClinic,
}: {
  patient: Patient;
  phase: Phase;
  sms: { id: string; at: number; body: string }[];
  destinationClinic?: Clinic;
}) {
  if (phase === "activation") {
    return <ActivationView patient={patient} />;
  }

  const qrPayload = `filesante:${patient.id}:${patient.code}`;
  const closed = phase === "closed";

  const deadline =
    patient.status === "REGISTERED"
      ? patient.askConfirmAt
      : patient.status === "AWAITING_CONFIRMATION"
        ? patient.confirmDeadlineAt
        : patient.status === "AWAITING_CONFIRMATION_FINAL"
          ? patient.finalDeadlineAt
          : patient.status === "CONFIRMED"
            ? patient.arrivalDeadlineAt
            : null;

  const deadlineLabel =
    patient.status === "REGISTERED"
      ? "Demande de confirmation dans"
      : patient.status === "CONFIRMED"
        ? "Présentez-vous avant"
        : patient.status === "AWAITING_CONFIRMATION" ||
            patient.status === "AWAITING_CONFIRMATION_FINAL"
          ? "Vous avez encore"
          : "—";

  const hospital = HOSPITAL_INFO[patient.hospital];
  const dark = phase === "waiting" || phase === "soon" || phase === "depart";

  return (
    <div className="flex flex-col gap-6">
      {/* Status hero */}
      <section
        className={`relative overflow-hidden rounded-2xl border p-5 sm:p-8 backdrop-blur-md ${
          dark
            ? "border-white/20 bg-white/10 text-white"
            : "fs-dash-card"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div
              className={`fs-eyebrow mb-2 ${dark ? "text-white/80!" : ""}`}
            >
              {phase === "waiting" && "En attente — restez disponible"}
              {phase === "soon" && "Votre tour approche"}
              {phase === "depart" && "Partez maintenant"}
              {phase === "closed" && "Dossier fermé"}
            </div>
            <h1
              className={`fs-display-md ${dark ? "text-white!" : ""}`}
            >
              {patient.firstName} {patient.lastName}
            </h1>
            <p
              className={`mt-2 max-w-[480px] text-[14px] ${
                dark ? "text-white/85" : "text-(--ap-ink-muted-80)"
              }`}
            >
              {patient.motif}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={patient.status} />
              <span className="fs-chip">{patient.priority}</span>
              <span className="fs-chip">{patient.hospital}</span>
              {patient.contact === "CALL" && (
                <span className="fs-chip">
                  <Icon name="phoneOff" size={11} />
                  Appel
                </span>
              )}
            </div>
          </div>

          {!closed && deadline !== null && (
            <div
              className={`rounded-lg border px-4 py-3 sm:px-5 sm:py-4 sm:text-right ${
                dark
                  ? "border-white/30 bg-white/10"
                  : "border-[var(--ap-hairline-strong)] bg-[var(--ap-canvas-parchment)]"
              }`}
            >
              <div className={`fs-eyebrow ${dark ? "text-white/80!" : ""}`}>
                {deadlineLabel}
              </div>
              <div
                className={`mt-1.5 font-mono text-[28px] font-semibold leading-none tabular-nums ${
                  dark ? "text-white" : "text-[var(--ap-ink)]"
                }`}
              >
                <Countdown target={deadline} />
              </div>
            </div>
          )}
        </div>

        <StepRail status={patient.status} dark={dark} />
      </section>

      {/* DEPART action — big arrival button */}
      {phase === "depart" && (
        <section className="rounded-2xl border border-white/30 bg-white/15 p-6 text-center text-white backdrop-blur-md">
          <div className="fs-eyebrow text-white/85!">Action requise</div>
          <h2 className="fs-display-md mt-2 text-white!">
            Présentez-vous au triage retour
          </h2>
          <p className="mt-2 text-[14px] text-white/85">
            Code retour à présenter à l&apos;infirmière.
          </p>
          <div className="mt-5 font-mono text-[48px] font-semibold leading-none tracking-[0.08em] tabular-nums text-white">
            {patient.code}
          </div>
          <button
            type="button"
            onClick={() => markArrived(patient.id)}
            className="mt-6 flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[16px] font-semibold text-[#166534]"
          >
            <Icon name="checkCircle" size={18} />
            Je suis arrivé(e)
          </button>
          <p className="mt-3 text-[12px] text-white/80">
            Fenêtre de 30 min — sinon la place sera libérée.
          </p>
        </section>
      )}

      {/* SOON — preparation reminder */}
      {phase === "soon" && (
        <section className="rounded-2xl border border-white/30 bg-white/15 p-6 text-white backdrop-blur-md">
          <div className="fs-eyebrow text-white/85!">Préparez-vous</div>
          <h2 className="fs-tagline mt-1 text-white!">
            Documents à prévoir
          </h2>
          <ul className="mt-3 grid gap-2 text-[14px] sm:grid-cols-3">
            <DocCheck label="Carte RAMQ" />
            <DocCheck label="Pièce d'identité" />
            <DocCheck label="Médicaments actuels" />
          </ul>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/15 p-3 text-[13px]">
            <Icon name="warning" size={14} />
            <span>
              Aggravation des symptômes ? Composez 811 ou présentez-vous
              immédiatement à l&apos;urgence.
            </span>
          </div>
        </section>
      )}

      {/* Code + QR + Actions */}
      <section className="grid gap-6 md:grid-cols-[auto_1fr]">
        <div className="fs-dash-card flex flex-col items-center gap-4 p-6">
          <div className="fs-eyebrow">Votre code retour</div>
          <div className="font-mono text-[44px] font-semibold leading-none tracking-[0.08em] tabular-nums text-[var(--ap-ink)]">
            {patient.code}
          </div>
          {patient.contact === "SMS" && <QrCard value={qrPayload} size={156} />}
          <p className="text-center text-[12px] text-(--ap-ink-muted-80)">
            {patient.contact === "SMS"
              ? "Présentez ce code ou le QR au triage retour."
              : "Dictez ce code à l'infirmière au triage retour."}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {(patient.status === "AWAITING_CONFIRMATION" ||
            patient.status === "AWAITING_CONFIRMATION_FINAL") && (
            <ActionCard
              title="Confirmation requise"
              body="Pouvez-vous vous présenter au triage retour dans les 60 prochaines minutes ?"
              actions={
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => confirmPatient(patient.id)}
                    className="fs-btn fs-btn-primary flex-1"
                  >
                    Oui, je viens
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelPatient(patient.id)}
                    className="fs-btn fs-btn-danger flex-1"
                  >
                    Non, j&apos;annule
                  </button>
                </div>
              }
              tone="warn"
            />
          )}

          {patient.status === "REGISTERED" && (
            <ActionCard
              title="Vous êtes inscrit"
              body="Restez chez vous. Nous vous écrirons par SMS quand votre tour approchera."
              tone="info"
            />
          )}

          {patient.status === "CONFIRMED" && (
            <ActionCard
              title="Confirmé — venez maintenant"
              body="Présentez-vous au triage retour avec votre code avant la fin de la fenêtre."
              tone="success"
            />
          )}

          {closed && (
            <ActionCard
              title="Dossier fermé"
              body={
                patient.status === "ARRIVED" ||
                patient.status === "COMPLETED"
                  ? "Vous êtes arrivé au triage retour. Merci d'avoir utilisé FileSanté."
                  : "Votre place a été libérée. Composez 811 si vous souhaitez vous réinscrire."
              }
              tone="neutral"
            />
          )}

          {/* Destination — hospital + optional first-line clinic */}
          <div className="fs-dash-card p-6">
            <div className="fs-eyebrow mb-3">Où vous présenter</div>
            <div className="text-[14px] font-semibold text-[var(--ap-ink)]">
              {hospital.name}
            </div>
            <div className="mt-0.5 text-[12.5px] text-(--ap-ink-muted-80)">
              {hospital.address}
            </div>
            <div className="mt-1 font-mono text-[12.5px] tabular-nums text-(--ap-ink-muted-80)">
              {hospital.phone}
            </div>

            {destinationClinic && (
              <div className="mt-4 rounded-lg border border-[var(--ap-hairline)] bg-[var(--ap-canvas-parchment)] p-3">
                <div className="flex items-center gap-2">
                  <span className="fs-chip">{destinationClinic.type}</span>
                  <span className="text-[13px] font-semibold text-[var(--ap-ink)]">
                    {destinationClinic.name}
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-(--ap-ink-muted-80)">
                  Routage 811 — secteur {destinationClinic.sector}
                </div>
                <div className="mt-1 text-[12px] text-(--ap-ink-muted-48)">
                  Heures : {destinationClinic.hours} · ETA{" "}
                  {destinationClinic.eta}
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="fs-dash-card p-6">
            <div className="fs-eyebrow mb-3">Détails de votre demande</div>
            <dl className="grid grid-cols-2 gap-y-3 text-[13.5px]">
              <dt className="text-(--ap-ink-muted-80)">Priorité CTAS</dt>
              <dd className="text-right font-medium text-[var(--ap-ink)]">
                {patient.priority}
              </dd>
              <dt className="text-(--ap-ink-muted-80)">Origine</dt>
              <dd className="text-right font-medium text-[var(--ap-ink)]">
                {patient.origin === "DESK"
                  ? "Triage sur place"
                  : "811 / Domicile"}
              </dd>
              <dt className="text-(--ap-ink-muted-80)">Téléphone</dt>
              <dd className="text-right font-mono tabular-nums text-[var(--ap-ink)]">
                {patient.phone}
              </dd>
              <dt className="text-(--ap-ink-muted-80)">
                Méthode de contact
              </dt>
              <dd className="text-right font-medium text-[var(--ap-ink)]">
                {patient.contact === "SMS" ? "SMS" : "Appel"}
              </dd>
            </dl>
          </div>
        </div>
      </section>

      {/* SMS timeline */}
      <section className="fs-dash-card-flush">
        <div className="border-b border-[var(--ap-hairline)] px-6 py-4">
          <div className="fs-eyebrow">Notifications reçues</div>
          <h2 className="fs-tagline mt-1">
            {sms.length} message{sms.length === 1 ? "" : "s"}
          </h2>
        </div>
        {sms.length === 0 ? (
          <div className="px-6 py-10 text-center text-[13px] text-(--ap-ink-muted-80)">
            Aucune notification pour l&apos;instant.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--ap-hairline)]">
            {sms.map((m) => (
              <li key={m.id} className="flex items-start gap-3 px-6 py-4">
                <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-(--ap-surface-strong) text-(--ap-ink-muted-80)">
                  <Icon name="chat" size={14} />
                </div>
                <div className="flex-1 text-[13.5px]">
                  <p className="text-[var(--ap-ink)]">{m.body}</p>
                  <div className="mt-1 font-mono text-[11px] text-(--ap-ink-muted-48) tabular-nums">
                    {formatT(m.at)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ActivationView({ patient }: { patient: Patient }) {
  const [phone, setPhone] = useState(patient.phone);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidCanadianPhone(phone)) {
      setError("Format canadien requis: +1 514 555 0118 (10 chiffres)");
      return;
    }
    if (!agree) {
      setError("Vous devez accepter pour rejoindre la file");
      return;
    }
    setError(null);
    activatePatient(patient.id, phone.trim());
  }

  return (
    <div className="fs-dash-card flex flex-col items-center gap-5 p-5 sm:p-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-[rgba(30,144,214,0.1)] text-[var(--fs-primary)]">
        <Icon name="qr" size={26} />
      </div>
      <div>
        <h1 className="fs-display-md">Activez votre code</h1>
        <p className="mt-2 max-w-[420px] text-[14px] text-(--ap-ink-muted-80)">
          Confirmez votre numéro pour rejoindre la file FileSanté et recevoir
          les notifications.
        </p>
      </div>
      <form
        onSubmit={submit}
        className="flex w-full max-w-[420px] flex-col gap-3 text-left"
      >
        <label
          htmlFor="act-phone"
          className="fs-eyebrow inline-block"
        >
          Téléphone — format canadien (10 chiffres)
        </label>
        <Input
          id="act-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-12 font-mono text-[16px] tabular-nums"
        />
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--ap-hairline)] bg-[var(--ap-canvas-parchment)] p-3.5 text-[13.5px]">
          <Checkbox
            checked={agree}
            onCheckedChange={(v) => setAgree(v === true)}
            className="mt-0.5"
          />
          <span className="text-(--ap-ink-muted-80)">
            <b className="text-[var(--ap-ink)] font-semibold">Loi 25.</b>{" "}
            J&apos;autorise FileSanté à m&apos;envoyer des SMS pour mon
            orientation et confirmation d&apos;arrivée.
          </span>
        </label>
        {error && (
          <div className="rounded-lg border border-[#c8102e]/40 bg-[rgba(200,16,46,0.06)] px-3 py-2 text-[12.5px] text-[#c8102e]">
            {error}
          </div>
        )}
        <button type="submit" className="fs-btn fs-btn-primary mt-2">
          Confirmer et rejoindre la file
        </button>
      </form>
    </div>
  );
}

function DocCheck({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2">
      <Icon name="checkCircle" size={14} />
      <span>{label}</span>
    </li>
  );
}

function HelpBar({ phase }: { phase: Phase }) {
  const dark = phase === "waiting" || phase === "soon" || phase === "depart";
  const cardCls = dark
    ? "border-white/30 bg-white/10 text-white backdrop-blur-md"
    : "fs-dash-card";
  return (
    <section className="mt-8 grid gap-3 sm:grid-cols-2">
      <a
        href="tel:811"
        className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors ${cardCls}`}
      >
        <span
          className={`grid h-10 w-10 place-items-center rounded-full ${
            dark ? "bg-white/20" : "bg-[rgba(30,144,214,0.1)] text-[var(--fs-primary)]"
          }`}
        >
          <Icon name="chat" size={18} />
        </span>
        <div>
          <div className="text-[14px] font-semibold">Besoin d&apos;aide ? 811</div>
          <div className={`text-[12px] ${dark ? "text-white/75" : "text-(--ap-ink-muted-48)"}`}>
            Info-Santé · 24 h sur 24
          </div>
        </div>
      </a>
      <a
        href="tel:911"
        className={`flex items-center gap-3 rounded-2xl border p-4 transition-colors ${cardCls}`}
      >
        <span
          className={`grid h-10 w-10 place-items-center rounded-full ${
            dark ? "bg-white/20" : "bg-[rgba(200,16,46,0.1)] text-[#c8102e]"
          }`}
        >
          <Icon name="warning" size={18} />
        </span>
        <div>
          <div className="text-[14px] font-semibold">Urgence vitale ? 911</div>
          <div className={`text-[12px] ${dark ? "text-white/75" : "text-(--ap-ink-muted-48)"}`}>
            AVC, douleur thoracique, perte de conscience
          </div>
        </div>
      </a>
    </section>
  );
}

function StepRail({
  status,
  dark,
}: {
  status: PatientStatus;
  dark: boolean;
}) {
  const currentIdx = STEPS.findIndex((s) => s.key.includes(status));
  return (
    <ol className="mt-6 grid grid-cols-2 gap-2 sm:mt-8 sm:gap-3 sm:grid-cols-4">
      {STEPS.map((step, i) => {
        const done = currentIdx > i;
        const active = currentIdx === i;
        const base = dark
          ? active
            ? "border-white bg-white/20 text-white"
            : done
              ? "border-white/40 bg-white/10 text-white/90"
              : "border-white/20 bg-white/5 text-white/60"
          : active
            ? "border-[var(--ap-ink)] bg-[var(--ap-canvas)]"
            : done
              ? "border-[var(--ap-hairline-strong)] bg-[var(--ap-canvas-parchment)]"
              : "border-[var(--ap-hairline)] bg-[var(--ap-canvas)]";
        return (
          <li
            key={step.label}
            className={`rounded-lg border p-3 ${base}`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold ${
                  done || active
                    ? dark
                      ? "bg-white text-[var(--ap-ink)]"
                      : "bg-[var(--ap-ink)] text-white"
                    : dark
                      ? "bg-white/20 text-white/70"
                      : "bg-(--ap-surface-strong) text-(--ap-ink-muted-48)"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`text-[13px] font-semibold ${
                  dark
                    ? active || done
                      ? "text-white"
                      : "text-white/60"
                    : active || done
                      ? "text-[var(--ap-ink)]"
                      : "text-(--ap-ink-muted-48)"
                }`}
              >
                {step.label}
              </span>
            </div>
            <p
              className={`mt-1 ml-7 text-[11.5px] ${
                dark ? "text-white/75" : "text-(--ap-ink-muted-80)"
              }`}
            >
              {step.tag}
            </p>
          </li>
        );
      })}
    </ol>
  );
}

type ActionTone = "warn" | "info" | "success" | "neutral";

function ActionCard({
  title,
  body,
  actions,
  tone,
}: {
  title: string;
  body: string;
  actions?: React.ReactNode;
  tone: ActionTone;
}) {
  const toneClasses: Record<ActionTone, string> = {
    warn: "border-[#ffd789] bg-[#fff8e6]",
    info: "border-[rgba(30,144,214,0.3)] bg-[rgba(30,144,214,0.05)]",
    success: "border-[rgba(52,199,89,0.3)] bg-[rgba(52,199,89,0.06)]",
    neutral: "border-[var(--ap-hairline-strong)] bg-[var(--ap-canvas)]",
  };
  return (
    <div className={`rounded-lg border p-5 ${toneClasses[tone]}`}>
      <div className="fs-tagline text-[16px]!">{title}</div>
      <p className="mt-1.5 text-[13.5px] text-(--ap-ink-muted-80)">
        {body}
      </p>
      {actions && <div className="mt-4">{actions}</div>}
    </div>
  );
}

function formatT(simMs: number): string {
  const min = Math.floor(simMs / 60000);
  const sec = Math.floor((simMs % 60000) / 1000);
  return `T+${min}m${sec.toString().padStart(2, "0")}`;
}
