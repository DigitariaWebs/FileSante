"use client";

import { Check, Inbox, QrCode, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { Countdown } from "@/components/dashboard/Countdown";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { useFileSante } from "@/hooks/useFileSante";
import {
  cancelPatient,
  completePatient,
  confirmPatient,
  isActive,
} from "@/lib/filesante/store";
import type { Patient, PatientStatus } from "@/lib/filesante/types";

type TabKey = "all" | "registered" | "awaiting" | "confirmed" | "closed";

const TABS: {
  key: TabKey;
  label: string;
  statuses?: PatientStatus[];
  closed?: boolean;
}[] = [
  { key: "all", label: "Tous actifs" },
  { key: "registered", label: "Inscrits", statuses: ["REGISTERED"] },
  {
    key: "awaiting",
    label: "À confirmer",
    statuses: ["AWAITING_CONFIRMATION", "AWAITING_CONFIRMATION_FINAL"],
  },
  { key: "confirmed", label: "Confirmés", statuses: ["CONFIRMED"] },
  { key: "closed", label: "Fermés", closed: true },
];

export default function QueuePage() {
  return (
    <Suspense fallback={null}>
      <QueuePageInner />
    </Suspense>
  );
}

function QueuePageInner() {
  const s = useFileSante();
  const params = useSearchParams();
  const initialTab: TabKey = (() => {
    const t = params.get("tab");
    return t && TABS.some((x) => x.key === t) ? (t as TabKey) : "all";
  })();
  const [tab, setTab] = useState<TabKey>(initialTab);

  const counts = useMemo(() => {
    return TABS.reduce<Record<TabKey, number>>(
      (acc, t) => {
        acc[t.key] = filterPatients(s.patients, t).length;
        return acc;
      },
      { all: 0, registered: 0, awaiting: 0, confirmed: 0, closed: 0 },
    );
  }, [s.patients]);

  const list = useMemo(() => {
    const def = TABS.find((t) => t.key === tab)!;
    return filterPatients(s.patients, def);
  }, [s.patients, tab]);

  return (
    <>
      <PageHeader
        eyebrow="Opérations"
        title="File d'attente"
        description="Patients P4 / P5 routés via FileSanté."
        actions={
          <>
            <Link href="/dashboard/scan" className="fs-btn fs-btn-ghost">
              <QrCode size={14} strokeWidth={1.8} />
              Retour patient
            </Link>
            <Link href="/dashboard/register" className="fs-btn fs-btn-primary">
              <UserPlus size={14} strokeWidth={1.8} />
              Inscrire
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-6 px-10 py-8">
        <div className="fs-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              data-active={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span className="ml-1.5 text-[11px] text-[var(--ap-ink-muted-48)] tabular-nums">
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="fs-dash-card-flush">
          {list.length === 0 ? (
            <EmptyState
              icon={<Inbox size={20} strokeWidth={1.6} />}
              title="Aucun patient dans cette vue"
              description="Inscrivez un patient ou changez d'onglet."
              action={
                <Link
                  href="/dashboard/register"
                  className="fs-btn fs-btn-primary"
                >
                  <UserPlus size={14} strokeWidth={1.8} />
                  Nouvelle inscription
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="fs-dash-table">
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Priorité</th>
                    <th>Code</th>
                    <th>Statut</th>
                    <th>Échéance</th>
                    <th>Contact</th>
                    <th>Hôpital</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => (
                    <Row key={p.id} p={p} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function filterPatients(
  patients: Patient[],
  def: (typeof TABS)[number],
): Patient[] {
  const filtered = patients.filter((p) => {
    if (def.closed) return !isActive(p);
    if (def.statuses) return def.statuses.includes(p.status);
    return isActive(p);
  });
  return [...filtered].sort((a, b) => {
    if (def.closed) return (b.closedAt ?? 0) - (a.closedAt ?? 0);
    return a.estimatedSlotAt - b.estimatedSlotAt;
  });
}

function Row({ p }: { p: Patient }) {
  const deadlineTarget =
    p.status === "AWAITING_CONFIRMATION"
      ? p.confirmDeadlineAt
      : p.status === "AWAITING_CONFIRMATION_FINAL"
        ? p.finalDeadlineAt
        : p.status === "CONFIRMED"
          ? p.arrivalDeadlineAt
          : p.status === "REGISTERED"
            ? p.askConfirmAt
            : null;
  const deadlinePrefix =
    p.status === "REGISTERED"
      ? "Confirm. dans"
      : p.status === "CONFIRMED"
        ? "Arrivée avant"
        : p.status === "AWAITING_CONFIRMATION" ||
            p.status === "AWAITING_CONFIRMATION_FINAL"
          ? "Réponse dans"
          : "—";

  return (
    <tr>
      <td>
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--ap-canvas-parchment)] text-[12px] font-semibold text-[var(--ap-ink-muted-80)]">
            {p.firstName.charAt(0)}
            {p.lastName.charAt(0)}
          </div>
          <div>
            <div className="text-[14.5px] font-semibold text-[var(--ap-ink)] tracking-[-0.016em]">
              {p.firstName} {p.lastName}
            </div>
            <div className="text-[12.5px] text-[var(--ap-ink-muted-48)]">
              {p.motif}
            </div>
          </div>
        </div>
      </td>
      <td>
        <span className="fs-chip fs-chip-primary">{p.priority}</span>
      </td>
      <td>
        <span className="font-mono text-[14px] font-semibold tracking-[0.03em] text-[var(--fs-primary)] tabular-nums">
          {p.code}
        </span>
      </td>
      <td>
        <StatusBadge status={p.status} />
      </td>
      <td>
        {deadlineTarget !== null ? (
          <Countdown target={deadlineTarget} prefix={deadlinePrefix} />
        ) : (
          <span className="text-[var(--ap-ink-muted-48)]">—</span>
        )}
      </td>
      <td>
        <div className="font-mono text-[13px] text-[var(--ap-ink-muted-80)] tabular-nums">
          {p.phone}
        </div>
        <div className="text-[11px] text-[var(--ap-ink-muted-48)]">
          {p.contact}
        </div>
      </td>
      <td>
        <span className="text-[14px] font-medium text-[var(--ap-ink-muted-80)]">
          {p.hospital}
        </span>
      </td>
      <td className="text-right">
        <RowActions p={p} />
      </td>
    </tr>
  );
}

function RowActions({ p }: { p: Patient }) {
  if (
    p.status === "AWAITING_CONFIRMATION" ||
    p.status === "AWAITING_CONFIRMATION_FINAL"
  ) {
    return (
      <div className="inline-flex gap-1.5">
        <button
          type="button"
          onClick={() => confirmPatient(p.id)}
          className="fs-btn fs-btn-primary fs-btn-sm"
        >
          <Check size={13} strokeWidth={2} />
          OUI
        </button>
        <button
          type="button"
          onClick={() => cancelPatient(p.id)}
          className="fs-btn fs-btn-danger fs-btn-sm"
        >
          <X size={13} strokeWidth={2} />
          NON
        </button>
      </div>
    );
  }
  if (p.status === "REGISTERED") {
    return (
      <button
        type="button"
        onClick={() => cancelPatient(p.id)}
        className="fs-btn fs-btn-pearl fs-btn-sm"
      >
        Annuler
      </button>
    );
  }
  if (p.status === "CONFIRMED") {
    return (
      <button
        type="button"
        onClick={() => completePatient(p.id)}
        className="fs-btn fs-btn-pearl fs-btn-sm"
        title="Marquer terminé sans passage à l'urgence"
      >
        Terminer
      </button>
    );
  }
  return <span className="text-[var(--ap-ink-muted-48)]">—</span>;
}
