"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/Icon";

const RAMQ_HOURLY = 85; // $/h baseline RAMQ cost per ER hour (IEDM mock)
const CIVIERE_NIGHT = 1200; // $/night avoided when freed
const IEDM_BASELINE_MIN = 323; // 5h23 — IEDM mean wait baseline

function formatCAD(n: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    maximumFractionDigits: 0,
  }).format(n);
}

type Props = {
  patientsTreated: number;
  avgWaitMin: number;
  civieresAvoided: number;
};

export function SavingsStrip({
  patientsTreated,
  avgWaitMin,
  civieresAvoided,
}: Props) {
  const [showMethodology, setShowMethodology] = useState(false);
  const minSaved = Math.max(0, IEDM_BASELINE_MIN - avgWaitMin);
  const timePerPatientH = minSaved / 60;
  const dailySavings = patientsTreated * timePerPatientH * RAMQ_HOURLY;
  const civSavings = civieresAvoided * CIVIERE_NIGHT;
  const totalDaily = dailySavings + civSavings;
  const annual = totalDaily * 365;

  return (
    <section className="flex flex-col gap-3">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card
          label="Économies du jour"
          value={formatCAD(totalDaily)}
          sub="RAMQ + civières libérées"
          tone="success"
        />
        <Card
          label="Projection annuelle"
          value={formatCAD(annual)}
          sub="Extrapolation 365 jours"
          tone="info"
        />
        <Card
          label="Temps gagné / patient"
          value={`${Math.round(minSaved)} min`}
          sub={`Vs baseline IEDM ${IEDM_BASELINE_MIN} min`}
          tone="neutral"
        />
        <Card
          label="Économies civière"
          value={formatCAD(civSavings)}
          sub={`${civieresAvoided} civière${civieresAvoided === 1 ? "" : "s"} libérée${civieresAvoided === 1 ? "" : "s"}`}
          tone="neutral"
        />
      </div>

      <details
        open={showMethodology}
        onToggle={(e) => setShowMethodology((e.target as HTMLDetailsElement).open)}
        className="fs-dash-card overflow-hidden p-5"
      >
        <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] font-semibold text-[var(--ap-ink)]">
          <Icon name="help" size={14} />
          Méthodologie de calcul
          <span className="ml-2 text-[12px] text-[var(--ap-ink-muted-48)]">
            {showMethodology ? "Masquer" : "Afficher"}
          </span>
        </summary>
        <div className="mt-3 grid gap-3 text-[12.5px] text-[var(--ap-ink-muted-80)] md:grid-cols-2">
          <div>
            <b className="text-[var(--ap-ink)]">Baseline IEDM</b> · 5h23 (323
            min) — temps médian d&apos;attente avant FileSanté.
          </div>
          <div>
            <b className="text-[var(--ap-ink)]">Coût RAMQ</b> · 85 $/h
            d&apos;occupation civière + personnel infirmier.
          </div>
          <div>
            <b className="text-[var(--ap-ink)]">Économie civière</b> · 1 200 $ /
            nuit pour chaque civière libérée tôt.
          </div>
          <div>
            <b className="text-[var(--ap-ink)]">Formule</b> · patients × (323 −
            attente actuelle) ÷ 60 × 85 $ + civières × 1 200 $.
          </div>
        </div>
      </details>
    </section>
  );
}

type Tone = "success" | "info" | "neutral";

function Card({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: Tone;
}) {
  const color = {
    success: "#1a6d2f",
    info: "var(--fs-primary)",
    neutral: "var(--ap-ink)",
  }[tone];
  return (
    <div className="fs-stat-tile">
      <div className="fs-eyebrow">{label}</div>
      <div
        className="fs-display-md mt-3 leading-none tabular-nums"
        style={{ color }}
      >
        {value}
      </div>
      <p className="mt-3 text-[12.5px] text-[var(--ap-ink-muted-80)]">{sub}</p>
    </div>
  );
}
