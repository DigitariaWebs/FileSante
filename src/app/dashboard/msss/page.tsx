"use client";

import { useMemo } from "react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { isActive } from "@/lib/filesante/store";
import type { HospitalCode } from "@/lib/filesante/types";

const HOSPITALS: { code: HospitalCode; name: string; ciusss: string }[] = [
  { code: "HMR", name: "Maisonneuve-Rosemont", ciusss: "Est-de-l'Île" },
  { code: "HND", name: "Notre-Dame", ciusss: "Centre-Sud" },
  { code: "HSC", name: "Sacré-Cœur", ciusss: "Nord-de-l'Île" },
  { code: "HGM", name: "Général de Montréal", ciusss: "CUSM" },
];

type Sector = {
  name: string;
  load: number; // 0..1
  clinics: number;
  inactive: number;
};

const SECTORS: Sector[] = [
  { name: "Plateau-Mont-Royal", load: 0.78, clinics: 7, inactive: 0 },
  { name: "Hochelaga-Maisonneuve", load: 0.62, clinics: 5, inactive: 0 },
  { name: "Rosemont", load: 0.55, clinics: 6, inactive: 1 },
  { name: "Villeray", load: 0.81, clinics: 5, inactive: 0 },
  { name: "Verdun", load: 0.38, clinics: 4, inactive: 0 },
  { name: "Lachine", load: 0.42, clinics: 3, inactive: 0 },
  { name: "Centre-Sud", load: 0.91, clinics: 8, inactive: 0 },
  { name: "Côte-des-Neiges", load: 0.66, clinics: 6, inactive: 0 },
  { name: "Saint-Laurent", load: 0.29, clinics: 4, inactive: 2 },
  { name: "Pierrefonds", load: 0.47, clinics: 3, inactive: 0 },
  { name: "Anjou", load: 0.59, clinics: 4, inactive: 0 },
  { name: "Rivière-des-Prairies", load: 0.34, clinics: 3, inactive: 1 },
];

const MIN = 60_000;

