"use client";

import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { BarChart } from "@/components/ui/BarChart";
import { Icon } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { isActive } from "@/lib/filesante/store";
import type { HospitalCode } from "@/lib/filesante/types";

const MIN = 60_000;

const HOSPITALS: { code: HospitalCode; name: string; ciusss: string }[] = [
  { code: "HMR", name: "Maisonneuve-Rosemont", ciusss: "Est-de-l'Île" },
  { code: "HND", name: "Notre-Dame", ciusss: "Centre-Sud" },
  { code: "HSC", name: "Sacré-Cœur", ciusss: "Nord-de-l'Île" },
  { code: "HGM", name: "Général de Montréal", ciusss: "CUSM" },
];

type Trend = -1 | 0 | 1;

type Snapshot = Record<HospitalCode, number>;
const SNAPSHOT_KEY = "filesante.admin.snapshot.v1";

function readSnapshot(): Snapshot {
  if (typeof window === "undefined")
    return { HMR: 0, HND: 0, HSC: 0, HGM: 0 };
  try {
    const raw = window.sessionStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return { HMR: 0, HND: 0, HSC: 0, HGM: 0 };
    return JSON.parse(raw);
  } catch {
    return { HMR: 0, HND: 0, HSC: 0, HGM: 0 };
  }
}

