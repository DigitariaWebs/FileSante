"use client";

import { useMemo, useState } from "react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { CLINICS, SECTORS, type Sector } from "@/data/clinics";
import { useFileSante } from "@/hooks/useFileSante";
import {
  PDF_COLORS,
  dataTable,
  downloadPdf,
  nowStamp,
  reportHeader,
  sectionTitle,
  statTiles,
} from "@/lib/pdf/export";

const STALE_THRESHOLD_MIN = 240; // 4h

function heatColor(load: number): { fg: string; bg: string; label: string } {
  if (load < 0.25)
    return { fg: "#1a6d2f", bg: "rgba(52,199,89,0.1)", label: "calme" };
  if (load < 0.5)
    return { fg: "#0f6fb4", bg: "rgba(30,144,214,0.1)", label: "modéré" };
  if (load < 0.75)
    return { fg: "#a06400", bg: "rgba(255,159,10,0.16)", label: "occupé" };
  if (load < 0.9)
    return { fg: "#c8102e", bg: "rgba(200,16,46,0.08)", label: "saturé" };
  return { fg: "#c8102e", bg: "rgba(200,16,46,0.2)", label: "critique" };
}

type SectorRow = {
  name: string;
  load: number; // 0..1 average
  clinics: number;
  inactive: number; // mock — clinics with no heartbeat
};

const INACTIVE_OVERRIDE: Record<string, number> = {
  Rosemont: 1,
  "Saint-Laurent": 2,
  "Rivière-des-Prairies": 1,
};

export default function MsssSectors() {
  const s = useFileSante();
  const [selected, setSelected] = useState<Sector>("Plateau-Mont-Royal");

  const sectorRows: SectorRow[] = useMemo(() => {
    return SECTORS.map((sec) => {
      const inSector = CLINICS.filter((c) => c.sector === sec);
      const baselineCount = Math.max(inSector.length, 3 + (sec.length % 5));
      // Average load: blend clinic data (gmf_plateau uses store load) with mock seed
      const loads = inSector.map((c) =>
        c.id === "gmf_plateau" ? s.clinic.currentLoad : c.loadInitial,
      );
      const avg =
        loads.length > 0
          ? loads.reduce((a, b) => a + b, 0) / loads.length
          : 0.3 + (sec.length % 7) * 0.07;
      const inactive = INACTIVE_OVERRIDE[sec] ?? 0;
      return {
        name: sec,
        load: Math.max(0, Math.min(0.98, avg)),
        clinics: baselineCount,
        inactive,
      };
    });
  }, [s.clinic.currentLoad]);

  const totals = useMemo(() => {
    const totalClinics = sectorRows.reduce((a, r) => a + r.clinics, 0);
    const totalInactive = sectorRows.reduce((a, r) => a + r.inactive, 0);
    const avgLoad =
      sectorRows.reduce((a, r) => a + r.load, 0) / sectorRows.length;
    const overloaded = sectorRows.filter((r) => r.load > 0.85).length;
    return { totalClinics, totalInactive, avgLoad, overloaded };
  }, [sectorRows]);

  const detail = sectorRows.find((r) => r.name === selected)!;
  const detailClinics = CLINICS.filter((c) => c.sector === selected);

  return (
    <>
      <PageHeader
        eyebrow="MSSS · Carte sectorielle"
        title="Heatmap d'utilisation — Montréal"
        description="Charge actuelle par secteur · détection des cliniques inactives."
        actions={
          <button
            type="button"
            onClick={() => exportSectorsPdf(sectorRows, totals, selected)}
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
          <Total label="Secteurs couverts" value={SECTORS.length} />
          <Total label="Cliniques pilotes" value={totals.totalClinics} />
          <Total
            label="Inactives"
            value={totals.totalInactive}
            tone={totals.totalInactive > 0 ? "warn" : "neutral"}
          />
          <Total
            label="Secteurs saturés"
            value={totals.overloaded}
            tone={totals.overloaded > 0 ? "danger" : "neutral"}
            sub={`Charge moyenne ${Math.round(totals.avgLoad * 100)}%`}
          />
        </section>

        {/* Heatmap grid */}
        <section className="fs-dash-card p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="fs-eyebrow">Carte sectorielle</div>
              <h2 className="fs-tagline mt-1">Charge par secteur</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px]">
              <Legend color="#22c55e" label="< 25 % calme" />
              <Legend color="#1e90d6" label="25–50 % modéré" />
              <Legend color="#f59e0b" label="50–75 % occupé" />
              <Legend color="#c8102e" label="75–90 % saturé" />
              <Legend color="#9a1129" label="> 90 % critique" />
              <Legend color="#a8a8aa" label="inactif > 4 h" />
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {sectorRows.map((sec) => (
              <SectorCell
                key={sec.name}
                row={sec}
                active={sec.name === selected}
                onClick={() => setSelected(sec.name as Sector)}
              />
            ))}
          </div>
        </section>

        {/* Stale clinics section */}
        <StaleSection />

        {/* Sector detail */}
        <section className="fs-dash-card-flush">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--ap-hairline)] px-6 py-4">
            <div>
              <div className="fs-eyebrow">Détail secteur</div>
              <h2 className="fs-tagline mt-1">{detail.name}</h2>
              <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
                {detailClinics.length} clinique
                {detailClinics.length === 1 ? "" : "s"} · charge moyenne{" "}
                {Math.round(detail.load * 100)}% ·{" "}
                {detail.inactive > 0
                  ? `${detail.inactive} inactive${detail.inactive === 1 ? "" : "s"}`
                  : "toutes opérationnelles"}
              </p>
            </div>
          </div>
          {detailClinics.length === 0 ? (
            <div className="px-6 py-10 text-center text-[13px] text-[var(--ap-ink-muted-48)]">
              Aucune clinique pilote n&apos;a encore rejoint ce secteur.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--ap-hairline)]">
              {detailClinics.map((c) => {
                const load =
                  c.id === "gmf_plateau" ? s.clinic.currentLoad : c.loadInitial;
                const pct = Math.round(load * 100);
                const color =
                  load > 0.85
                    ? "#c8102e"
                    : load > 0.6
                      ? "#ff9f0a"
                      : "#1a6d2f";
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <span className="fs-chip">{c.type}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-semibold text-[var(--ap-ink)]">
                        {c.name}
                      </div>
                      <div className="text-[12px] text-[var(--ap-ink-muted-48)]">
                        ETA {c.eta} · {c.hours}
                      </div>
                    </div>
                    <div className="w-[160px]">
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--ap-canvas-parchment)]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: color,
                          }}
                        />
                      </div>
                    </div>
                    <div
                      className="w-[60px] text-right font-mono text-[13px] font-semibold tabular-nums"
                      style={{ color }}
                    >
                      {pct}%
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

