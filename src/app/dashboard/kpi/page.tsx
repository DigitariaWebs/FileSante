"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { isActive } from "@/lib/filesante/store";

type Tone = "info" | "success" | "warn" | "danger" | "neutral";

export default function KpiPage() {
  const s = useFileSante();

  const stats = useMemo(() => {
    const total = s.patients.length;
    const active = s.patients.filter(isActive).length;
    const noShow = s.patients.filter((p) => p.status === "NO_SHOW").length;
    const cancelled = s.patients.filter(
      (p) => p.status === "CANCELLED_BY_PATIENT",
    ).length;
    const noResp = s.patients.filter((p) => p.status === "NO_RESPONSE").length;
    const arrived = s.patients.filter(
      (p) => p.status === "ARRIVED" || p.status === "COMPLETED",
    ).length;
    const arrivedWith = s.patients.filter(
      (p) =>
        (p.status === "ARRIVED" || p.status === "COMPLETED") && p.arrivedAt,
    );
    const avgWaitMin =
      arrivedWith.length > 0
        ? Math.round(
            arrivedWith.reduce(
              (sum, p) => sum + (p.arrivedAt! - p.registeredAt),
              0,
            ) /
              arrivedWith.length /
              60000,
          )
        : 0;
    const responseRate =
      total > 0 ? Math.round(((total - noResp) / Math.max(total, 1)) * 100) : 0;
    return {
      total,
      active,
      noShow,
      cancelled,
      noResp,
      arrived,
      avgWaitMin,
      responseRate,
      lwbs: s.lwbs,
    };
  }, [s.patients, s.lwbs]);

  const series = useMemo(
    () => buildSeries(s.patients, s.simClock),
    [s.patients, s.simClock],
  );

  return (
    <>
      <PageHeader
        eyebrow="Pilotage"
        title="Indicateurs"
        description="Performance temps réel du pilote FileSanté."
      />

      <div className="flex flex-col gap-6 px-10 py-10">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Card
            label="Inscrits cumulés"
            value={stats.total}
            sub={`${stats.active} actifs`}
            icon="archive"
            tone="info"
            spark={series.inscriptions}
          />
          <Card
            label="Arrivés"
            value={stats.arrived}
            sub="ARRIVED ou COMPLETED"
            icon="checkCircle"
            tone="success"
            spark={series.arrivals}
          />
          <Card
            label="Taux de réponse"
            value={`${stats.responseRate}%`}
            sub="Réponses OUI ou NON reçues"
            icon="graphUp"
            tone="neutral"
          />
          <Card
            label="Attente moyenne"
            value={`${stats.avgWaitMin} min`}
            sub="Inscription → arrivée"
            icon="clock"
            tone="neutral"
          />
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Card
            label="LWBS"
            value={stats.lwbs}
            sub="Left Without Being Seen"
            icon="warning"
            tone={stats.lwbs > 0 ? "danger" : "neutral"}
          />
          <Card
            label="No-show"
            value={stats.noShow}
            sub="Confirmé · non présenté"
            icon="userMinus"
            tone="warn"
          />
          <Card
            label="Annulé · patient"
            value={stats.cancelled}
            sub="Réponse NON au SMS T-60"
            icon="timerOff"
            tone="neutral"
          />
          <Card
            label="Sans réponse"
            value={stats.noResp}
            sub="Aucun OUI/NON dans la fenêtre"
            icon="phoneOff"
            tone="neutral"
          />
        </section>

        <section className="fs-dash-card-flush">
          <div className="border-b border-[var(--ap-divider-soft)] px-6 py-5">
            <h2 className="fs-tagline text-[17px]!">Funnel · session courante</h2>
            <p className="fs-body mt-1 text-[var(--ap-ink-muted-48)]">
              Du triage initial à l&apos;arrivée à l&apos;urgence.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 px-6 py-6 md:grid-cols-5">
            <FunnelStep
              label="Inscrits"
              count={stats.total}
              of={stats.total || 1}
              tone="info"
            />
            <FunnelStep
              label="Confirmés"
              count={
                s.patients.filter(
                  (p) =>
                    p.status === "CONFIRMED" ||
                    p.status === "ARRIVED" ||
                    p.status === "COMPLETED",
                ).length
              }
              of={stats.total || 1}
              tone="info"
            />
            <FunnelStep
              label="Arrivés"
              count={stats.arrived}
              of={stats.total || 1}
              tone="info"
            />
            <FunnelStep
              label="No-show"
              count={stats.noShow}
              of={stats.total || 1}
              tone="neutral"
            />
            <FunnelStep
              label="Annulés"
              count={stats.cancelled + stats.noResp}
              of={stats.total || 1}
              tone="neutral"
            />
          </div>
        </section>
      </div>
    </>
  );
}

function Card({
  label,
  value,
  sub,
  icon,
  tone,
  spark,
}: {
  label: string;
  value: ReactNode;
  sub: string;
  icon: IconName;
  tone: Tone;
  spark?: number[];
}) {
  const chipCls: Record<Tone, string> = {
    info: "fs-icon-chip fs-icon-chip-info",
    success: "fs-icon-chip fs-icon-chip-success",
    warn: "fs-icon-chip fs-icon-chip-warn",
    danger: "fs-icon-chip fs-icon-chip-danger",
    neutral: "fs-icon-chip",
  };
  return (
    <div className="fs-stat-tile">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="fs-eyebrow">{label}</div>
          <div className="mt-3 font-[var(--ap-font-display)] text-[34px] leading-[1.07] font-semibold tracking-[-0.374px] tabular-nums text-[var(--ap-ink)]">
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

function FunnelStep({
  label,
  count,
  of,
  tone = "neutral",
}: {
  label: string;
  count: number;
  of: number;
  tone?: "info" | "neutral";
}) {
  const pct = of > 0 ? Math.round((count / of) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[12.5px] font-semibold text-[var(--ap-ink-muted-80)] tracking-[-0.016em]">
          {label}
        </span>
        <span className="font-mono text-[11.5px] tabular-nums text-[var(--ap-ink-muted-48)]">
          {pct}%
        </span>
      </div>
      <div className="mt-2 font-[var(--ap-font-display)] text-[28px] font-semibold tabular-nums tracking-[-0.374px] text-[var(--ap-ink)]">
        {count}
      </div>
      <div className="fs-funnel-track mt-2">
        <div
          className={`fs-funnel-fill ${tone === "info" ? "fs-funnel-fill-info" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

type Series = { inscriptions: number[]; arrivals: number[] };
function buildSeries(
  patients: { registeredAt: number; arrivedAt: number | null }[],
  now: number,
): Series {
  const buckets = 12;
  const window = 6 * 60 * 60 * 1000;
  const ins = new Array(buckets).fill(0);
  const arr = new Array(buckets).fill(0);
  for (const p of patients) {
    const d = now - p.registeredAt;
    if (d >= 0 && d <= window) {
      const i = Math.min(
        buckets - 1,
        Math.floor(((window - d) / window) * buckets),
      );
      ins[i] += 1;
    }
    if (p.arrivedAt !== null) {
      const da = now - p.arrivedAt;
      if (da >= 0 && da <= window) {
        const i = Math.min(
          buckets - 1,
          Math.floor(((window - da) / window) * buckets),
        );
        arr[i] += 1;
      }
    }
  }
  return { inscriptions: ins, arrivals: arr };
}
