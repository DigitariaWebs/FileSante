"use client";

import { useMemo } from "react";

import { Countdown } from "@/components/dashboard/Countdown";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Topbar } from "@/components/dashboard/Topbar";
import { useFileSante } from "@/hooks/useFileSante";
import {
  cancelPatient,
  completePatient,
  confirmPatient,
  isActive,
} from "@/lib/filesante/store";
import type { Patient } from "@/lib/filesante/types";

export default function QueuePage() {
  const s = useFileSante();
  const { active, recent } = useMemo(() => {
    const sorted = [...s.patients].sort(
      (a, b) => a.estimatedSlotAt - b.estimatedSlotAt,
    );
    return {
      active: sorted.filter(isActive),
      recent: sorted
        .filter((p) => !isActive(p))
        .sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0))
        .slice(0, 8),
    };
  }, [s.patients]);

  return (
    <>
      <Topbar title="File d'attente · P4 / P5" />
      <div className="px-8 py-8">
        <div className="rounded-2xl border border-[var(--fs-line)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--fs-line)] px-6 py-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-[var(--fs-ink)]">
                Patients actifs
              </h2>
              <p className="text-xs text-[var(--fs-ink-3)]">
                {active.length} dans la file · tri par créneau estimé
              </p>
            </div>
          </div>

          {active.length === 0 ? (
            <Empty />
          ) : (
            <Table>
              <Thead
                cols={[
                  "Patient",
                  "Priorité",
                  "Code",
                  "Statut",
                  "Échéance",
                  "Téléphone",
                  "Actions",
                ]}
              />
              <tbody>
                {active.map((p) => (
                  <ActiveRow key={p.id} p={p} />
                ))}
              </tbody>
            </Table>
          )}
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--fs-line)] bg-white">
          <div className="border-b border-[var(--fs-line)] px-6 py-4">
            <h2 className="font-display text-lg font-semibold text-[var(--fs-ink)]">
              Récents · fermés
            </h2>
            <p className="text-xs text-[var(--fs-ink-3)]">
              Annulés, no-show, arrivés ou terminés
            </p>
          </div>
          {recent.length === 0 ? (
            <Empty label="Aucun dossier fermé pour l'instant." />
          ) : (
            <Table>
              <Thead
                cols={["Patient", "Priorité", "Code", "Statut", "Hôpital"]}
              />
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id} className="border-t border-[var(--fs-line)]">
                    <td className="px-6 py-3 text-sm font-medium text-[var(--fs-ink)]">
                      {p.firstName} {p.lastName}
                    </td>
                    <td className="px-6 py-3 text-sm">{p.priority}</td>
                    <td className="px-6 py-3 font-mono text-sm">{p.code}</td>
                    <td className="px-6 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-6 py-3 text-sm">{p.hospital}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>
      </div>
    </>
  );
}

function ActiveRow({ p }: { p: Patient }) {
  const deadlineTarget =
    p.status === "AWAITING_CONFIRMATION"
      ? p.confirmDeadlineAt
      : p.status === "AWAITING_CONFIRMATION_FINAL"
        ? p.finalDeadlineAt
        : p.status === "CONFIRMED"
          ? p.arrivalDeadlineAt
          : p.askConfirmAt;
  const deadlinePrefix =
    p.status === "REGISTERED"
      ? "Confirmation dans"
      : p.status === "CONFIRMED"
        ? "Arrivée avant"
        : "Réponse dans";

  return (
    <tr className="border-t border-[var(--fs-line)]">
      <td className="px-6 py-3">
        <div className="text-sm font-medium text-[var(--fs-ink)]">
          {p.firstName} {p.lastName}
        </div>
        <div className="text-xs text-[var(--fs-ink-3)]">{p.motif}</div>
      </td>
      <td className="px-6 py-3">
        <span className="inline-flex h-6 items-center rounded-full bg-[var(--fs-bg-soft)] px-2 text-xs font-semibold text-[var(--fs-primary-ink)]">
          {p.priority}
        </span>
      </td>
      <td className="px-6 py-3 font-mono text-sm font-semibold text-[var(--fs-primary)]">
        {p.code}
      </td>
      <td className="px-6 py-3">
        <StatusBadge status={p.status} />
      </td>
      <td className="px-6 py-3">
        <Countdown target={deadlineTarget} prefix={deadlinePrefix} />
      </td>
      <td className="px-6 py-3 text-sm text-[var(--fs-ink-2)]">
        {p.phone}
        <div className="text-xs text-[var(--fs-ink-3)]">{p.contact}</div>
      </td>
      <td className="px-6 py-3">
        <div className="flex gap-1.5">
          {(p.status === "AWAITING_CONFIRMATION" ||
            p.status === "AWAITING_CONFIRMATION_FINAL") && (
            <>
              <ActionBtn
                onClick={() => confirmPatient(p.id)}
                variant="primary"
              >
                OUI
              </ActionBtn>
              <ActionBtn onClick={() => cancelPatient(p.id)} variant="danger">
                NON
              </ActionBtn>
            </>
          )}
          {p.status === "REGISTERED" && (
            <ActionBtn onClick={() => cancelPatient(p.id)} variant="ghost">
              Annuler
            </ActionBtn>
          )}
          {p.status === "CONFIRMED" && (
            <ActionBtn
              onClick={() => completePatient(p.id)}
              variant="ghost"
              title="Marquer terminé sans passage à l'urgence"
            >
              Terminer
            </ActionBtn>
          )}
        </div>
      </td>
    </tr>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">{children}</table>
    </div>
  );
}

function Thead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="text-left text-[11px] font-semibold tracking-[0.06em] text-[var(--fs-ink-3)] uppercase">
        {cols.map((c) => (
          <th key={c} className="px-6 py-3">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Empty({ label }: { label?: string }) {
  return (
    <div className="px-6 py-10 text-center text-sm text-[var(--fs-ink-3)]">
      {label ?? "Aucun patient dans la file. Inscrivez un patient pour commencer."}
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  variant,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant: "primary" | "danger" | "ghost";
  title?: string;
}) {
  const cls =
    variant === "primary"
      ? "bg-[var(--fs-primary)] text-white hover:bg-[var(--fs-primary-2)]"
      : variant === "danger"
        ? "bg-red-50 text-red-700 hover:bg-red-100"
        : "bg-white text-[var(--fs-ink-2)] border border-[var(--fs-line)] hover:border-[var(--fs-primary)] hover:text-[var(--fs-primary)]";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`h-8 rounded-full px-3 text-xs font-semibold transition-colors ${cls}`}
    >
      {children}
    </button>
  );
}