async function exportSectorsPdf(
  rows: SectorRow[],
  totals: {
    totalClinics: number;
    totalInactive: number;
    avgLoad: number;
    overloaded: number;
  },
  focused: Sector,
) {
  const stale = CLINICS.filter((c) => c.lastActivitySimMin >= STALE_THRESHOLD_MIN);
  await downloadPdf({
    filename: `filesante-msss-secteurs-${nowStamp()}.pdf`,
    content: [
      ...reportHeader({
        eyebrow: "MSSS · Carte sectorielle",
        title: "Heatmap d'utilisation — Montréal",
        subtitle: "Charge par secteur · détection des cliniques inactives.",
        metadata: [
          { label: "Édité", value: new Date().toLocaleString("fr-CA") },
          { label: "Secteur focus", value: focused },
        ],
      }),
      sectionTitle("Indicateurs réseau"),
      statTiles([
        { label: "Secteurs couverts", value: SECTORS.length },
        { label: "Cliniques pilotes", value: totals.totalClinics },
        {
          label: "Inactives",
          value: totals.totalInactive,
          tone: totals.totalInactive > 0 ? "warn" : "default",
        },
        {
          label: "Secteurs saturés",
          value: totals.overloaded,
          tone: totals.overloaded > 0 ? "danger" : "default",
          hint: `Charge moy. ${Math.round(totals.avgLoad * 100)}%`,
        },
      ]),
      sectionTitle("Charge par secteur"),
      dataTable<SectorRow>(rows, [
        { header: "Secteur", width: "*", render: (r) => r.name },
        {
          header: "Charge",
          width: 70,
          align: "right",
          render: (r) => `${Math.round(r.load * 100)}%`,
          color: (r) =>
            r.load > 0.85
              ? PDF_COLORS.danger
              : r.load > 0.6
                ? PDF_COLORS.warn
                : PDF_COLORS.success,
        },
        {
          header: "Cliniques",
          width: 70,
          align: "right",
          render: (r) => r.clinics,
        },
        {
          header: "Inactives",
          width: 70,
          align: "right",
          render: (r) => r.inactive,
          color: (r) => (r.inactive > 0 ? PDF_COLORS.danger : undefined),
        },
      ]),
      sectionTitle("Cliniques sans heartbeat > 4 h"),
      dataTable(
        stale,
        [
          { header: "Type", width: 50, render: (c) => c.type },
          { header: "Nom", width: "*", render: (c) => c.name },
          { header: "Secteur", width: 110, render: (c) => c.sector },
          {
            header: "Inactif depuis",
            width: 90,
            align: "right",
            render: (c) => {
              const h = Math.floor(c.lastActivitySimMin / 60);
              const m = c.lastActivitySimMin % 60;
              return `${h}h${m.toString().padStart(2, "0")}`;
            },
            color: () => PDF_COLORS.warn,
          },
          { header: "Téléphone", width: 90, render: (c) => c.phone },
        ],
        { emptyText: "Toutes les cliniques émettent un heartbeat actif." },
      ),
    ],
  });
}

