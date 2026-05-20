"use client";

import { useMemo } from "react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { BarChart } from "@/components/ui/BarChart";
import { Donut } from "@/components/ui/Donut";
import { Icon } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { isActive } from "@/lib/filesante/store";

const MIN = 60_000;
const HOUR = 60 * MIN;

export default function AnalyticsPage() {
  const s = useFileSante();

  const kpi = useMemo(() => {
    const total = s.patients.length;
    const arrived = s.patients.filter(
      (p) => p.status === "ARRIVED" || p.status === "COMPLETED",
    ).length;
    const noShow = s.patients.filter((p) => p.status === "NO_SHOW").length;
    const cancelled = s.patients.filter(
      (p) => p.status === "CANCELLED_BY_PATIENT" || p.status === "NO_RESPONSE",
    ).length;
    const active = s.patients.filter(isActive).length;
    const noShowRate = total > 0 ? Math.round((noShow / total) * 100) : 0;
    const arrivedWith = s.patients.filter(
      (p) =>
        (p.status === "ARRIVED" || p.status === "COMPLETED") && p.arrivedAt,
    );
    const avgWait =
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
    return { total, arrived, noShow, cancelled, active, noShowRate, avgWait };
  }, [s.patients]);

  const hourly = useMemo(() => {
    const buckets = 12;
    const now = s.simClock;
    const win = 12 * HOUR;
    const arr = new Array(buckets).fill(0);
    for (const p of s.patients) {
      const d = now - p.registeredAt;
      if (d >= 0 && d <= win) {
        const i = Math.min(buckets - 1, Math.floor(((win - d) / win) * buckets));
        arr[i] += 1;
      }
    }
    return arr;
  }, [s.patients, s.simClock]);

  const hourlyLabels = useMemo(() => {
    const realNow = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const h = (realNow.getHours() - (11 - i) + 24) % 24;
      return `${h.toString().padStart(2, "0")}h`;
    });
  }, []);

  const donutSlices = useMemo(
    () => [
      {
        label: "Arrivés",
        value: kpi.arrived,
        color: "#22c55e",
      },
      {
        label: "No-show",
        value: kpi.noShow,
        color: "#f59e0b",
      },
      {
        label: "Annulés / No-resp",
        value: kpi.cancelled,
        color: "#c8102e",
      },
      {
        label: "En cours",
        value: kpi.active,
        color: "var(--fs-primary)",
      },
    ],
    [kpi],
  );

  const history = useMemo(() => {
    // 7-day rolling history (derived from sim sessions — for demo we project
    // current numbers backward with deterministic variance).
    const today = {
      registered: kpi.total,
      arrived: kpi.arrived,
      noShow: kpi.noShow,
      avgWait: kpi.avgWait,
    };
    const baseDate = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const drift = i === 0 ? 0 : Math.sin(i * 0.9) * 0.18 + i * 0.04;
      const regs = Math.max(2, Math.round(today.registered * (1 - drift)));
      const arr = Math.max(1, Math.round(today.arrived * (1 - drift * 0.6)));
      const ns = Math.max(0, Math.round(today.noShow * (1 + drift * 0.4)));
      const avg = Math.max(20, Math.round(today.avgWait * (1 + drift * 0.2)));
      return {
        date: d,
        registered: regs,
        arrived: arr,
        noShow: ns,
        avgWait: avg,
        returnRate: regs > 0 ? Math.round((arr / regs) * 100) : 0,
        noShowRate: regs > 0 ? Math.round((ns / regs) * 100) : 0,
        peakHour: `${(8 + (i % 6)).toString().padStart(2, "0")}h`,
      };
    });
  }, [kpi]);

  return (
    <>
      <PageHeader
        eyebrow="Analytique · 12 dernières heures"
        title="Performance du triage"
        description="Distribution horaire, taux de retour, no-show et historique 7 jours."
        actions={
          <button
            type="button"
            onClick={() => window.print()}
            className="fs-btn fs-btn-pearl"
          >
            <Icon name="archive" size={14} />
            Exporter PDF
          </button>
        }
      />

      <div className="flex flex-col gap-10 px-10 py-10">
        {/* KPI strip */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Tile
            label="Patients traités"
            value={kpi.arrived}
            sub="Confirmés + arrivés"
            tone="info"
          />
          <Tile
            label="Attente moyenne"
            value={`${kpi.avgWait} min`}
            sub="Inscription → arrivée"
            tone="neutral"
          />
          <Tile
            label="Taux no-show"
            value={`${kpi.noShowRate}%`}
            sub={`${kpi.noShow} no-show sur ${kpi.total} inscrits`}
            tone={kpi.noShowRate > 10 ? "warn" : "neutral"}
          />
          <Tile
            label="Total inscrits"
            value={kpi.total}
            sub={`${kpi.active} actifs maintenant`}
            tone="neutral"
          />
        </section>

        {/* Charts row */}
        <section className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="fs-dash-card p-6">
            <div className="fs-eyebrow">Inscriptions horaires</div>
            <h2 className="fs-tagline mt-1">Distribution sur 12 h</h2>
            <div className="mt-5 overflow-x-auto">
              <BarChart
                labels={hourlyLabels}
                series={[
                  {
                    label: "Inscriptions",
                    color: "var(--fs-primary)",
                    data: hourly,
                  },
                ]}
                width={640}
                height={220}
              />
            </div>
          </div>
          <div className="fs-dash-card p-6">
            <div className="fs-eyebrow">Distribution des statuts</div>
            <h2 className="fs-tagline mt-1">Issue des patients</h2>
            <div className="mt-5">
              <Donut slices={donutSlices} size={170} thickness={20} />
            </div>
          </div>
        </section>

        {/* 7-day history table */}
        <section className="fs-dash-card-flush">
          <div className="border-b border-[var(--ap-hairline)] px-6 py-4">
            <div className="fs-eyebrow">Historique · 7 derniers jours</div>
            <h2 className="fs-tagline mt-1">Tendance hebdomadaire</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="fs-dash-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Inscrits</th>
                  <th>Arrivés</th>
                  <th>No-show</th>
                  <th>Taux retour</th>
                  <th>Taux no-show</th>
                  <th>Attente moy.</th>
                  <th>Pointe</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row, i) => (
                  <tr key={i}>
                    <td className="font-medium text-[var(--ap-ink)]">
                      {row.date.toLocaleDateString("fr-CA", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })}
                      {i === 0 && (
                        <span className="ml-2 fs-chip fs-chip-primary">
                          aujourd&apos;hui
                        </span>
                      )}
                    </td>
                    <td className="font-mono tabular-nums">{row.registered}</td>
                    <td className="font-mono tabular-nums">{row.arrived}</td>
                    <td
                      className={`font-mono tabular-nums ${
                        row.noShow > 0 ? "text-[#c8102e]" : ""
                      }`}
                    >
                      {row.noShow}
                    </td>
                    <td className="font-mono tabular-nums">{row.returnRate}%</td>
                    <td
                      className={`font-mono tabular-nums ${
                        row.noShowRate > 10 ? "text-[#a06400]" : ""
                      }`}
                    >
                      {row.noShowRate}%
                    </td>
                    <td className="font-mono tabular-nums">{row.avgWait} min</td>
                    <td className="font-mono tabular-nums">{row.peakHour}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  tone,
}: {
  label: string;
  value: string | number;
  sub: string;
  tone: "info" | "warn" | "neutral";
}) {
  const cls = {
    info: "bg-[rgba(30,144,214,0.08)] text-[var(--fs-primary)]",
    warn: "bg-[rgba(255,159,10,0.16)] text-[#a06400]",
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
          <Icon name="graphUp" size={18} />
        </div>
      </div>
      <p className="mt-4 text-[12.5px] text-[var(--ap-ink-muted-80)]">{sub}</p>
    </div>
  );
}
