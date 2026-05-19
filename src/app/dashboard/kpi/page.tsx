"use client";

import { useMemo } from "react";

import { Topbar } from "@/components/dashboard/Topbar";
import { useFileSante } from "@/hooks/useFileSante";
import { isActive } from "@/lib/filesante/store";

export default function KpiPage() {
  const s = useFileSante();

  const stats = useMemo(() => {
    const total = s.patients.length;
    const active = s.patients.filter(isActive).length;
    const noShow = s.patients.filter((p) => p.status === "NO_SHOW").length;
    const cancelled = s.patients.filter(
      (p) => p.status === "CANCELLED_BY_PATIENT",
    ).length;
    const noResp = s.patients.filter((p) => p.status === "NO_RESPONSE").length;
    const arrived = s.patients.filter(
      (p) => p.status === "ARRIVED" || p.status === "COMPLETED",
    ).length;
    const lwbs = s.lwbs;

    const arrivedWith = s.patients.filter(
      (p) => (p.status === "ARRIVED" || p.status === "COMPLETED") && p.arrivedAt,
    );
    const avgWaitMin =
      arrivedWith.length > 0
        ? Math.round(
            arrivedWith.reduce(
              (sum, p) => sum + (p.arrivedAt! - p.registeredAt),
              0,
            ) /
              arrivedWith.length /
              60000,
          )
        : 0;

    const responseRate =
      total > 0 ? Math.round(((total - noResp) / total) * 100) : 0;

    return {
      total,
      active,
      noShow,
      cancelled,
      noResp,
      arrived,
      lwbs,
      avgWaitMin,
      responseRate,
    };
  }, [s.patients, s.lwbs]);

  return (
    <>
      <Topbar title="Indicateurs · temps réel" />
      <div className="px-8 py-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Dans la file"
            value={stats.active}
            sub="Patients actifs P4/P5"
            tone="primary"
          />
          <Kpi
            label="Arrivés"
            value={stats.arrived}
            sub="Re-scan QR ou code 4 chiffres"
          />
          <Kpi
            label="Taux de réponse"
            value={`${stats.responseRate} %`}
            sub="Confirmations / total inscrit"
          />
          <Kpi
            label="Attente moyenne"
            value={`${stats.avgWaitMin} min`}
            sub="De l'inscription à l'arrivée"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="LWBS"
            value={stats.lwbs}
            sub="Left Without Being Seen (no-show)"
            tone="danger"
          />
          <Kpi
            label="No-show"
            value={stats.noShow}
            sub="Confirmés mais non présentés"
          />
          <Kpi
            label="Annulés par patient"
            value={stats.cancelled}
            sub="Réponse NON au SMS T-60"
          />
          <Kpi
            label="Sans réponse"
            value={stats.noResp}
            sub="Aucun OUI/NON dans la fenêtre"
          />
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--fs-line)] bg-white p-6">
          <div className="fs-sec-eyebrow">À propos</div>
          <h2 className="mt-2 font-display text-lg font-semibold text-[var(--fs-ink)]">
            Compteurs basés sur la session locale
          </h2>
          <p className="mt-2 text-sm text-[var(--fs-ink-2)]">
            Données stockées dans le navigateur (localStorage). Réinitialisez
            via la barre supérieure pour repartir à zéro. En production, ces
            indicateurs alimentent le portail Direction d&apos;hôpital et la
            vue MSSS consolidée.
          </p>
        </div>
      </div>
    </>
  );
}

function Kpi({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub: string;
  tone?: "primary" | "danger";
}) {
  const bg =
    tone === "primary"
      ? "linear-gradient(155deg, var(--fs-primary), var(--fs-primary-2))"
      : tone === "danger"
        ? "linear-gradient(155deg, #c83333, #7a1414)"
        : "#fff";
  const fg = tone ? "#fff" : "var(--fs-ink)";
  const subFg = tone ? "rgba(255,255,255,.8)" : "var(--fs-ink-3)";
  const labelFg = tone ? "rgba(255,255,255,.85)" : "var(--fs-ink-3)";
  const border = tone ? "transparent" : "var(--fs-line)";
  return (
    <div
      className="rounded-2xl border p-5 shadow-sm"
      style={{ background: bg, borderColor: border, color: fg }}
    >
      <div
        className="text-[11px] font-semibold tracking-[0.12em] uppercase"
        style={{ color: labelFg }}
      >
        {label}
      </div>
      <div className="mt-2 font-display text-[40px] leading-none font-semibold tracking-[-0.02em]">
        {value}
      </div>
      <div className="mt-2 text-xs" style={{ color: subFg }}>
        {sub}
      </div>
    </div>
  );
}
