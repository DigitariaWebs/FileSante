"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { Countdown } from "@/components/dashboard/Countdown";
import { QrCard } from "@/components/dashboard/QrCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Icon } from "@/components/ui/Icon";
import { CLINICS, type Clinic } from "@/data/clinics";
import { useFileSante } from "@/hooks/useFileSante";
import { cancelPatient, confirmPatient } from "@/lib/filesante/store";
import type {
  HospitalCode,
  Patient,
  PatientStatus,
  Referral,
} from "@/lib/filesante/types";

const DEFAULT_CODE = "1875"; // Olivier Bélanger — AWAITING_CONFIRMATION

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
  const initialCode = (params.get("code") ?? DEFAULT_CODE).trim();
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

  // If 811 routed this patient to a first-line clinic, surface the most
  // recent accepted referral so the patient sees the actual destination.
  const acceptedReferral: Referral | undefined = useMemo(() => {
    if (!patient) return undefined;
    return s.referrals
      .filter(
        (r) => r.patientId === patient.id && r.status === "ACCEPTED",
      )
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

  return (
    <div className="mx-auto max-w-[920px] px-6 py-10">
      <form
        onSubmit={submitLookup}
        className="fs-dash-card mb-8 flex flex-col gap-3 p-5 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="code" className="fs-eyebrow mb-1.5 inline-block">
            Votre code retour à 4 chiffres
          </label>
          <input
            id="code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            inputMode="numeric"
            maxLength={4}
            placeholder="4218"
            className="fs-input font-mono text-center text-[22px] tracking-[0.32em] tabular-nums"
          />
        </div>
        <button type="submit" className="fs-btn fs-btn-primary">
          Consulter ma file
        </button>
      </form>

      {!patient ? (
        <NotFound code={activeCode} />
      ) : (
        <PatientView
          patient={patient}
          sms={sms}
          destinationClinic={destinationClinic}
        />
      )}

      <HelpBar />
    </div>
  );
}

function NotFound({ code }: { code: string }) {
  return (
    <div className="fs-dash-card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--ap-surface-strong)] text-[var(--ap-ink-muted-48)]">
        <Icon name="search" size={22} />
      </div>
      <div>
        <div className="fs-tagline">
          Aucun dossier pour le code {code || "—"}
        </div>
        <p className="mt-1 text-[14px] text-[var(--ap-ink-muted-80)]">
          Vérifiez votre SMS d&apos;inscription ou composez 811 pour vous
          réinscrire.
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
  sms,
  destinationClinic,
}: {
  patient: Patient;
  sms: { id: string; at: number; body: string }[];
  destinationClinic?: Clinic;
}) {
  const qrPayload = `filesante:${patient.id}:${patient.code}`;
  const closed =
    patient.status === "ARRIVED" ||
    patient.status === "COMPLETED" ||
    patient.status === "NO_SHOW" ||
    patient.status === "NO_RESPONSE" ||
    patient.status === "CANCELLED_BY_PATIENT";

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

  return (
    <div className="flex flex-col gap-6">
      {/* Status hero */}
      <section className="fs-dash-card relative overflow-hidden p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="fs-eyebrow mb-2">Bonjour</div>
            <h1 className="fs-display-md">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="mt-2 max-w-[480px] text-[14px] text-[var(--ap-ink-muted-80)]">
              {patient.motif}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <StatusBadge status={patient.status} />
              <span className="fs-chip">{patient.priority}</span>
              <span className="fs-chip">{patient.hospital}</span>
            </div>
          </div>

          {!closed && (
            <div className="rounded-lg border border-[var(--ap-hairline-strong)] bg-[var(--ap-canvas-parchment)] px-5 py-4 text-right">
              <div className="fs-eyebrow">{deadlineLabel}</div>
              <div className="mt-1.5 font-mono text-[28px] font-semibold leading-none tabular-nums text-[var(--ap-ink)]">
                <Countdown target={deadline} />
              </div>
            </div>
          )}
        </div>

        <StepRail status={patient.status} />
      </section>

      {/* Code + QR + Actions */}
      <section className="grid gap-6 md:grid-cols-[auto_1fr]">
        <div className="fs-dash-card flex flex-col items-center gap-4 p-6">
          <div className="fs-eyebrow">Votre code retour</div>
          <div className="font-mono text-[44px] font-semibold leading-none tracking-[0.08em] tabular-nums text-[var(--ap-ink)]">
            {patient.code}
          </div>
          <QrCard value={qrPayload} size={156} />
          <p className="text-center text-[12px] text-[var(--ap-ink-muted-80)]">
            Présentez ce code ou le QR au triage retour.
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
              body="Présentez-vous au triage retour avec votre code ou QR avant la fin de la fenêtre."
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
            <div className="mt-0.5 text-[12.5px] text-[var(--ap-ink-muted-80)]">
              {hospital.address}
            </div>
            <div className="mt-1 font-mono text-[12.5px] tabular-nums text-[var(--ap-ink-muted-80)]">
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
                <div className="mt-1 text-[12px] text-[var(--ap-ink-muted-80)]">
                  Routage 811 — secteur {destinationClinic.sector}
                </div>
                <div className="mt-1 text-[12px] text-[var(--ap-ink-muted-48)]">
                  Heures : {destinationClinic.hours} · ETA {destinationClinic.eta}
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="fs-dash-card p-6">
            <div className="fs-eyebrow mb-3">Détails de votre demande</div>
            <dl className="grid grid-cols-2 gap-y-3 text-[13.5px]">
              <dt className="text-[var(--ap-ink-muted-80)]">Priorité CTAS</dt>
              <dd className="text-right font-medium text-[var(--ap-ink)]">
                {patient.priority}
              </dd>
              <dt className="text-[var(--ap-ink-muted-80)]">Origine</dt>
              <dd className="text-right font-medium text-[var(--ap-ink)]">
                {patient.origin === "DESK"
                  ? "Triage sur place"
                  : "811 / Domicile"}
              </dd>
              <dt className="text-[var(--ap-ink-muted-80)]">Téléphone</dt>
              <dd className="text-right font-mono tabular-nums text-[var(--ap-ink)]">
                {patient.phone}
              </dd>
              <dt className="text-[var(--ap-ink-muted-80)]">
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
          <div className="px-6 py-10 text-center text-[13px] text-[var(--ap-ink-muted-80)]">
            Aucune notification pour l&apos;instant.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--ap-hairline)]">
            {sms.map((m) => (
              <li key={m.id} className="flex items-start gap-3 px-6 py-4">
                <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--ap-surface-strong)] text-[var(--ap-ink-muted-80)]">
                  <Icon name="chat" size={14} />
                </div>
                <div className="flex-1 text-[13.5px]">
                  <p className="text-[var(--ap-ink)]">{m.body}</p>
                  <div className="mt-1 font-mono text-[11px] text-[var(--ap-ink-muted-48)] tabular-nums">
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

function HelpBar() {
  return (
    <section className="mt-8 grid gap-3 sm:grid-cols-2">
      <a
        href="tel:811"
        className="fs-dash-card flex items-center gap-3 p-4 transition-colors hover:bg-[var(--ap-canvas-parchment)]"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[rgba(30,144,214,0.1)] text-[var(--fs-primary)]">
          <Icon name="chat" size={18} />
        </span>
        <div>
          <div className="text-[14px] font-semibold text-[var(--ap-ink)]">
            Besoin d&apos;aide ? Composez 811
          </div>
          <div className="text-[12px] text-[var(--ap-ink-muted-48)]">
            Info-Santé · 24 h sur 24, 7 jours sur 7
          </div>
        </div>
      </a>
      <a
        href="tel:911"
        className="fs-dash-card flex items-center gap-3 p-4 transition-colors hover:bg-[var(--ap-canvas-parchment)]"
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-[rgba(200,16,46,0.1)] text-[#c8102e]">
          <Icon name="warning" size={18} />
        </span>
        <div>
          <div className="text-[14px] font-semibold text-[var(--ap-ink)]">
            Urgence vitale ? Composez 911
          </div>
          <div className="text-[12px] text-[var(--ap-ink-muted-48)]">
            Douleur thoracique, AVC, perte de conscience…
          </div>
        </div>
      </a>
    </section>
  );
}

function StepRail({ status }: { status: PatientStatus }) {
  const currentIdx = STEPS.findIndex((s) => s.key.includes(status));
  return (
    <ol className="mt-8 grid gap-3 sm:grid-cols-4">
      {STEPS.map((step, i) => {
        const done = currentIdx > i;
        const active = currentIdx === i;
        return (
          <li
            key={step.label}
            className={`rounded-lg border p-3 ${
              active
                ? "border-[var(--ap-ink)] bg-[var(--ap-canvas)]"
                : done
                  ? "border-[var(--ap-hairline-strong)] bg-[var(--ap-canvas-parchment)]"
                  : "border-[var(--ap-hairline)] bg-[var(--ap-canvas)]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-semibold ${
                  done || active
                    ? "bg-[var(--ap-ink)] text-white"
                    : "bg-[var(--ap-surface-strong)] text-[var(--ap-ink-muted-48)]"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`text-[13px] font-semibold ${
                  active || done
                    ? "text-[var(--ap-ink)]"
                    : "text-[var(--ap-ink-muted-48)]"
                }`}
              >
                {step.label}
              </span>
            </div>
            <p className="mt-1 ml-7 text-[11.5px] text-[var(--ap-ink-muted-80)]">
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
      <p className="mt-1.5 text-[13.5px] text-[var(--ap-ink-muted-80)]">
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