export default function MsssHome() {
  const s = useFileSante();

  const provincial = useMemo(() => {
    const total = s.patients.length;
    const active = s.patients.filter(isActive).length;
    const arrived = s.patients.filter(
      (p) => p.status === "ARRIVED" || p.status === "COMPLETED",
    ).length;
    const noShow = s.patients.filter((p) => p.status === "NO_SHOW").length;
    const totalSectorClinics = SECTORS.reduce((a, sec) => a + sec.clinics, 0);
    const inactive = SECTORS.reduce((a, sec) => a + sec.inactive, 0);
    return { total, active, arrived, noShow, totalSectorClinics, inactive };
  }, [s.patients]);

  const byHospital = useMemo(() => {
    return HOSPITALS.map((h) => {
      const scope = s.patients.filter((p) => p.hospital === h.code);
      const active = scope.filter(isActive).length;
      const arrived = scope.filter(
        (p) => p.status === "ARRIVED" || p.status === "COMPLETED",
      ).length;
      const noShow = scope.filter((p) => p.status === "NO_SHOW").length;
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
      return { ...h, total: scope.length, active, arrived, noShow, avgWait };
    });
  }, [s.patients]);

  const provincialSeries = useMemo(() => {
    const buckets = 12;
    const win = 6 * 60 * MIN;
    const now = s.simClock;
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

  return (
    <>
      <PageHeader
        eyebrow="MSSS · Réseau Québec"
        title="Vue provinciale"
        description="Tableau de bord consolidé — 4 hôpitaux pilotes · ~58 cliniques de première ligne."
        actions={
          <button
            type="button"
            onClick={() => window.print()}
            className="fs-btn fs-btn-pearl"
          >
            <Icon name="archive" size={14} />
            Export rapport provincial
          </button>
        }
      />

      <div className="flex flex-col gap-10 px-10 py-10">
        {/* Provincial KPI tiles */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Tile
            label="Inscrits cumulés"
            value={provincial.total}
            sub={`${provincial.active} actifs maintenant`}
            icon="archive"
            spark={provincialSeries}
          />
          <Tile
            label="Arrivés réseau"
            value={provincial.arrived}
            sub="Patients vus en première ligne ou triage retour"
            icon="checkCircle"
            tone="success"
          />
          <Tile
            label="LWBS + No-show"
            value={provincial.noShow + s.lwbs}
            sub="Patients perdus dans le système"
            icon="warning"
            tone={provincial.noShow + s.lwbs > 0 ? "danger" : "neutral"}
          />
          <Tile
            label="Cliniques inactives"
            value={provincial.inactive}
            sub={`Sur ${provincial.totalSectorClinics} cliniques pilotes`}
            icon="phoneOff"
            tone={provincial.inactive > 0 ? "warn" : "neutral"}
          />
        </section>

        {/* Hospital breakdown */}
        <section className="fs-dash-card-flush">
          <div className="border-b border-[var(--ap-hairline)] px-6 py-4">
            <div className="fs-eyebrow">Hôpitaux pilotes</div>
            <h2 className="fs-tagline mt-1">
              Performance par établissement
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="fs-dash-table">
              <thead>
                <tr>
                  <th>Hôpital</th>
                  <th>CIUSSS</th>
                  <th>Inscrits</th>
                  <th>Actifs</th>
                  <th>Arrivés</th>
                  <th>No-show</th>
                  <th>Attente moy.</th>
                </tr>
              </thead>
              <tbody>
                {byHospital.map((h) => (
                  <tr key={h.code}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-md bg-[var(--ap-surface-strong)] text-[11px] font-semibold tracking-[-0.022em] text-[var(--fs-primary)]">
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
                    <td className="font-mono tabular-nums">{h.arrived}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sector heatmap */}
        <section className="fs-dash-card p-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="fs-eyebrow">Carte sectorielle</div>
              <h2 className="fs-tagline mt-1">
                Heatmap d&apos;utilisation — Montréal
              </h2>
              <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
                Charge actuelle par secteur · détection des cliniques inactives.
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11.5px]">
              <Legend color="#34c759" label="< 60%" />
              <Legend color="#ff9f0a" label="60–85%" />
              <Legend color="#c8102e" label="> 85%" />
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {SECTORS.map((sec) => (
              <SectorCell key={sec.name} sector={sec} />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function SectorCell({ sector }: { sector: Sector }) {
  const pct = Math.round(sector.load * 100);
  const color =
    sector.load > 0.85
      ? "#c8102e"
      : sector.load > 0.6
        ? "#ff9f0a"
        : "#34c759";
  const bg =
    sector.load > 0.85
      ? "rgba(200,16,46,0.08)"
      : sector.load > 0.6
        ? "rgba(255,159,10,0.1)"
        : "rgba(52,199,89,0.08)";

  return (
    <div
      className="rounded-lg border border-[var(--ap-hairline-strong)] p-4 transition-colors"
      style={{ background: bg }}
    >
      <div className="flex items-start justify-between">
        <div className="text-[13.5px] font-semibold tracking-[-0.016em] text-[var(--ap-ink)]">
          {sector.name}
        </div>
        <div
          className="font-mono text-[14px] font-semibold tabular-nums"
          style={{ color }}
        >
          {pct}%
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/60">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--ap-ink-muted-80)]">
        <span>
          {sector.clinics} clinique{sector.clinics === 1 ? "" : "s"}
        </span>
        {sector.inactive > 0 ? (
          <span className="font-semibold text-[#c8102e]">
            {sector.inactive} inactive{sector.inactive === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="text-[var(--ap-ink-muted-48)]">opérationnel</span>
        )}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[var(--ap-ink-muted-80)]">
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
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
  tone?: "success" | "warn" | "danger" | "neutral";
  spark?: number[];
}) {
  const toneCls = {
    success: "bg-[rgba(52,199,89,0.12)] text-[#1a6d2f]",
    warn: "bg-[rgba(255,159,10,0.16)] text-[#a06400]",
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
