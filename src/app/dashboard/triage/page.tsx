"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { CiviereAlertBar } from "@/components/dashboard/CiviereAlertBar";
import { PendingCallsBar } from "@/components/dashboard/PendingCallsBar";
import { Countdown } from "@/components/dashboard/Countdown";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { ShiftChangeModal } from "@/components/dashboard/ShiftChangeModal";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { StaffIndicator } from "@/components/dashboard/StaffIndicator";
import { SurgeModal } from "@/components/dashboard/SurgeModal";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { isActive } from "@/lib/filesante/store";
import type { HospitalCode, Patient } from "@/lib/filesante/types";

const HOSPITAL_BINDING_KEY = "filesante.triage.hospital";
const VALID_HOSPITALS: HospitalCode[] = ["HMR", "HND", "HSC", "HGM"];

function loadBoundHospital(): HospitalCode {
  if (typeof window === "undefined") return "HMR";
  try {
    const v = window.localStorage.getItem(HOSPITAL_BINDING_KEY);
    return v && (VALID_HOSPITALS as string[]).includes(v)
      ? (v as HospitalCode)
      : "HMR";
  } catch {
    return "HMR";
  }
}

export default function DashboardHome() {
  const s = useFileSante();
  const [surgeOpen, setSurgeOpen] = useState(false);
  const [shiftOpen, setShiftOpen] = useState(false);
  const [hospital, setHospital] = useState<HospitalCode>("HMR");

  useEffect(() => {
    setHospital(loadBoundHospital());
  }, []);

  const surgeMin = s.surgeByHospital[hospital]?.minutes ?? 0;

  const stats = useMemo(() => {
    const active = s.patients.filter(isActive);
    const awaiting = active.filter(
      (p) =>
        p.status === "AWAITING_CONFIRMATION" ||
        p.status === "AWAITING_CONFIRMATION_FINAL",
    );
    const confirmed = active.filter((p) => p.status === "CONFIRMED");
    const registered = active.filter((p) => p.status === "REGISTERED");
    const arrived24 = s.patients.filter(
      (p) => p.status === "ARRIVED" || p.status === "COMPLETED",
    ).length;
    return {
      active: active.length,
      awaiting: awaiting.length,
      confirmed: confirmed.length,
      registered: registered.length,
      arrived24,
    };
  }, [s.patients]);

  const toConfirm: Patient[] = useMemo(() => {
    return s.patients
      .filter(
        (p) =>
          p.status === "AWAITING_CONFIRMATION" ||
          p.status === "AWAITING_CONFIRMATION_FINAL",
      )
      .sort((a, b) => {
        const ta = a.confirmDeadlineAt ?? a.finalDeadlineAt ?? 0;
        const tb = b.confirmDeadlineAt ?? b.finalDeadlineAt ?? 0;
        return ta - tb;
      })
      .slice(0, 5);
  }, [s.patients]);

  const arriving: Patient[] = useMemo(() => {
    return s.patients
      .filter((p) => p.status === "CONFIRMED")
      .sort((a, b) => (a.arrivalDeadlineAt ?? 0) - (b.arrivalDeadlineAt ?? 0))
      .slice(0, 5);
  }, [s.patients]);

  const lastSms = useMemo(() => {
    const byId = new Map(s.patients.map((p) => [p.id, p]));
    return [...s.sms]
      .sort((a, b) => b.at - a.at)
      .slice(0, 6)
      .map((m) => ({ ...m, patient: byId.get(m.patientId) }));
  }, [s.sms, s.patients]);

  const activitySeries = useMemo(() => {
    if (s.patients.length === 0) return [] as number[];
    const buckets = 12;
    const now = s.simClock;
    const window = 6 * 60 * 60 * 1000;
    const arr = new Array(buckets).fill(0);
    for (const p of s.patients) {
      const delta = now - p.registeredAt;
      if (delta < 0 || delta > window) continue;
      const idx = Math.min(
        buckets - 1,
        Math.floor(((window - delta) / window) * buckets),
      );
      arr[idx] += 1;
    }
    return arr;
  }, [s.patients, s.simClock]);

  return (
    <>
      <PageHeader
        eyebrow="Pilotage · temps réel"
        title={`Bonjour, ${s.nurseShift.firstName}.`}
        description="État de la file FileSanté — patients P4 / P5 routés vers la première ligne."
        actions={
          <>
            <Link
              href="/dashboard/triage/register"
              className="fs-btn fs-btn-primary"
            >
              <Icon name="userPlus" size={14} />
              Inscrire un patient
            </Link>
            <button
              type="button"
              onClick={() => setShiftOpen(true)}
              className="fs-btn fs-btn-pearl"
              title="Changer de quart"
            >
              <Icon name="userPlus" size={14} />
              Changer quart
            </button>
            <button
              type="button"
              onClick={() => setSurgeOpen(true)}
              className={`fs-btn ${surgeMin > 0 ? "fs-btn-danger" : "fs-btn-pearl"}`}
              title="Mode surcharge"
            >
              <Icon name="warning" size={14} />
              {surgeMin > 0 ? `Surcharge +${surgeMin}` : "Surcharge"}
            </button>
            <Link
              href={`/dashboard/triage/report?hospital=${hospital}&nurse=${encodeURIComponent(
                `${s.nurseShift.firstName} ${s.nurseShift.lastName}`,
              )}`}
              className="fs-btn fs-btn-pearl"
            >
              <Icon name="archive" size={14} />
              Rapport de quart
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-10 px-10 py-10">
        <PendingCallsBar hospital={hospital} />
        <CiviereAlertBar />

        <section className="fs-dash-card p-6">
          <div className="flex flex-wrap items-center gap-5 border-b border-[var(--ap-divider-soft)] pb-5">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[rgba(30,144,214,0.1)] text-[var(--fs-primary)]">
              <Icon name="viewGrid" size={22} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="fs-eyebrow">Session en cours</div>
              <h2 className="fs-display-md mt-1 text-[20px]!">
                {hospital} · {s.nurseShift.firstName} {s.nurseShift.lastName}
              </h2>
            </div>
            {surgeMin > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#fff8e6] px-2.5 py-1 text-[12px] font-semibold text-[#a06400]">
                <Icon name="warning" size={12} />
                Surcharge +{surgeMin} min
              </span>
            )}
          </div>

          <div className="grid gap-5 pt-6 md:grid-cols-3">
            <StatTile
              label="Dans la file"
              value={stats.active}
              sub={`${stats.registered} inscrits · ${stats.confirmed} confirmés`}
              icon="archive"
              spark={activitySeries}
            />
            <StatTile
              label="À confirmer"
              value={stats.awaiting}
              sub="Réponse OUI / NON attendue"
              icon="bell"
              tone={stats.awaiting > 0 ? "warn" : "neutral"}
            />
            <StatTile
              label="Arrivés (session)"
              value={stats.arrived24}
              sub="Scannés au triage retour"
              icon="checkCircle"
              tone="success"
            />
          </div>
        </section>

        <StaffIndicator />

        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <Panel
            title="À confirmer maintenant"
            description="Réponse OUI / NON dans la fenêtre de 15 min."
            link={{ label: "Tout voir", href: "/dashboard/triage/queue?tab=awaiting" }}
          >
            {toConfirm.length === 0 ? (
              <EmptyState
                icon={<Icon name="alarm" size={20} />}
                title="Personne en attente"
                description="Les SMS T-60 partent automatiquement lorsque le créneau approche."
              />
            ) : (
              <ul className="divide-y divide-[var(--ap-divider-soft)]">
                {toConfirm.map((p) => (
                  <PatientRow
                    key={p.id}
                    patient={p}
                    target={p.confirmDeadlineAt ?? p.finalDeadlineAt}
                    prefix="Réponse dans"
                  />
                ))}
              </ul>
            )}
          </Panel>

          <Panel
            title="Arrivées imminentes"
            description="Confirmés · fenêtre d'arrivée de 60 min."
            link={{ label: "Tout voir", href: "/dashboard/triage/queue?tab=confirmed" }}
          >
            {arriving.length === 0 ? (
              <EmptyState
                icon={<Icon name="qr" size={20} />}
                title="Aucun patient confirmé"
                description="Les patients apparaîtront ici dès qu'ils répondront OUI."
              />
            ) : (
              <ul className="divide-y divide-[var(--ap-divider-soft)]">
                {arriving.map((p) => (
                  <PatientRow
                    key={p.id}
                    patient={p}
                    target={p.arrivalDeadlineAt}
                    prefix="Arrivée avant"
                  />
                ))}
              </ul>
            )}
          </Panel>
        </section>

        <Panel
          title="Activité récente"
          description="Notifications SMS générées par le routage."
          link={{ label: "Journal complet", href: "/dashboard/triage/sms" }}
        >
          {lastSms.length === 0 ? (
            <EmptyState
              icon={<Icon name="bell" size={20} />}
              title="Aucun SMS pour l'instant"
              description="Inscrivez un patient pour voir l'activité ici."
            />
          ) : (
            <ul className="divide-y divide-[var(--ap-divider-soft)]">
              {lastSms.map((m) => (
                <li key={m.id} className="flex items-start gap-4 px-6 py-4">
                  <div className="fs-icon-chip fs-icon-chip-info mt-0.5">
                    <Icon name="bell" size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-semibold tracking-[-0.016em] text-[var(--ap-ink)]">
                        {m.patient
                          ? `${m.patient.firstName} ${m.patient.lastName}`
                          : "Patient inconnu"}
                      </span>
                      {m.patient && (
                        <span className="font-mono text-[12px] tabular-nums text-[var(--ap-ink-muted-48)]">
                          {m.patient.phone}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[14px] text-[var(--ap-ink-muted-80)]">
                      {m.body}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[11.5px] text-[var(--ap-ink-muted-48)]">
                    {formatT(m.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <SurgeModal
        open={surgeOpen}
        current={surgeMin}
        hospital={hospital}
        onClose={() => setSurgeOpen(false)}
      />
      <ShiftChangeModal
        open={shiftOpen}
        current={s.nurseShift}
        hospital={hospital}
        onClose={() => setShiftOpen(false)}
      />
    </>
  );
}

type Tone = "info" | "warn" | "success" | "danger" | "neutral";

function StatTile({
  label,
  value,
  sub,
  icon,
  tone = "neutral",
  spark,
}: {
  label: string;
  value: number | string;
  sub: string;
  icon: IconName;
  tone?: Tone;
  spark?: number[];
}) {
  const chipCls: Record<Tone, string> = {
    info: "fs-icon-chip fs-icon-chip-info",
    warn: "fs-icon-chip fs-icon-chip-warn",
    success: "fs-icon-chip fs-icon-chip-success",
    danger: "fs-icon-chip fs-icon-chip-danger",
    neutral: "fs-icon-chip",
  };
  return (
    <div className="fs-stat-tile">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="fs-eyebrow">{label}</div>
          <div className="fs-display-lg mt-3 leading-[1.07] tabular-nums">
            {value}
          </div>
        </div>
        <div className={chipCls[tone]}>
          <Icon name={icon} size={16} />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-[13px] text-[var(--ap-ink-muted-48)]">{sub}</p>
        {spark && spark.length > 0 && (
          <Sparkline data={spark} width={92} height={28} />
        )}
      </div>
    </div>
  );
}

function Panel({
  title,
  description,
  link,
  children,
}: {
  title: string;
  description?: string;
  link?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <section className="fs-dash-card-flush">
      <div className="flex items-end justify-between border-b border-[var(--ap-divider-soft)] px-6 py-5">
        <div>
          <h2 className="fs-tagline text-[17px]!">{title}</h2>
          {description && (
            <p className="fs-body mt-1 text-[var(--ap-ink-muted-48)]">
              {description}
            </p>
          )}
        </div>
        {link && (
          <Link
            href={link.href}
            className="inline-flex items-center gap-1 text-[13px] font-normal text-[var(--fs-primary)] hover:underline"
          >
            {link.label}
            <Icon name="arrowRight" size={12} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function PatientRow({
  patient,
  target,
  prefix,
}: {
  patient: Patient;
  target: number | null;
  prefix: string;
}) {
  return (
    <li className="flex items-center gap-4 px-6 py-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--ap-canvas-parchment)] text-[12px] font-semibold text-[var(--ap-ink-muted-80)]">
        {patient.firstName.charAt(0)}
        {patient.lastName.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[15px] font-semibold tracking-[-0.016em] text-[var(--ap-ink)]">
            {patient.firstName} {patient.lastName}
          </span>
          <span className="fs-chip fs-chip-primary">{patient.priority}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[12.5px] text-[var(--ap-ink-muted-48)]">
          <span className="font-mono tabular-nums">{patient.code}</span>
          <span>·</span>
          <span className="truncate">{patient.motif}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <StatusBadge status={patient.status} />
        <Countdown target={target} prefix={prefix} />
      </div>
    </li>
  );
}

function formatT(simMs: number): string {
  const min = Math.floor(simMs / 60000);
  const sec = Math.floor((simMs % 60000) / 1000);
  return `T+${min}m${sec.toString().padStart(2, "0")}`;
}
