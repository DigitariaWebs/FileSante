"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Icon } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { isActive } from "@/lib/filesante/store";
import type { HospitalCode, Patient } from "@/lib/filesante/types";

const HOSPITALS: { code: HospitalCode | "ALL"; label: string }[] = [
  { code: "HMR", label: "HMR" },
  { code: "HND", label: "HND" },
  { code: "HSC", label: "HSC" },
  { code: "HGM", label: "HGM" },
  { code: "ALL", label: "Tous" },
];

const MIN = 60_000;
const THREE_HOURS = 180 * MIN;

export default function DirectionHome() {
  const s = useFileSante();
  const [hospital, setHospital] = useState<HospitalCode | "ALL">("HMR");

  const scope = useMemo(
    () =>
      hospital === "ALL"
        ? s.patients
        : s.patients.filter((p) => p.hospital === hospital),
    [s.patients, hospital],
  );

  const kpi = useMemo(() => {
    const total = scope.length;
    const active = scope.filter(isActive).length;
    const confirmed = scope.filter(
      (p) =>
        p.status === "CONFIRMED" ||
        p.status === "ARRIVED" ||
        p.status === "COMPLETED",
    ).length;
    const noShow = scope.filter((p) => p.status === "NO_SHOW").length;
    const cancelled = scope.filter(
      (p) =>
        p.status === "CANCELLED_BY_PATIENT" || p.status === "NO_RESPONSE",
    ).length;
    const arrivedWith = scope.filter(
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
              MIN,
          )
        : 0;
    const responseRate =
      total > 0
        ? Math.round(((total - cancelled - noShow) / total) * 100)
        : 0;
    const acceptanceRate =
      total > 0 ? Math.round((confirmed / total) * 100) : 0;
    return {
      total,
      active,
      confirmed,
      noShow,
      cancelled,
      avgWaitMin,
      responseRate,
      acceptanceRate,
    };
  }, [scope]);

  // Patients waiting > 3h, still active
  const overdue: Patient[] = useMemo(() => {
    const now = s.simClock;
    return scope
      .filter((p) => isActive(p) && now - p.registeredAt > THREE_HOURS)
      .sort((a, b) => a.registeredAt - b.registeredAt);
  }, [scope, s.simClock]);

  // Hourly registrations + arrivals series (12 buckets, 6 sim hours)
  const series = useMemo(() => {
    const buckets = 12;
    const now = s.simClock;
    const win = 6 * 60 * MIN;
    const inscriptions = new Array(buckets).fill(0);
    const arrivals = new Array(buckets).fill(0);
    for (const p of scope) {
      const d = now - p.registeredAt;
      if (d >= 0 && d <= win) {
        const i = Math.min(buckets - 1, Math.floor(((win - d) / win) * buckets));
        inscriptions[i] += 1;
      }
      if (p.arrivedAt !== null) {
        const da = now - p.arrivedAt;
        if (da >= 0 && da <= win) {
          const i = Math.min(
            buckets - 1,
            Math.floor(((win - da) / win) * buckets),
          );
          arrivals[i] += 1;
        }
      }
    }
    return { inscriptions, arrivals };
  }, [scope, s.simClock]);

  return (
    <>
      <PageHeader
        eyebrow="Direction · temps réel"
        title="Performance d'établissement"
        description="KPIs, alertes patients > 3 h et flux d'inscriptions."
        actions={
          <>
            <button
              type="button"
              onClick={() => window.print()}
              className="fs-btn fs-btn-ghost"
            >
              <Icon name="archive" size={14} />
              Rapport PDF
            </button>
            <Link href="/dashboard" className="fs-btn fs-btn-pearl">
              Changer de rôle
            </Link>
          </>
        }
      />

      <div className="flex flex-col gap-10 px-10 py-10">
        {/* Hospital selector */}
        <div className="fs-tabs">
          {HOSPITALS.map((h) => (
            <button
              key={h.code}
              type="button"
              data-active={hospital === h.code}
              onClick={() => setHospital(h.code)}
            >
              {h.label}
            </button>
          ))}
        </div>

        {/* KPI row */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Tile
            label="Inscrits cumulés"
            value={kpi.total}
            sub={`${kpi.active} actifs maintenant`}
            icon="archive"
            spark={series.inscriptions}
          />
          <Tile
            label="Taux d'acceptation"
            value={`${kpi.acceptanceRate}%`}
            sub="Patients ayant confirmé ou présentés"
            icon="checkCircle"
            tone="success"
          />
          <Tile
            label="Attente moyenne"
            value={`${kpi.avgWaitMin} min`}
            sub="Inscription → arrivée"
            icon="clock"
          />
          <Tile
            label="LWBS + No-show"
            value={kpi.noShow + s.lwbs}
            sub={`${kpi.noShow} no-show · ${s.lwbs} LWBS cumulés`}
            icon="warning"
            tone={kpi.noShow > 0 || s.lwbs > 0 ? "danger" : "neutral"}
          />
        </section>

        {/* Two-col: overdue alerts + hourly chart */}
        <section className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="fs-dash-card-flush">
            <div className="flex items-end justify-between border-b border-[var(--ap-hairline)] px-6 py-4">
              <div>
                <div className="fs-eyebrow">Alertes</div>
                <h2 className="fs-tagline mt-1">
                  Patients en attente {">"} 3 h
                </h2>
                <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
                  Risque LWBS — escalade recommandée.
                </p>
              </div>
              <span
                className={`fs-chip ${
                  overdue.length > 0 ? "" : "fs-chip-primary"
                }`}
                style={
                  overdue.length > 0
                    ? {
                        background: "rgba(200,16,46,0.08)",
                        color: "#c8102e",
                      }
                    : undefined
                }
              >
                {overdue.length}
              </span>
            </div>
            {overdue.length === 0 ? (
              <EmptyState
                icon={<Icon name="checkCircle" size={18} />}
                title="Aucune alerte"
                description="Aucun patient n'attend depuis plus de 3 heures."
              />
            ) : (
              <ul className="divide-y divide-[var(--ap-hairline)]">
                {overdue.map((p) => {
                  const waitMin = Math.floor(
                    (s.simClock - p.registeredAt) / MIN,
                  );
                  return (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 px-6 py-3.5"
                    >
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--ap-surface-strong)] text-[12px] font-semibold text-[var(--ap-ink-muted-80)]">
                        {p.firstName.charAt(0)}
                        {p.lastName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13.5px] font-semibold tracking-[-0.016em] text-[var(--ap-ink)]">
                            {p.firstName} {p.lastName}
                          </span>
                          <span className="fs-chip fs-chip-primary">
                            {p.priority}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11.5px] text-[var(--ap-ink-muted-48)]">
                          {p.motif}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[13px] font-semibold tabular-nums text-[#c8102e]">
                          {Math.floor(waitMin / 60)}h{(waitMin % 60)
                            .toString()
                            .padStart(2, "0")}
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="fs-dash-card p-6">
            <div className="flex items-end justify-between">
              <div>
                <div className="fs-eyebrow">Flux 6 dernières heures</div>
                <h2 className="fs-tagline mt-1">Inscriptions vs arrivées</h2>
              </div>
              <div className="flex items-center gap-3 text-[11.5px]">
                <span className="inline-flex items-center gap-1.5 text-[var(--ap-ink-muted-80)]">
                  <span className="h-2 w-2 rounded-full bg-[var(--fs-primary)]" />
                  Inscriptions
                </span>
                <span className="inline-flex items-center gap-1.5 text-[var(--ap-ink-muted-80)]">
                  <span className="h-2 w-2 rounded-full bg-[#34c759]" />
                  Arrivées
                </span>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4">
              <ChartRow
                label="Inscriptions"
                data={series.inscriptions}
                color="var(--fs-primary)"
                fill="rgba(30,144,214,0.12)"
              />
              <ChartRow
                label="Arrivées"
                data={series.arrivals}
                color="#34c759"
                fill="rgba(52,199,89,0.14)"
              />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[var(--ap-hairline)] pt-5">
              <Stat label="Total inscriptions" value={kpi.total} />
              <Stat label="Confirmés" value={kpi.confirmed} />
              <Stat label="Annulés" value={kpi.cancelled} />
            </div>
          </div>
        </section>

        {/* Capacity bar */}
        <section className="fs-dash-card p-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="fs-eyebrow">Capacité</div>
              <h2 className="fs-tagline mt-1">Civières · 20 lits</h2>
              <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
                Occupation actuelle simulée.
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-[28px] font-semibold leading-none tabular-nums text-[var(--ap-ink)]">
                14<span className="text-[var(--ap-ink-muted-48)]">/20</span>
              </div>
              <div className="text-[12px] text-[var(--ap-ink-muted-48)]">
                70% occupation
              </div>
            </div>
          </div>
          <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-[var(--ap-surface-strong)]">
            <div
              className="h-full bg-[var(--fs-primary)]"
              style={{ width: "70%" }}
            />
          </div>
        </section>
      </div>
    </>
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
  icon: Parameters<typeof Icon>[0]["name"];
  tone?: "success" | "warn" | "danger" | "neutral";
  spark?: number[];
}) {
  const toneCls = {
    success: "bg-[rgba(52,199,89,0.12)] text-[#1a6d2f]",
    warn: "bg-[rgba(255,159,10,0.12)] text-[#a06400]",
    danger: "bg-[rgba(200,16,46,0.1)] text-[#c8102e]",
    neutral: "bg-[var(--ap-surface-strong)] text-[var(--ap-ink-muted-80)]",
  }[tone ?? "neutral"];
  return (
    <div className="fs-stat-tile">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="fs-eyebrow">{label}</div>
          <div className="fs-display-md mt-3 leading-none tabular-nums">
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

function ChartRow({
  label,
  data,
  color,
  fill,
}: {
  label: string;
  data: number[];
  color: string;
  fill: string;
}) {
  const total = data.reduce((a, b) => a + b, 0);
  return (
    <div className="rounded-lg border border-[var(--ap-hairline)] bg-[var(--ap-canvas-parchment)] p-4">
      <div className="flex items-end justify-between">
        <div className="text-[12.5px] font-semibold text-[var(--ap-ink)]">
          {label}
        </div>
        <div className="font-mono text-[12px] tabular-nums text-[var(--ap-ink-muted-80)]">
          {total} total
        </div>
      </div>
      <div className="mt-3">
        <Sparkline
          data={data}
          width={520}
          height={64}
          stroke={color}
          fill={fill}
        />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[11.5px] uppercase tracking-[0.06em] text-[var(--ap-ink-muted-48)]">
        {label}
      </div>
      <div className="mt-1 font-mono text-[20px] font-semibold tabular-nums text-[var(--ap-ink)]">
        {value}
      </div>
    </div>
  );
}
