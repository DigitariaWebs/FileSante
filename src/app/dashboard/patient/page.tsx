"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { Countdown } from "@/components/dashboard/Countdown";
import { QrCard } from "@/components/dashboard/QrCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useFileSante } from "@/hooks/useFileSante";
import { cancelPatient, confirmPatient } from "@/lib/filesante/store";
import type { Patient, PatientStatus } from "@/lib/filesante/types";

const DEFAULT_CODE = "1875"; // Olivier Bélanger — AWAITING_CONFIRMATION

const STEPS: { key: PatientStatus[]; label: string; tag: string }[] = [
  { key: ["REGISTERED"], label: "Inscrit", tag: "Domicile" },
  {
    key: ["AWAITING_CONFIRMATION", "AWAITING_CONFIRMATION_FINAL"],
    label: "Confirmation",
    tag: "Répondez OUI / NON",
  },
  { key: ["CONFIRMED"], label: "Confirmé", tag: "Fenêtre 60 min" },
  { key: ["ARRIVED", "COMPLETED"], label: "Arrivé", tag: "Triage retour" },
];

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
          <label
            htmlFor="code"
            className="fs-eyebrow mb-1.5 inline-block"
          >
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
        <PatientView patient={patient} sms={sms} />
      )}
    </div>
  );
}

function NotFound({ code }: { code: string }) {
  return (
    <div className="fs-dash-card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--ap-surface-strong)] text-[var(--ap-ink-muted-48)]">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <div>
        <div className="fs-tagline">Aucun dossier pour le code {code || "—"}</div>
        <p className="mt-1 text-[14px] text-[var(--ap-ink-muted-80)]">
          Vérifiez votre SMS d&apos;inscription ou contactez Info-Santé 811.
        </p>
      </div>
      <Link href="/dashboard" className="fs-btn fs-btn-ghost">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}

function PatientView({
  patient,
  sms,
}: {
  patient: Patient;
  sms: { id: string; at: number; body: string }[];
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

          {/* Itinerary */}
          <div className="fs-dash-card p-6">
            <div className="fs-eyebrow mb-3">Détails de votre demande</div>
            <dl className="grid grid-cols-2 gap-y-3 text-[13.5px]">
              <dt className="text-[var(--ap-ink-muted-80)]">Hôpital</dt>
              <dd className="text-right font-medium text-[var(--ap-ink)]">
                {patient.hospital}
              </dd>
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
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
                  </svg>
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
                  done
                    ? "bg-[var(--ap-ink)] text-white"
                    : active
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
    <div
      className={`rounded-lg border p-5 ${toneClasses[tone]}`}
    >
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