function writeSnapshot(s: Snapshot) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export default function AdminPage() {
  const s = useFileSante();
  const [snapshot, setSnapshot] = useState<Snapshot>(() => ({
    HMR: 0,
    HND: 0,
    HSC: 0,
    HGM: 0,
  }));

  // Read snapshot on mount.
  useEffect(() => {
    setSnapshot(readSnapshot());
  }, []);

  const byHospital = useMemo(() => {
    return HOSPITALS.map((h) => {
      const scope = s.patients.filter((p) => p.hospital === h.code);
      const active = scope.filter(isActive).length;
      const arrived = scope.filter(
        (p) => p.status === "ARRIVED" || p.status === "COMPLETED",
      ).length;
      const lwbs = scope.filter(
        (p) =>
          p.status === "NO_SHOW" ||
          p.status === "NO_RESPONSE" ||
          p.status === "CANCELLED_BY_PATIENT",
      ).length;
      const arrivedWith = scope.filter(
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
      const civForHospital = s.civieres.filter(
        (c) => c.hospital === h.code && c.status !== "DISCHARGED",
      ).length;
      const civPct = Math.min(100, civForHospital * 5); // mock occupancy
      const trend: Trend =
        active > snapshot[h.code]
          ? 1
          : active < snapshot[h.code]
            ? -1
            : 0;
      const status = civPct > 85 || lwbs > 2 ? "alert" : civPct > 65 ? "warn" : "ok";
      return {
        ...h,
        active,
        arrived,
        lwbs,
        avgWait,
        civPct,
        trend,
        status,
      };
    });
  }, [s.patients, s.civieres, snapshot]);

  // Snapshot every 30s so trend chips have something to compare against.
  useEffect(() => {
    const id = window.setInterval(() => {
      const next: Snapshot = byHospital.reduce(
        (acc, h) => {
          acc[h.code] = h.active;
          return acc;
        },
        { HMR: 0, HND: 0, HSC: 0, HGM: 0 } as Snapshot,
      );
      writeSnapshot(next);
      setSnapshot(next);
    }, 30000);
    return () => window.clearInterval(id);
  }, [byHospital]);

  function refresh() {
    const next: Snapshot = byHospital.reduce(
      (acc, h) => {
        acc[h.code] = h.active;
        return acc;
      },
      { HMR: 0, HND: 0, HSC: 0, HGM: 0 } as Snapshot,
    );
    writeSnapshot(next);
    setSnapshot(next);
  }

  const global = useMemo(() => {
    const inQueue = byHospital.reduce((a, h) => a + h.active, 0);
    const returned = byHospital.reduce((a, h) => a + h.arrived, 0);
    const lwbs = byHospital.reduce((a, h) => a + h.lwbs, 0);
    const wavg = (() => {
      const arr = byHospital.filter((h) => h.avgWait > 0);
      if (arr.length === 0) return 0;
      return Math.round(arr.reduce((a, h) => a + h.avgWait, 0) / arr.length);
    })();
    const totalActiveCiv = s.civieres.filter((c) => c.status !== "DISCHARGED").length;
    const civPct = Math.min(100, Math.round((totalActiveCiv / 80) * 100));
    return { inQueue, returned, lwbs, wavg, civPct };
  }, [byHospital, s.civieres]);

  const hourly = useMemo(() => {
    const buckets = 12;
    const now = s.simClock;
    const win = 12 * 60 * MIN;
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

  const labels = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const h = (new Date().getHours() - (11 - i) + 24) % 24;
        return `${h.toString().padStart(2, "0")}h`;
      }),
    [],
  );

  return (
    <>
      <PageHeader
        eyebrow="Vue administration · tous hôpitaux"
        title="Tableau global"
        description="Consolidation temps réel des 4 hôpitaux pilotes."
        actions={
          <button
            type="button"
            onClick={refresh}
            className="fs-btn fs-btn-pearl"
          >
            <Icon name="refresh" size={14} />
            Rafraîchir
          </button>
        }
      />

      <div className="flex flex-col gap-10 px-10 py-10">
        {/* Global KPI strip */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <Tile
            label="File globale"
            value={global.inQueue}
            sub="Patients actifs · tous hôpitaux"
            icon="archive"
            tone="info"
          />
          <Tile
            label="Arrivés (session)"
            value={global.returned}
            sub="Patients vus en première ligne"
            icon="checkCircle"
            tone="success"
          />
          <Tile
            label="LWBS cumulés"
            value={global.lwbs}
            sub="No-show + non-réponses + annulations"
            icon="warning"
            tone={global.lwbs > 0 ? "danger" : "neutral"}
          />
          <Tile
            label="Attente moyenne"
            value={`${global.wavg} min`}
            sub="Inscription → arrivée · réseau"
            icon="clock"
            tone="neutral"
          />
          <Tile
            label="Civières actives"
            value={`${global.civPct}%`}
            sub="Occupation réseau (mock)"
            icon="taskList"
            tone={global.civPct > 85 ? "danger" : global.civPct > 65 ? "warn" : "neutral"}
          />
        </section>

        {/* Hospital cards */}
        <section className="grid gap-5 lg:grid-cols-2">
          {byHospital.map((h) => (
            <HospitalCard key={h.code} h={h} />
          ))}
        </section>

        {/* Hourly chart */}
        <section className="fs-dash-card p-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="fs-eyebrow">Inscriptions · 12 dernières heures</div>
              <h2 className="fs-tagline mt-1">Activité réseau</h2>
            </div>
            <div className="text-[12px] text-[var(--ap-ink-muted-48)]">
              Refresh 30 s · snapshot pour delta
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <BarChart
              labels={labels}
              series={[
                { label: "Inscriptions", color: "var(--fs-primary)", data: hourly },
              ]}
              width={720}
              height={200}
            />
          </div>
        </section>
      </div>
    </>
  );
}

function HospitalCard({
  h,
}: {
  h: {
    code: HospitalCode;
    name: string;
    ciusss: string;
    active: number;
    arrived: number;
    lwbs: number;
    avgWait: number;
    civPct: number;
    trend: Trend;
    status: string;
  };
}) {
  const statusColor =
    h.status === "alert" ? "#c8102e" : h.status === "warn" ? "#a06400" : "#1a6d2f";
  const trendChip =
    h.trend > 0 ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(200,16,46,0.1)] px-2 py-0.5 text-[11px] font-semibold text-[#c8102e]">
        ▲ +1
      </span>
    ) : h.trend < 0 ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(52,199,89,0.1)] px-2 py-0.5 text-[11px] font-semibold text-[#1a6d2f]">
        ▼ −1
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--ap-canvas-parchment)] px-2 py-0.5 text-[11px] font-semibold text-[var(--ap-ink-muted-80)]">
        ◦ stable
      </span>
    );
  return (
    <div className="fs-dash-card overflow-hidden p-0">
      <div className="h-1 w-full" style={{ background: statusColor }} />
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--ap-surface-strong)] text-[12px] font-semibold text-[var(--fs-primary)]">
              {h.code}
            </span>
            <div>
              <div className="text-[15px] font-semibold tracking-[-0.016em] text-[var(--ap-ink)]">
                {h.name}
              </div>
              <div className="text-[11.5px] text-[var(--ap-ink-muted-48)]">
                {h.ciusss}
              </div>
            </div>
          </div>
        </div>
        {trendChip}
      </div>
      <div className="grid grid-cols-3 gap-3 px-6 pb-5">
        <Stat label="En file" value={h.active} />
        <Stat label="Arrivés" value={h.arrived} />
        <Stat
          label="LWBS"
          value={h.lwbs}
          color={h.lwbs > 0 ? "#c8102e" : undefined}
        />
      </div>
      <div className="border-t border-[var(--ap-hairline)] px-6 py-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[var(--ap-ink-muted-48)]">
            Civière {h.civPct}%
          </span>
          <span className="font-mono tabular-nums text-[var(--ap-ink-muted-80)]">
            {h.avgWait > 0 ? `${h.avgWait} min attente` : "—"}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--ap-canvas-parchment)]">
          <div
            className="h-full rounded-full"
            style={{ width: `${h.civPct}%`, background: statusColor }}
          />
        </div>
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
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: Parameters<typeof Icon>[0]["name"];
  tone: "info" | "success" | "warn" | "danger" | "neutral";
}) {
  const cls = {
    info: "bg-[rgba(30,144,214,0.08)] text-[var(--fs-primary)]",
    success: "bg-[rgba(52,199,89,0.12)] text-[#1a6d2f]",
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
          <Icon name={icon} size={18} />
        </div>
      </div>
      <p className="mt-4 text-[12.5px] text-[var(--ap-ink-muted-80)]">{sub}</p>
    </div>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.06em] text-[var(--ap-ink-muted-48)]">
        {label}
      </div>
      <div
        className="mt-1 font-mono text-[20px] font-semibold tabular-nums"
        style={{ color: color ?? "var(--ap-ink)" }}
      >
        {value}
      </div>
    </div>
  );
}

