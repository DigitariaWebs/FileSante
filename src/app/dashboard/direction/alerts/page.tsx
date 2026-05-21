"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { useFileSante } from "@/hooks/useFileSante";
import { isActive } from "@/lib/filesante/store";
import type { HospitalCode, Patient } from "@/lib/filesante/types";
import {
  PDF_COLORS,
  dataTable,
  downloadPdf,
  nowStamp,
  reportHeader,
  sectionTitle,
  statTiles,
} from "@/lib/pdf/export";

const MIN = 60_000;
const HOSPITALS: { code: HospitalCode | "ALL"; label: string }[] = [
  { code: "HMR", label: "HMR" },
  { code: "HND", label: "HND" },
  { code: "HSC", label: "HSC" },
  { code: "HGM", label: "HGM" },
  { code: "ALL", label: "Tous" },
];

type Tier = { key: string; label: string; minMin: number; color: string };
const TIERS: Tier[] = [
  { key: "WATCH", label: "1–2 h · vigilance", minMin: 60, color: "#a06400" },
  { key: "WARNING", label: "2–3 h · alerte", minMin: 120, color: "#d97706" },
  { key: "CRITICAL", label: "> 3 h · critique", minMin: 180, color: "#c8102e" },
];

export default function DirectionAlerts() {
  const s = useFileSante();
  const [hospital, setHospital] = useState<HospitalCode | "ALL">("HMR");

  const all = useMemo(() => {
    const scope =
      hospital === "ALL"
        ? s.patients
        : s.patients.filter((p) => p.hospital === hospital);
    return scope
      .filter(isActive)
      .map((p) => ({
        patient: p,
        waitMin: Math.floor((s.simClock - p.registeredAt) / MIN),
      }))
      .sort((a, b) => b.waitMin - a.waitMin);
  }, [s.patients, s.simClock, hospital]);

  const tiered = useMemo(() => {
    const tiers: Record<string, typeof all> = {
      CRITICAL: [],
      WARNING: [],
      WATCH: [],
    };
    for (const item of all) {
      if (item.waitMin >= 180) tiers.CRITICAL.push(item);
      else if (item.waitMin >= 120) tiers.WARNING.push(item);
      else if (item.waitMin >= 60) tiers.WATCH.push(item);
    }
    return tiers;
  }, [all]);

  const counts = {
    CRITICAL: tiered.CRITICAL.length,
    WARNING: tiered.WARNING.length,
    WATCH: tiered.WATCH.length,
  };

  return (
    <>
      <PageHeader
        eyebrow="Direction · alertes"
        title="Patients en attente prolongée"
        description="Surveillance des attentes > 1 h. Escalade automatique au-delà de 3 h (risque LWBS)."
        actions={
          <button
            type="button"
            onClick={() => exportAlertsPdf(hospital, tiered, counts)}
            className="fs-btn fs-btn-pearl"
          >
            <Icon name="archive" size={14} />
            Exporter PDF
          </button>
        }
      />

      <div className="flex flex-col gap-8 px-10 py-10">
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

        {/* Summary */}
        <section className="grid gap-5 md:grid-cols-3">
          {TIERS.map((t) => {
            const count = counts[t.key as keyof typeof counts];
            return (
              <div
                key={t.key}
                className="fs-stat-tile"
                style={{ borderColor: count > 0 ? `${t.color}40` : undefined }}
              >
                <div className="fs-eyebrow" style={{ color: t.color }}>
                  {t.label}
                </div>
                <div className="fs-display-md mt-3 leading-none tabular-nums">
                  {count}
                </div>
                <p className="mt-3 text-[12.5px] text-[var(--ap-ink-muted-80)]">
                  Seuil ≥ {t.minMin} min
                </p>
              </div>
            );
          })}
        </section>

        {/* Critical first */}
        {TIERS.slice()
          .reverse()
          .map((tier) => {
            const list = tiered[tier.key as keyof typeof tiered];
            if (list.length === 0) return null;
            return (
              <section key={tier.key} className="fs-dash-card-flush">
                <div className="flex items-end justify-between border-b border-[var(--ap-hairline)] px-6 py-4">
                  <div>
                    <div
                      className="fs-eyebrow"
                      style={{ color: tier.color }}
                    >
                      {tier.label}
                    </div>
                    <h2 className="fs-tagline mt-1">
                      {list.length} patient{list.length === 1 ? "" : "s"}
                    </h2>
                  </div>
                  <span
                    className="fs-chip"
                    style={{
                      background: `${tier.color}1a`,
                      color: tier.color,
                    }}
                  >
                    seuil ≥ {tier.minMin} min
                  </span>
                </div>
                <ul className="divide-y divide-[var(--ap-hairline)]">
                  {list.map((row) => (
                    <AlertRow
                      key={row.patient.id}
                      patient={row.patient}
                      waitMin={row.waitMin}
                      color={tier.color}
                    />
                  ))}
                </ul>
              </section>
            );
          })}

        {all.length === 0 ||
        TIERS.every((t) => tiered[t.key as keyof typeof tiered].length === 0) ? (
          <div className="fs-dash-card-flush">
            <EmptyState
              icon={<Icon name="checkCircle" size={20} />}
              title="Aucune alerte"
              description="Aucun patient n'attend depuis plus d'une heure pour cet hôpital."
            />
          </div>
        ) : null}
      </div>
    </>
  );
}

