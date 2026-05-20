"use client";

import { useMemo, useState } from "react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
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

type SortKey =
  | "total"
  | "active"
  | "arrived"
  | "noShow"
  | "avgWait"
  | "responseRate";

export default function MsssHospitals() {
  const s = useFileSante();
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const rows = useMemo(() => {
    return HOSPITALS.map((h) => {
      const scope = s.patients.filter((p) => p.hospital === h.code);
      const active = scope.filter(isActive).length;
      const arrived = scope.filter(
        (p) => p.status === "ARRIVED" || p.status === "COMPLETED",
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
      const responseRate =
        scope.length > 0
          ? Math.round(
              ((scope.length - cancelled - noShow) / scope.length) * 100,
            )
          : 0;
      const trend = bucketSeries(scope, s.simClock);
      return {
        ...h,
        total: scope.length,
        active,
        arrived,
        noShow,
        cancelled,
        avgWait,
        responseRate,
        trend,
      };
    });
  }, [s.patients, s.simClock]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = term
      ? rows.filter(
          (r) =>
            r.code.toLowerCase().includes(term) ||
            r.name.toLowerCase().includes(term) ||
            r.ciusss.toLowerCase().includes(term),
        )
      : rows;
    return [...list].sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      return ((a[sortKey] as number) - (b[sortKey] as number)) * mul;
    });
  }, [rows, q, sortKey, sortDir]);

  function clickSort(k: SortKey) {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir("desc");
    }
  }

  const totals = useMemo(
    () => ({
      total: rows.reduce((a, r) => a + r.total, 0),
      active: rows.reduce((a, r) => a + r.active, 0),
      arrived: rows.reduce((a, r) => a + r.arrived, 0),
      noShow: rows.reduce((a, r) => a + r.noShow, 0),
    }),
    [rows],
  );

  return (
    <>
      <PageHeader
        eyebrow="MSSS · Tous les hôpitaux"
        title="Performance par établissement"
        description="Comparez les 4 hôpitaux pilotes — inscriptions, arrivées, no-show et attente moyenne."
        actions={
          <button
            type="button"
            onClick={() => window.print()}
            className="fs-btn fs-btn-pearl"
          >
            <Icon name="archive" size={14} />
            Export rapport
          </button>
        }
      />

      <div className="flex flex-col gap-8 px-10 py-10">
        {/* Provincial totals */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Total label="Inscrits cumulés" value={totals.total} />
          <Total label="Actifs réseau" value={totals.active} />
          <Total label="Arrivés" value={totals.arrived} tone="success" />
          <Total
            label="No-show réseau"
            value={totals.noShow + s.lwbs}
            tone={totals.noShow + s.lwbs > 0 ? "danger" : "neutral"}
          />
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="fs-tagline">Détail des établissements</h2>
          <div className="relative w-full sm:w-[320px]">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher hôpital ou CIUSSS…"
              className="h-11 rounded-full pr-4 pl-10 text-[14px]"
            />
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--ap-ink-muted-48)]">
              <Icon name="search" size={16} />
            </span>
          </div>
        </div>

        <div className="fs-dash-card-flush">
          <div className="overflow-x-auto">
            <table className="fs-dash-table">
              <thead>
                <tr>
                  <th>Hôpital</th>
                  <th>CIUSSS</th>
                  <Th onClick={() => clickSort("total")} active={sortKey === "total"} dir={sortDir}>
                    Inscrits
                  </Th>
                  <Th onClick={() => clickSort("active")} active={sortKey === "active"} dir={sortDir}>
                    Actifs
                  </Th>
                  <Th onClick={() => clickSort("arrived")} active={sortKey === "arrived"} dir={sortDir}>
                    Arrivés
                  </Th>
                  <Th onClick={() => clickSort("noShow")} active={sortKey === "noShow"} dir={sortDir}>
                    No-show
                  </Th>
                  <Th onClick={() => clickSort("avgWait")} active={sortKey === "avgWait"} dir={sortDir}>
                    Attente moy.
                  </Th>
                  <Th onClick={() => clickSort("responseRate")} active={sortKey === "responseRate"} dir={sortDir}>
                    Taux réponse
                  </Th>
                  <th>Tendance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((h) => (
                  <tr key={h.code}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--ap-canvas-parchment)] text-[12px] font-semibold tracking-[-0.022em] text-[var(--fs-primary)]">
                          {h.code}
                        </span>
                        <span className="font-medium text-[var(--ap-ink)]">
                          {h.name}
                        </span>
                      </div>
                    </td>
                    <td className="text-[12.5px] text-[var(--ap-ink-muted-80)]">
                      {h.ciusss}
                    </td>
                    <td className="font-mono tabular-nums">{h.total}</td>
                    <td className="font-mono tabular-nums">{h.active}</td>
                    <td className="font-mono tabular-nums text-[#1a6d2f]">
                      {h.arrived}
                    </td>
                    <td
                      className={`font-mono tabular-nums ${
                        h.noShow > 0 ? "text-[#c8102e]" : ""
                      }`}
                    >
                      {h.noShow}
                    </td>
                    <td className="font-mono tabular-nums">
                      {h.avgWait > 0 ? `${h.avgWait} min` : "—"}
                    </td>
                    <td className="font-mono tabular-nums">
                      {h.total > 0 ? `${h.responseRate}%` : "—"}
                    </td>
                    <td>
                      <Sparkline
                        data={h.trend}
                        width={96}
                        height={26}
                        stroke="var(--fs-primary)"
                        fill="rgba(30,144,214,0.12)"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

function bucketSeries(
  patients: { registeredAt: number }[],
  now: number,
): number[] {
  const buckets = 12;
  const winMs = 6 * 60 * MIN;
  const arr = new Array(buckets).fill(0);
  for (const p of patients) {
    const d = now - p.registeredAt;
    if (d >= 0 && d <= winMs) {
      const idx = Math.min(buckets - 1, Math.floor((1 - d / winMs) * buckets));
      arr[idx] += 1;
    }
  }
  return arr;
}

function Th({
  children,
  onClick,
  active,
  dir,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: "asc" | "desc";
}) {
  return (
    <th>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-[0.08em] uppercase text-[var(--ap-ink-muted-48)] hover:text-[var(--ap-ink)]"
        style={active ? { color: "var(--ap-ink)" } : undefined}
      >
        {children}
        {active && (
          <span className="text-[9px]">{dir === "asc" ? "▲" : "▼"}</span>
        )}
      </button>
    </th>
  );
}

function Total({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "danger" | "neutral";
}) {
  const color =
    tone === "success"
      ? "#1a6d2f"
      : tone === "danger"
        ? "#c8102e"
        : "var(--ap-ink)";
  return (
    <div className="fs-stat-tile">
      <div className="fs-eyebrow">{label}</div>
      <div
        className="fs-display-md mt-3 leading-none tabular-nums"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}
