"use client";

import {
  CheckCircle2,
  Clock,
  Inbox,
  PhoneOff,
  TimerReset,
  TrendingUp,
  TriangleAlert,
  UserMinus,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { useFileSante } from "@/hooks/useFileSante";
import { isActive } from "@/lib/filesante/store";

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

  const series = useMemo(() => buildSeries(s.patients, s.simClock), [
    s.patients,
    s.simClock,
  ]);

  return (
    <>
      <PageHeader
        title="Indicateurs"
        description="Performance temps réel du pilote FileSanté."
      />

      <div className="flex flex-col gap-6 px-8 py-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card
            label="Inscrits cumulés"
            value={stats.total}
            sub={`${stats.active} actifs`}
            icon={<Inbox size={16} />}
            tone="primary"
            spark={series.inscriptions}
          />
          <Card
            label="Arrivés"
            value={stats.arrived}
            sub="ARRIVED ou COMPLETED"
            icon={<CheckCircle2 size={16} />}
            tone="success"
            spark={series.arrivals}
          />
          <Card
            label="Taux de réponse"
            value={`${stats.responseRate}%`}
            sub="Réponses OUI ou NON reçues"
            icon={<TrendingUp size={16} />}
            tone="neutral"
          />
          <Card
            label="Attente moyenne"
            value={`${stats.avgWaitMin} min`}
            sub="Inscription → arrivée"
            icon={<Clock size={16} />}
            tone="neutral"
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card
            label="LWBS"
            value={stats.lwbs}
            sub="Left Without Being Seen"
            icon={<TriangleAlert size={16} />}
            tone={stats.lwbs > 0 ? "danger" : "neutral"}
          />
          <Card
            label="No-show"
            value={stats.noShow}
            sub="Confirmé · non présenté"
            icon={<UserMinus size={16} />}
            tone="warning"
          />
          <Card
            label="Annulé · patient"
            value={stats.cancelled}
            sub="Réponse NON au SMS T-60"
            icon={<TimerReset size={16} />}
            tone="neutral"
          />
          <Card
            label="Sans réponse"
            value={stats.noResp}
            sub="Aucun OUI/NON dans la fenêtre"
            icon={<PhoneOff size={16} />}
            tone="neutral"
          />
        </section>

        <section className="fs-dash-card-flush">
          <div className="border-b border-[#eef2f6] px-5 py-4">
            <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-[#0c2535]">
              Funnel · session courante
            </h2>
            <p className="mt-0.5 text-[12px] text-[#7a8898]">
              Du triage initial à l&apos;arrivée à l&apos;urgence.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 px-5 py-5 md:grid-cols-5">
            <FunnelStep
              label="Inscrits"
              count={stats.total}
              of={stats.total || 1}
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
            />
            <FunnelStep
              label="Arrivés"
              count={stats.arrived}
              of={stats.total || 1}
            />
            <FunnelStep
              label="No-show"
              count={stats.noShow}
              of={stats.total || 1}
              tone="danger"
            />
            <FunnelStep
              label="Annulés"
              count={stats.cancelled + stats.noResp}
              of={stats.total || 1}
              tone="warning"
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
  icon: ReactNode;
  tone: "primary" | "success" | "warning" | "danger" | "neutral";
  spark?: number[];
}) {
  const toneCls = {
    primary: "text-[#1e90d6] bg-[#e8f3fb]",
    success: "text-[#0a6b39] bg-[#dcf2e6]",
    warning: "text-[#a06400] bg-[#fff4d6]",
    danger: "text-[#b91c1c] bg-[#fee2e2]",
    neutral: "text-[#536270] bg-[#eef2f6]",
  }[tone];
  return (
    <div className="fs-stat-tile">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold tracking-[0.08em] text-[#7a8898] uppercase">
            {label}
          </div>
          <div className="mt-2 font-display text-[28px] leading-none font-semibold tracking-[-0.02em] text-[#0c2535] tabular-nums">
            {value}
          </div>
        </div>
        <div className={`grid h-7 w-7 place-items-center rounded-md ${toneCls}`}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-[12px] text-[#7a8898]">{sub}</p>
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
  tone,
}: {
  label: string;
  count: number;
  of: number;
  tone?: "danger" | "warning";
}) {
  const pct = of > 0 ? Math.round((count / of) * 100) : 0;
  const barColor =
    tone === "danger" ? "#c83333" : tone === "warning" ? "#d99814" : "#1e90d6";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[12px] font-semibold text-[#536270]">{label}</span>
        <span className="font-mono text-[11.5px] text-[#7a8898] tabular-nums">
          {pct}%
        </span>
      </div>
      <div className="mt-2 font-display text-[22px] font-semibold tabular-nums text-[#0c2535]">
        {count}
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[#eef2f6]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: barColor }}
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
      const i = Math.min(buckets - 1, Math.floor(((window - d) / window) * buckets));
      ins[i] += 1;
    }
    if (p.arrivedAt !== null) {
      const da = now - p.arrivedAt;
      if (da >= 0 && da <= window) {
        const i = Math.min(buckets - 1, Math.floor(((window - da) / window) * buckets));
        arr[i] += 1;
      }
    }
  }
  return { inscriptions: ins, arrivals: arr };
}