type AlertRowData = { patient: Patient; waitMin: number };

async function exportAlertsPdf(
  hospital: HospitalCode | "ALL",
  tiered: Record<string, AlertRowData[]>,
  counts: { CRITICAL: number; WARNING: number; WATCH: number },
) {
  const scope = hospital === "ALL" ? "Réseau" : hospital;
  const sectionFor = (key: "CRITICAL" | "WARNING" | "WATCH", title: string, color: string) => {
    const rows = tiered[key] ?? [];
    return [
      sectionTitle(`${title} — ${rows.length} patient${rows.length === 1 ? "" : "s"}`),
      dataTable<AlertRowData>(
        rows,
        [
          {
            header: "Patient",
            width: "*",
            render: (r) => `${r.patient.firstName} ${r.patient.lastName}`,
          },
          { header: "Pr.", width: 25, render: (r) => r.patient.priority },
          { header: "Hôp.", width: 35, render: (r) => r.patient.hospital },
          {
            header: "Attente",
            width: 55,
            align: "right",
            render: (r) => {
              const h = Math.floor(r.waitMin / 60);
              const m = r.waitMin % 60;
              return h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m} min`;
            },
            color: () => color,
          },
          {
            header: "Statut",
            width: 80,
            render: (r) => r.patient.status,
            color: () => PDF_COLORS.inkMuted,
          },
          {
            header: "Motif",
            width: "*",
            render: (r) => r.patient.motif,
            color: () => PDF_COLORS.inkMuted,
          },
        ],
        { emptyText: "Aucun patient à ce seuil." },
      ),
    ];
  };
  await downloadPdf({
    filename: `filesante-alertes-${hospital}-${nowStamp()}.pdf`,
    pageOrientation: "landscape",
    content: [
      ...reportHeader({
        eyebrow: "Direction · alertes",
        title: "Patients en attente prolongée",
        subtitle:
          "Surveillance des attentes > 1 h. Escalade automatique au-delà de 3 h (risque LWBS).",
        metadata: [
          { label: "Périmètre", value: scope },
          { label: "Édité", value: new Date().toLocaleString("fr-CA") },
        ],
      }),
      statTiles([
        {
          label: "Critique > 3 h",
          value: counts.CRITICAL,
          tone: counts.CRITICAL > 0 ? "danger" : "default",
        },
        {
          label: "Alerte 2–3 h",
          value: counts.WARNING,
          tone: counts.WARNING > 0 ? "warn" : "default",
        },
        {
          label: "Vigilance 1–2 h",
          value: counts.WATCH,
          tone: counts.WATCH > 0 ? "warn" : "default",
        },
      ]),
      ...sectionFor("CRITICAL", "> 3 h · critique", PDF_COLORS.danger),
      ...sectionFor("WARNING", "2–3 h · alerte", PDF_COLORS.warn),
      ...sectionFor("WATCH", "1–2 h · vigilance", PDF_COLORS.warn),
    ],
  });
}

function AlertRow({
  patient,
  waitMin,
  color,
}: {
  patient: Patient;
  waitMin: number;
  color: string;
}) {
  const h = Math.floor(waitMin / 60);
  const m = waitMin % 60;
  const label = h > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${m} min`;
  return (
    <li className="flex items-center gap-4 px-6 py-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--ap-canvas-parchment)] text-[12.5px] font-semibold text-[var(--ap-ink-muted-80)]">
        {patient.firstName.charAt(0)}
        {patient.lastName.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[var(--ap-ink)]">
            {patient.firstName} {patient.lastName}
          </span>
          <span className="fs-chip fs-chip-primary">{patient.priority}</span>
          <span className="fs-chip">{patient.hospital}</span>
        </div>
        <div className="mt-0.5 text-[12.5px] text-[var(--ap-ink-muted-80)]">
          {patient.motif}
        </div>
      </div>
      <div className="text-right">
        <div
          className="font-mono text-[14px] font-semibold tabular-nums"
          style={{ color }}
        >
          {label}
        </div>
        <div className="text-[11px] text-[var(--ap-ink-muted-48)]">attente</div>
      </div>
      <StatusBadge status={patient.status} />
    </li>
  );
}
