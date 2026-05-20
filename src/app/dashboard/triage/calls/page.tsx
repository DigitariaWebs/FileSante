"use client";

import { useMemo } from "react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Icon } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { confirmPatient, isActive } from "@/lib/filesante/store";
import type { Patient } from "@/lib/filesante/types";

const MIN = 60_000;
const URGENT_THRESHOLD = 180 * MIN; // 3h wait

export default function CallsPage() {
  const s = useFileSante();

  const callList: Patient[] = useMemo(() => {
    return s.patients
      .filter((p) => p.contact === "CALL" && isActive(p))
      .sort((a, b) => a.registeredAt - b.registeredAt);
  }, [s.patients]);

  const urgent = useMemo(
    () => callList.filter((p) => s.simClock - p.registeredAt > URGENT_THRESHOLD),
    [callList, s.simClock],
  );

  return (
    <>
      <PageHeader
        eyebrow="Opérations · contact téléphonique"
        title="Rappels par téléphone"
        description="Patients inscrits en mode Appel — code dicté par l'infirmière. Priorité aux attentes &gt; 3h."
      />

      <div className="flex flex-col gap-6 px-10 py-8">
        <section className="grid gap-5 md:grid-cols-3">
          <Tile
            label="En mode appel"
            value={callList.length}
            sub="Tous patients actifs · contact téléphone"
            tone="info"
          />
          <Tile
            label="Attente > 3h"
            value={urgent.length}
            sub="À rappeler en priorité"
            tone={urgent.length > 0 ? "danger" : "neutral"}
          />
          <Tile
            label="LWBS cumulés"
            value={s.lwbs}
            sub="Patients perdus dans le système"
            tone={s.lwbs > 0 ? "warn" : "neutral"}
          />
        </section>

        {urgent.length > 0 && (
          <section className="fs-dash-card-flush">
            <div className="border-b border-[var(--ap-hairline)] bg-[rgba(200,16,46,0.04)] px-6 py-4">
              <div className="fs-eyebrow text-[#c8102e]">Urgent</div>
              <h2 className="fs-tagline mt-1">
                {urgent.length} patient{urgent.length === 1 ? "" : "s"} en
                attente &gt; 3 h
              </h2>
              <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
                Risque LWBS — rappelez maintenant pour confirmer ou libérer la
                place.
              </p>
            </div>
            <ul className="divide-y divide-[var(--ap-hairline)]">
              {urgent.map((p) => (
                <CallRow key={p.id} p={p} simClock={s.simClock} urgent />
              ))}
            </ul>
          </section>
        )}

        <section className="fs-dash-card-flush">
          <div className="border-b border-[var(--ap-hairline)] px-6 py-4">
            <div className="fs-eyebrow">Tous les rappels</div>
            <h2 className="fs-tagline mt-1">
              {callList.length} patient{callList.length === 1 ? "" : "s"}
            </h2>
          </div>
          {callList.length === 0 ? (
            <EmptyState
              icon={<Icon name="phoneOff" size={20} />}
              title="Aucun patient en mode appel"
              description="Les patients inscrits en mode SMS apparaissent dans la file standard."
            />
          ) : (
            <ul className="divide-y divide-[var(--ap-hairline)]">
              {callList.map((p) => (
                <CallRow key={p.id} p={p} simClock={s.simClock} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function CallRow({
  p,
  simClock,
  urgent,
}: {
  p: Patient;
  simClock: number;
  urgent?: boolean;
}) {
  const waitMin = Math.max(0, Math.floor((simClock - p.registeredAt) / MIN));
  const phoneClean = p.phone.replace(/[^+\d]/g, "");
  return (
    <li className="flex items-center gap-4 px-6 py-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--ap-canvas-parchment)] text-[12px] font-semibold text-[var(--ap-ink-muted-80)]">
        {p.firstName.charAt(0)}
        {p.lastName.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14.5px] font-semibold text-[var(--ap-ink)]">
            {p.firstName} {p.lastName}
          </span>
          <span className="fs-chip fs-chip-primary">{p.priority}</span>
          <StatusBadge status={p.status} />
        </div>
        <div className="mt-0.5 truncate text-[12.5px] text-[var(--ap-ink-muted-48)]">
          {p.motif} · code{" "}
          <span className="font-mono font-semibold text-[var(--fs-primary)]">
            {p.code}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span
          className={`font-mono text-[13.5px] font-semibold tabular-nums ${
            urgent ? "text-[#c8102e]" : "text-[var(--ap-ink-muted-80)]"
          }`}
        >
          {Math.floor(waitMin / 60)}h{(waitMin % 60).toString().padStart(2, "0")}
        </span>
        <div className="inline-flex gap-1.5">
          <a
            href={`tel:${phoneClean}`}
            className="fs-btn fs-btn-primary fs-btn-sm"
          >
            <Icon name="chat" size={12} />
            Rappeler
          </a>
          {(p.status === "AWAITING_CONFIRMATION" ||
            p.status === "AWAITING_CONFIRMATION_FINAL") && (
            <button
              type="button"
              onClick={() => confirmPatient(p.id)}
              className="fs-btn fs-btn-pearl fs-btn-sm"
              title="Marquer comme confirmé après appel"
            >
              <Icon name="check" size={12} strokeWidth={2} />
              Confirmé
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function Tile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number;
  sub: string;
  tone: "info" | "warn" | "danger" | "neutral";
}) {
  const cls = {
    info: "bg-[rgba(30,144,214,0.08)] text-[var(--fs-primary)]",
    warn: "bg-[rgba(255,159,10,0.16)] text-[#a06400]",
    danger: "bg-[rgba(200,16,46,0.1)] text-[#c8102e]",
    neutral: "bg-[var(--ap-surface-strong)] text-[var(--ap-ink-muted-80)]",
  }[tone];
  return (
    <div className="fs-stat-tile">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="fs-eyebrow">{label}</div>
          <div className="fs-display-md mt-3 leading-none tabular-nums">
            {value}
          </div>
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-md ${cls}`}>
          <Icon name="phoneOff" size={18} />
        </div>
      </div>
      <p className="mt-4 text-[12.5px] text-[var(--ap-ink-muted-80)]">{sub}</p>
    </div>
  );
}
