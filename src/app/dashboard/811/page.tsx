"use client";

import Link from "next/link";
import { useMemo } from "react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { isActive } from "@/lib/filesante/store";
import type { Patient } from "@/lib/filesante/types";

const MIN = 60_000;

export default function HotlineHome() {
  const s = useFileSante();

  const calls = useMemo(
    () => s.patients.filter((p) => p.origin === "HOME_811"),
    [s.patients],
  );

  const kpi = useMemo(() => {
    const total = calls.length;
    const activeNow = calls.filter(isActive).length;
    const oriented = calls.filter(
      (p) =>
        p.status === "CONFIRMED" ||
        p.status === "ARRIVED" ||
        p.status === "COMPLETED",
    ).length;
    const refused = calls.filter(
      (p) =>
        p.status === "CANCELLED_BY_PATIENT" || p.status === "NO_RESPONSE",
    ).length;
    const avgWaitMin =
      calls.length > 0
        ? Math.round(
            calls.reduce(
              (sum, p) =>
                sum + (p.estimatedSlotAt - p.registeredAt) / MIN,
              0,
            ) / calls.length,
          )
        : 0;
    return { total, activeNow, oriented, refused, avgWaitMin };
  }, [calls]);

  const recent = useMemo(
    () =>
      [...calls]
        .sort((a, b) => b.registeredAt - a.registeredAt)
        .slice(0, 8),
    [calls],
  );

  const series = useMemo(() => {
    const buckets = 12;
    const now = s.simClock;
    const win = 6 * 60 * MIN;
    const arr = new Array(buckets).fill(0);
    for (const p of calls) {
      const d = now - p.registeredAt;
      if (d >= 0 && d <= win) {
        const i = Math.min(buckets - 1, Math.floor(((win - d) / win) * buckets));
        arr[i] += 1;
      }
    }
    return arr;
  }, [calls, s.simClock]);

  return (
    <>
      <PageHeader
        eyebrow="Info-Santé · 811"
        title="Orientation téléphonique"
        description="Triagez les patients non urgents et orientez vers la première ligne disponible."
        actions={
          <>
            <Link
              href="/dashboard/triage/register"
              className="fs-btn fs-btn-ghost"
            >
              <Icon name="taskList" size={14} />
              Voir la file
            </Link>
            <Link href="/dashboard/811/new" className="fs-btn fs-btn-primary">
              <Icon name="userPlus" size={14} />
              Nouvelle évaluation
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-10 px-10 py-10">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Tile
            label="Appels du quart"
            value={kpi.total}
            sub={`${kpi.activeNow} actifs · ${kpi.total - kpi.activeNow} fermés`}
            icon="chat"
            spark={series}
          />
          <Tile
            label="Orientés vers réseau"
            value={kpi.oriented}
            sub="Patient accepté ou présenté"
            icon="checkCircle"
            tone="success"
          />
          <Tile
            label="Refus / abandons"
            value={kpi.refused}
            sub="Annulés patient ou sans réponse"
            icon="phoneOff"
            tone={kpi.refused > 0 ? "danger" : "neutral"}
          />
          <Tile
            label="Attente moyenne"
            value={`${kpi.avgWaitMin} min`}
            sub="Du tri à la convocation"
            icon="clock"
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="fs-dash-card-flush">
            <div className="flex items-end justify-between border-b border-[var(--ap-hairline)] px-6 py-4">
              <div>
                <div className="fs-eyebrow">Appels récents</div>
                <h2 className="fs-tagline mt-1">Patients triés par téléphone</h2>
              </div>
              <Link
                href="/dashboard/811/calls"
                className="text-[12.5px] font-medium text-[var(--ap-text-link)] hover:underline"
              >
                Tous les appels →
              </Link>
            </div>
            {recent.length === 0 ? (
              <EmptyState
                icon={<Icon name="chat" size={20} />}
                title="Aucun appel"
                description="Les évaluations 811 apparaîtront ici dès qu'un patient sera trié."
              />
            ) : (
              <ul className="divide-y divide-[var(--ap-hairline)]">
                {recent.map((p) => (
                  <CallRow key={p.id} patient={p} now={s.simClock} />
                ))}
              </ul>
            )}
          </div>

          {/* Resource search panel */}
          <div className="fs-dash-card p-6">
            <div className="fs-eyebrow">Recherche ressource</div>
            <h2 className="fs-tagline mt-1">Première ligne disponible</h2>
            <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
              Algorithme mock — secteur + capacité.
            </p>

            <div className="mt-5 space-y-3">
              <ResourceRow type="GMF" name="GMF du Plateau" load={0.42} eta="11 min" />
              <ResourceRow
                type="CLSC"
                name="CLSC Hochelaga"
                load={0.71}
                eta="18 min"
              />
              <ResourceRow
                type="IPS"
                name="IPS Rosemont"
                load={0.55}
                eta="14 min"
              />
              <ResourceRow
                type="UMF"
                name="UMF Maisonneuve"
                load={0.89}
                eta="—"
                full
              />
              <ResourceRow type="GMF" name="GMF Verdun" load={0.31} eta="22 min" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function CallRow({ patient, now }: { patient: Patient; now: number }) {
  const minsAgo = Math.floor((now - patient.registeredAt) / MIN);
  return (
    <li className="flex items-center gap-4 px-6 py-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--ap-surface-strong)] text-[12px] font-semibold text-[var(--ap-ink-muted-80)]">
        {patient.firstName.charAt(0)}
        {patient.lastName.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold tracking-[-0.016em] text-[var(--ap-ink)]">
            {patient.firstName} {patient.lastName}
          </span>
          <span className="fs-chip fs-chip-primary">{patient.priority}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[12px] text-[var(--ap-ink-muted-80)]">
          <span className="font-mono tabular-nums">{patient.phone}</span>
          <span>·</span>
          <span className="truncate">{patient.motif}</span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <StatusBadge status={patient.status} />
        <span className="text-[11px] text-[var(--ap-ink-muted-48)]">
          {minsAgo} min · {patient.hospital}
        </span>
      </div>
    </li>
  );
}

function ResourceRow({
  type,
  name,
  load,
  eta,
  full,
}: {
  type: "GMF" | "CLSC" | "IPS" | "UMF";
  name: string;
  load: number;
  eta: string;
  full?: boolean;
}) {
  const pct = Math.round(load * 100);
  const barColor =
    load > 0.85 ? "#c8102e" : load > 0.6 ? "#ff9f0a" : "#34c759";
  return (
    <div
      className={`rounded-lg border p-3 ${
        full
          ? "border-[var(--ap-hairline)] bg-[var(--ap-canvas-parchment)] opacity-70"
          : "border-[var(--ap-hairline-strong)] bg-[var(--ap-canvas)]"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="fs-chip">{type}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13.5px] font-semibold tracking-[-0.016em] text-[var(--ap-ink)]">
            {name}
          </div>
          <div className="font-mono text-[11px] tabular-nums text-[var(--ap-ink-muted-48)]">
            {pct}% charge · ETA {eta}
          </div>
        </div>
        <button
          type="button"
          disabled={full}
          className={`fs-btn fs-btn-sm ${full ? "fs-btn-pearl" : "fs-btn-primary"}`}
        >
          {full ? "Plein" : "Router"}
        </button>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--ap-surface-strong)]">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  icon,
  tone,
  spark,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: IconName;
  tone?: "success" | "danger" | "neutral";
  spark?: number[];
}) {
  const toneCls = {
    success: "bg-[rgba(52,199,89,0.12)] text-[#1a6d2f]",
    danger: "bg-[rgba(200,16,46,0.1)] text-[#c8102e]",
    neutral: "bg-[var(--ap-surface-strong)] text-[var(--ap-ink-muted-80)]",
  }[tone ?? "neutral"];
  return (
    <div className="fs-stat-tile">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="fs-eyebrow">{label}</div>
          <div className="mt-3 font-display text-[32px] leading-none font-semibold tracking-[-0.84px] text-[var(--ap-ink)] tabular-nums">
            {value}
          </div>
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-md ${toneCls}`}>
          <Icon name={icon} size={18} />
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <p className="text-[12.5px] text-[var(--ap-ink-muted-80)]">{sub}</p>
        {spark && spark.length > 0 && (
          <Sparkline data={spark} width={92} height={28} />
        )}
      </div>
    </div>
  );
}