function SectorCell({
  row,
  active,
  onClick,
}: {
  row: SectorRow;
  active: boolean;
  onClick: () => void;
}) {
  const pct = Math.round(row.load * 100);
  const heat = heatColor(row.load);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition-colors ${
        active
          ? "border-[var(--ap-ink)]"
          : "border-[var(--ap-hairline)] hover:border-[var(--ap-ink-muted-48)]"
      }`}
      style={{ background: heat.bg }}
    >
      <div className="flex items-start justify-between">
        <div className="text-[13.5px] font-semibold tracking-[-0.016em] text-[var(--ap-ink)]">
          {row.name}
        </div>
        <div
          className="font-mono text-[14px] font-semibold tabular-nums"
          style={{ color: heat.fg }}
        >
          {pct}%
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/60">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: heat.fg }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--ap-ink-muted-80)]">
        <span>
          {row.clinics} clinique{row.clinics === 1 ? "" : "s"} · {heat.label}
        </span>
        {row.inactive > 0 ? (
          <span className="font-semibold text-[#c8102e]">
            {row.inactive} inactive{row.inactive === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="text-[var(--ap-ink-muted-48)]">opérationnel</span>
        )}
      </div>
    </button>
  );
}

function StaleSection() {
  const stale = CLINICS.filter(
    (c) => c.lastActivitySimMin >= STALE_THRESHOLD_MIN,
  );
  if (stale.length === 0) return null;
  return (
    <section className="fs-dash-card-flush border border-[#ddd] bg-[#fafafa]">
      <div className="flex items-center justify-between border-b border-[var(--ap-hairline)] px-6 py-4">
        <div>
          <div className="fs-eyebrow">Cliniques inactives</div>
          <h2 className="fs-tagline mt-1">
            {stale.length} clinique{stale.length === 1 ? "" : "s"} sans
            heartbeat &gt; 4 h
          </h2>
          <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
            Aucun signal API depuis le seuil — vérifier connectivité ou
            disponibilité.
          </p>
        </div>
        <span className="fs-chip" style={{ background: "#ddd" }}>
          <Icon name="phoneOff" size={11} />
          stale
        </span>
      </div>
      <ul className="divide-y divide-[var(--ap-hairline)]">
        {stale.map((c) => {
          const h = Math.floor(c.lastActivitySimMin / 60);
          const m = c.lastActivitySimMin % 60;
          return (
            <li
              key={c.id}
              className="flex items-center gap-4 px-6 py-3.5"
            >
              <span className="fs-chip">{c.type}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-[var(--ap-ink)]">
                  {c.name}
                </div>
                <div className="text-[11.5px] text-[var(--ap-ink-muted-48)]">
                  {c.sector} · {c.phone}
                </div>
              </div>
              <span className="font-mono text-[12.5px] tabular-nums text-[#a06400]">
                inactif depuis {h}h{m.toString().padStart(2, "0")}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
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

function Total({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: number;
  sub?: string;
  tone?: "warn" | "danger" | "neutral";
}) {
  const color =
    tone === "warn"
      ? "#a06400"
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
      {sub && (
        <p className="mt-3 text-[12.5px] text-[var(--ap-ink-muted-80)]">
          {sub}
        </p>
      )}
    </div>
  );
}
