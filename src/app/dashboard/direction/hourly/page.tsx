"use client";

import { useMemo, useState } from "react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { isActive } from "@/lib/filesante/store";
import type { HospitalCode, Patient } from "@/lib/filesante/types";

const MIN = 60_000;
const HOSPITALS: { code: HospitalCode | "ALL"; label: string }[] = [
  { code: "HMR", label: "HMR" },
  { code: "HND", label: "HND" },
  { code: "HSC", label: "HSC" },
  { code: "HGM", label: "HGM" },
  { code: "ALL", label: "Tous" },
];

const WINDOWS: { key: "6h" | "12h" | "24h"; label: string; hours: number }[] = [
  { key: "6h", label: "6 h", hours: 6 },
  { key: "12h", label: "12 h", hours: 12 },
  { key: "24h", label: "24 h", hours: 24 },
];

export default function DirectionHourly() {
  const s = useFileSante();
  const [hospital, setHospital] = useState<HospitalCode | "ALL">("HMR");
  const [windowKey, setWindowKey] = useState<"6h" | "12h" | "24h">("12h");
  const win = WINDOWS.find((w) => w.key === windowKey)!;

  const scope = useMemo(
    () =>
      hospital === "ALL"
        ? s.patients
        : s.patients.filter((p) => p.hospital === hospital),
    [s.patients, hospital],
  );

  // Bucket counts per hour for inscriptions + arrivals
  const buckets = win.hours;
  const winMs = win.hours * 60 * MIN;
  const now = s.simClock;

  const { inscriptions, arrivals, hours } = useMemo(() => {
    const ins = new Array(buckets).fill(0);
    const arr = new Array(buckets).fill(0);
    const labels: string[] = [];
    for (let i = 0; i < buckets; i++) {
      const ago = (buckets - 1 - i) * 60 * MIN;
      const d = new Date(Date.now() - ago);
      labels.push(d.toLocaleTimeString("fr-CA", { hour: "2-digit" }));
    }
    for (const p of scope) {
      const dIns = now - p.registeredAt;
      if (dIns >= 0 && dIns <= winMs) {
        const idx = Math.min(
          buckets - 1,
          Math.floor((1 - dIns / winMs) * buckets),
        );
        ins[idx] += 1;
      }
      if (p.arrivedAt !== null) {
        const dArr = now - p.arrivedAt;
        if (dArr >= 0 && dArr <= winMs) {
          const idx = Math.min(
            buckets - 1,
            Math.floor((1 - dArr / winMs) * buckets),
          );
          arr[idx] += 1;
        }
      }
    }
    return { inscriptions: ins, arrivals: arr, hours: labels };
  }, [scope, now, buckets, winMs]);

  const totalIns = inscriptions.reduce((a, b) => a + b, 0);
  const totalArr = arrivals.reduce((a, b) => a + b, 0);
  const peakIns = Math.max(...inscriptions, 0);
  const peakInsHour =
    inscriptions.indexOf(peakIns) >= 0 ? hours[inscriptions.indexOf(peakIns)] : "—";
  const activeNow = scope.filter(isActive).length;
  const conversion =
    totalIns > 0 ? Math.round((totalArr / totalIns) * 100) : 0;

  const maxBar = Math.max(1, ...inscriptions, ...arrivals);

  return (
    <>
      <PageHeader
        eyebrow="Direction · graphiques horaires"
        title="Fréquentation par heure"
        description="Inscriptions vs arrivées au triage retour. Identifiez les pics, ajustez les ressources."
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

      <div className="flex flex-col gap-8 px-10 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          <div className="fs-tabs">
            {WINDOWS.map((w) => (
              <button
                key={w.key}
                type="button"
                data-active={windowKey === w.key}
                onClick={() => setWindowKey(w.key)}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Tile
            label="Inscriptions"
            value={totalIns}
            sub={`Sur la fenêtre ${win.label}`}
            icon="taskList"
            tone="primary"
          />
          <Tile
            label="Arrivées"
            value={totalArr}
            sub={`${conversion}% des inscrits sont arrivés`}
            icon="checkCircle"
            tone="success"
          />
          <Tile
            label="Actifs maintenant"
            value={activeNow}
            sub="Dans la file P4 / P5"
            icon="clock"
          />
          <Tile
            label="Heure de pointe"
            value={peakIns}
            sub={`Maximum à ${peakInsHour}`}
            icon="graphUp"
            tone={peakIns > 4 ? "warn" : "neutral"}
          />
        </section>

        {/* Dual bar chart */}
        <section className="fs-dash-card p-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="fs-eyebrow">Flux par heure</div>
              <h2 className="fs-tagline mt-1">Inscriptions vs arrivées</h2>
              <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
                Hôpital{hospital === "ALL" ? "" : ` · ${hospital}`}. Fenêtre {win.label}.
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11.5px]">
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

          <div className="mt-6 grid items-end gap-2" style={{ gridTemplateColumns: `repeat(${buckets}, 1fr)` }}>
            {hours.map((label, i) => {
              const ins = inscriptions[i];
              const arr = arrivals[i];
              const insH = Math.max(2, Math.round((ins / maxBar) * 140));
              const arrH = Math.max(2, Math.round((arr / maxBar) * 140));
              return (
                <div key={`${label}-${i}`} className="flex flex-col items-center gap-1.5">
                  <div className="flex h-[140px] w-full items-end gap-0.5">
                    <div
                      className="flex-1 rounded-t-md bg-[var(--fs-primary)]"
                      style={{ height: `${insH}px`, opacity: 0.85 }}
                      title={`${label} — ${ins} inscription${ins === 1 ? "" : "s"}`}
                    />
                    <div
                      className="flex-1 rounded-t-md bg-[#34c759]"
                      style={{ height: `${arrH}px`, opacity: 0.85 }}
                      title={`${label} — ${arr} arrivée${arr === 1 ? "" : "s"}`}
                    />
                  </div>
                  <div className="font-mono text-[10.5px] tabular-nums text-[var(--ap-ink-muted-48)]">
                    {label}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--ap-hairline)] pt-5 sm:grid-cols-4">
            <Compact label="Inscriptions" value={totalIns} />
            <Compact label="Arrivées" value={totalArr} />
            <Compact label="Conversion" value={`${conversion}%`} />
            <Compact label="Pic" value={`${peakIns} @ ${peakInsHour}`} />
          </div>
        </section>

        {/* Recent inscriptions list */}
        <section className="fs-dash-card-flush">
          <div className="border-b border-[var(--ap-hairline)] px-6 py-4">
            <div className="fs-eyebrow">Détail</div>
            <h2 className="fs-tagline mt-1">
              Inscriptions récentes — {hospital === "ALL" ? "réseau" : hospital}
            </h2>
          </div>
          {scope.length === 0 ? (
            <div className="px-6 py-10 text-center text-[13px] text-[var(--ap-ink-muted-48)]">
              Aucune inscription sur la fenêtre.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--ap-hairline)]">
              {scope
                .slice()
                .sort((a, b) => b.registeredAt - a.registeredAt)
                .slice(0, 6)
                .map((p) => (
                  <PatientRow key={p.id} patient={p} now={now} />
                ))}
            </ul>
          )}
        </section>

        <section className="fs-dash-card p-6">
          <div className="fs-eyebrow">Tendance</div>
          <h2 className="fs-tagline mt-1">12 dernières heures</h2>
          <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
            Sparkline rapide pour signaler les ruptures.
          </p>
          <div className="mt-5">
            <Sparkline
              data={inscriptions}
              width={520}
              height={64}
              stroke="var(--fs-primary)"
              fill="rgba(30,144,214,0.12)"
            />
          </div>
        </section>
      </div>
    </>
  );
}

function PatientRow({ patient, now }: { patient: Patient; now: number }) {
  const waitMin = Math.max(0, Math.floor((now - patient.registeredAt) / MIN));
  const label =
    waitMin < 60
      ? `il y a ${waitMin} min`
      : `il y a ${Math.floor(waitMin / 60)}h${(waitMin % 60).toString().padStart(2, "0")}`;
  return (
    <li className="flex items-center gap-4 px-6 py-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--ap-canvas-parchment)] text-[12px] font-semibold text-[var(--ap-ink-muted-80)]">
        {patient.firstName.charAt(0)}
        {patient.lastName.charAt(0)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[var(--ap-ink)]">
            {patient.firstName} {patient.lastName}
          </span>
          <span className="fs-chip fs-chip-primary">{patient.priority}</span>
        </div>
        <div className="mt-0.5 text-[12px] text-[var(--ap-ink-muted-48)]">
          {patient.motif}
        </div>
      </div>
      <div className="text-right text-[12px] text-[var(--ap-ink-muted-48)]">
        {label}
      </div>
    </li>
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
  icon: IconName;
  tone?: "primary" | "success" | "warn" | "danger" | "neutral";
}) {
  const toneCls = {
    primary: "bg-[rgba(30,144,214,0.1)] text-[var(--fs-primary)]",
    success: "bg-[rgba(52,199,89,0.12)] text-[#1a6d2f]",
    warn: "bg-[rgba(255,159,10,0.16)] text-[#a06400]",
    danger: "bg-[rgba(200,16,46,0.1)] text-[#c8102e]",
    neutral: "bg-[var(--ap-canvas-parchment)] text-[var(--ap-ink-muted-80)]",
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
      <p className="mt-4 text-[12.5px] text-[var(--ap-ink-muted-80)]">{sub}</p>
    </div>
  );
}

function Compact({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="fs-eyebrow">{label}</div>
      <div className="mt-1 font-mono text-[18px] font-semibold tabular-nums text-[var(--ap-ink)]">
        {value}
      </div>
    </div>
  );
}
