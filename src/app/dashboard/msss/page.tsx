"use client";

import { useMemo } from "react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { SavingsStrip } from "@/components/dashboard/SavingsStrip";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { Icon, type IconName } from "@/components/ui/Icon";
import { MultiLineChart } from "@/components/ui/MultiLineChart";
import { useFileSante } from "@/hooks/useFileSante";
import { isActive } from "@/lib/filesante/store";
import type { HospitalCode } from "@/lib/filesante/types";
import {
  PDF_COLORS,
  dataTable,
  downloadPdf,
  nowStamp,
  reportHeader,
  sectionTitle,
  statTiles,
} from "@/lib/pdf/export";

const HOSPITAL_COLORS: Record<HospitalCode, string> = {
  HMR: "#1e90d6",
  HND: "#22c55e",
  HSC: "#f59e0b",
  HGM: "#c8102e",
};

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
    const confirmed = s.patients.filter(
      (p) =>
        p.status === "CONFIRMED" ||
        p.status === "ARRIVED" ||
        p.status === "COMPLETED",
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
              MIN,
          )
        : 0;
    const civieresFreed = s.civieres.filter(
      (c) => c.status === "DISCHARGED",
    ).length;
    const totalSectorClinics = SECTORS.reduce((a, sec) => a + sec.clinics, 0);
    const inactive = SECTORS.reduce((a, sec) => a + sec.inactive, 0);
    return {
      total,
      active,
      arrived,
      noShow,
      confirmed,
      avgWaitMin,
      civieresFreed,
      totalSectorClinics,
      inactive,
    };
  }, [s.patients, s.civieres]);

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

  const multiSeries = useMemo(() => {
    const buckets = 12;
    const win = 12 * 60 * MIN;
    const now = s.simClock;
    return HOSPITALS.map((h) => {
      const arr = new Array(buckets).fill(0);
      for (const p of s.patients) {
        if (p.hospital !== h.code) continue;
        const d = now - p.registeredAt;
        if (d >= 0 && d <= win) {
          const i = Math.min(buckets - 1, Math.floor(((win - d) / win) * buckets));
          arr[i] += 1;
        }
      }
      return {
        label: h.code,
        color: HOSPITAL_COLORS[h.code],
        data: arr,
      };
    });
  }, [s.patients, s.simClock]);

  const multiLabels = useMemo(() => {
    const realNow = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const h = (realNow.getHours() - (11 - i) + 24) % 24;
      return `${h.toString().padStart(2, "0")}h`;
    });
  }, []);

  const occupancyByHospital = useMemo(() => {
    return HOSPITALS.map((h) => {
      const activeCiv = s.civieres.filter(
        (c) => c.hospital === h.code && c.status !== "DISCHARGED",
      ).length;
      // mock occupancy: civières used / 20 + 30% base load
      const pct = Math.min(100, 30 + activeCiv * 5);
      const status = pct > 85 ? "alert" : pct > 65 ? "warn" : "ok";
      const color =
        status === "alert" ? "#c8102e" : status === "warn" ? "#a06400" : "#1a6d2f";
      return { ...h, civieres: activeCiv, pct, color, status };
    });
  }, [s.civieres]);

  return (
    <>
      <PageHeader
        eyebrow="MSSS · Réseau Québec"
        title="Vue provinciale"
        description="Tableau de bord consolidé — 4 hôpitaux pilotes · ~58 cliniques de première ligne."
        actions={
          <button
            type="button"
            onClick={() =>
              exportMsssPdf({
                provincial,
                lwbs: s.lwbs,
                byHospital,
                occupancyByHospital,
                sectors: SECTORS,
              })
            }
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

        {/* Network savings — Section 12 spec */}
        <SavingsStrip
          patientsTreated={provincial.confirmed}
          avgWaitMin={provincial.avgWaitMin || 220}
          civieresAvoided={provincial.civieresFreed}
        />

        {/* Provincial multi-hospital line chart */}
        <section className="fs-dash-card p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="fs-eyebrow">Activité provinciale · 12 dernières heures</div>
              <h2 className="fs-tagline mt-1">Inscriptions par hôpital</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11.5px]">
              {multiSeries.map((m) => (
                <span
                  key={m.label}
                  className="inline-flex items-center gap-1.5 text-[var(--ap-ink-muted-80)]"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: m.color }}
                  />
                  {m.label}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <MultiLineChart
              series={multiSeries}
              labels={multiLabels}
              width={760}
              height={230}
            />
          </div>
        </section>

        {/* Occupancy cards */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {occupancyByHospital.map((h) => (
            <div key={h.code} className="fs-dash-card overflow-hidden p-0">
              <div className="h-1" style={{ background: h.color }} />
              <div className="px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[12px] font-semibold text-[var(--fs-primary)]">
                      {h.code}
                    </div>
                    <div className="text-[13px] font-semibold text-[var(--ap-ink)]">
                      {h.name}
                    </div>
                  </div>
                  <span
                    className="font-mono text-[18px] font-semibold tabular-nums"
                    style={{ color: h.color }}
                  >
                    {h.pct}%
                  </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--ap-canvas-parchment)]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${h.pct}%`, background: h.color }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--ap-ink-muted-48)]">
                  <span>{h.civieres} civière{h.civieres === 1 ? "" : "s"} actives</span>
                  <span>{h.ciusss}</span>
                </div>
              </div>
            </div>
          ))}
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

type ByHospitalRow = {
  code: HospitalCode;
  name: string;
  ciusss: string;
  total: number;
  active: number;
  arrived: number;
  noShow: number;
  avgWait: number;
};

type OccupancyRow = {
  code: HospitalCode;
  name: string;
  civieres: number;
  pct: number;
  color: string;
  status: string;
};

async function exportMsssPdf(args: {
  provincial: {
    total: number;
    active: number;
    arrived: number;
    noShow: number;
    confirmed: number;
    avgWaitMin: number;
    civieresFreed: number;
    totalSectorClinics: number;
    inactive: number;
  };
  lwbs: number;
  byHospital: ByHospitalRow[];
  occupancyByHospital: OccupancyRow[];
  sectors: Sector[];
}) {
  await downloadPdf({
    filename: `filesante-msss-${nowStamp()}.pdf`,
    pageOrientation: "landscape",
    content: [
      ...reportHeader({
        eyebrow: "MSSS · Réseau Québec",
        title: "Vue provinciale",
        subtitle:
          "Tableau consolidé — 4 hôpitaux pilotes · ~58 cliniques de première ligne.",
        metadata: [
          { label: "Édité", value: new Date().toLocaleString("fr-CA") },
          {
            label: "Cliniques",
            value: `${args.provincial.totalSectorClinics} (${args.provincial.inactive} inactives)`,
          },
        ],
      }),
      sectionTitle("Indicateurs provinciaux"),
      statTiles([
        {
          label: "Inscrits cumulés",
          value: args.provincial.total,
          hint: `${args.provincial.active} actifs`,
        },
        {
          label: "Arrivés réseau",
          value: args.provincial.arrived,
          tone: "success",
        },
        {
          label: "LWBS + No-show",
          value: args.provincial.noShow + args.lwbs,
          tone: args.provincial.noShow + args.lwbs > 0 ? "danger" : "default",
        },
        {
          label: "Cliniques inactives",
          value: args.provincial.inactive,
          tone: args.provincial.inactive > 0 ? "warn" : "default",
          hint: `sur ${args.provincial.totalSectorClinics}`,
        },
      ]),
      sectionTitle("Performance par établissement"),
      dataTable<ByHospitalRow>(args.byHospital, [
        { header: "Hôp.", width: 50, render: (h) => h.code },
        { header: "Nom", width: "*", render: (h) => h.name },
        { header: "CIUSSS", width: 100, render: (h) => h.ciusss },
        {
          header: "Inscrits",
          width: 55,
          align: "right",
          render: (h) => h.total,
        },
        {
          header: "Actifs",
          width: 50,
          align: "right",
          render: (h) => h.active,
        },
        {
          header: "Arrivés",
          width: 55,
          align: "right",
          render: (h) => h.arrived,
          color: () => PDF_COLORS.success,
        },
        {
          header: "No-show",
          width: 55,
          align: "right",
          render: (h) => h.noShow,
          color: (h) => (h.noShow > 0 ? PDF_COLORS.danger : undefined),
        },
        {
          header: "Att. moy.",
          width: 60,
          align: "right",
          render: (h) => (h.avgWait > 0 ? `${h.avgWait} min` : "—"),
        },
      ]),
      sectionTitle("Occupation civières"),
      dataTable<OccupancyRow>(args.occupancyByHospital, [
        { header: "Hôp.", width: 50, render: (o) => o.code },
        { header: "Nom", width: "*", render: (o) => o.name },
        {
          header: "Civières actives",
          width: 100,
          align: "right",
          render: (o) => o.civieres,
        },
        {
          header: "Taux",
          width: 60,
          align: "right",
          render: (o) => `${o.pct}%`,
          color: (o) =>
            o.pct > 85
              ? PDF_COLORS.danger
              : o.pct > 65
                ? PDF_COLORS.warn
                : PDF_COLORS.success,
        },
        {
          header: "Statut",
          width: 70,
          render: (o) =>
            o.status === "alert" ? "Critique" : o.status === "warn" ? "Tendu" : "OK",
        },
      ]),
      sectionTitle("Carte sectorielle"),
      dataTable<Sector>(args.sectors, [
        { header: "Secteur", width: "*", render: (s) => s.name },
        {
          header: "Charge",
          width: 60,
          align: "right",
          render: (s) => `${Math.round(s.load * 100)}%`,
          color: (s) =>
            s.load > 0.85
              ? PDF_COLORS.danger
              : s.load > 0.6
                ? PDF_COLORS.warn
                : PDF_COLORS.success,
        },
        {
          header: "Cliniques",
          width: 70,
          align: "right",
          render: (s) => s.clinics,
        },
        {
          header: "Inactives",
          width: 70,
          align: "right",
          render: (s) => s.inactive,
          color: (s) => (s.inactive > 0 ? PDF_COLORS.danger : undefined),
        },
      ]),
    ],
  });
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
