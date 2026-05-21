"use client";

import { IconCircleCheck, IconMessage2, IconQrcode } from "@tabler/icons-react";

type Props = {
  onOpenLogin: () => void;
};

export function Hero({ onOpenLogin }: Props) {
  return (
    <section className="overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16">
      <div className="fs-shell">
        <div className="grid items-center gap-8 lg:gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <div className="mb-4 sm:mb-5 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-fs-primary uppercase">
              <span className="fs-pulse-dot" />
              Projet pilote · Montréal 2026
            </div>
            <h1 className="text-[clamp(32px,7vw,64px)] leading-[1.02] tracking-[-0.03em]">
              Le bon patient,
              <br />
              au bon endroit, <span className="fs-accent">en temps réel</span>.
            </h1>
            <p className="mt-4 sm:mt-5 max-w-130 text-[15px] sm:text-[17px] text-fs-ink-2">
              FileSanté oriente les patients P4 et P5 vers les ressources de
              première ligne disponibles — GMF, CLSC, IPS, UMF — pour
              désengorger l&apos;urgence et réduire les temps d&apos;attente.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <button className="fs-pill w-full sm:w-auto" onClick={onOpenLogin} type="button">
                Accéder au portail
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </button>
              <a className="fs-pill fs-pill-ghost w-full sm:w-auto justify-center" href="#flow">
                En savoir plus
              </a>
            </div>
            <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-4 sm:gap-8">
              <HeroStat num="4" label="Hôpitaux pilotes" />
              <div className="h-7 sm:h-9 w-px bg-[var(--fs-line)]" />
              <HeroStat num="7" label="Portails de rôle" />
              <div className="h-7 sm:h-9 w-px bg-[var(--fs-line)]" />
              <HeroStat num="P4 / P5" label="Patients ciblés" />
            </div>
          </div>

          <div className="hidden lg:block">
            <DashboardPanel />
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-display text-[28px] leading-none font-semibold tracking-[-0.02em] text-[var(--fs-ink)]">
        {num}
      </span>
      <span className="text-xs tracking-[0.04em] text-[var(--fs-ink-3)] uppercase">
        {label}
      </span>
    </div>
  );
}

function DashboardPanel() {
  return (
    <div className="relative">
      <div
        className="overflow-hidden rounded-3xl border border-[var(--fs-line)] bg-white"
        style={{ boxShadow: "0 30px 60px -30px rgba(15, 111, 180, 0.35), 0 8px 20px -10px rgba(15, 111, 180, 0.15)" }}
      >
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-[var(--fs-line)] bg-[var(--bg-soft-2,#f3f8fc)] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="font-mono text-[11px] text-[var(--fs-ink-3)]">
            filesante.qc/dashboard/triage/queue
          </div>
          <div className="w-12" />
        </div>

        <div className="grid grid-cols-[170px_1fr] gap-0">
          {/* Mini sidebar */}
          <div className="border-r border-[var(--fs-line)] bg-white p-3">
            <div className="mb-2 text-[9px] font-semibold tracking-[0.1em] text-[var(--fs-ink-3)] uppercase">
              Pilotage
            </div>
            {[
              { label: "Vue d'ensemble", active: false },
              { label: "File d'attente", active: true },
              { label: "Indicateurs", active: false },
            ].map((it) => (
              <div
                key={it.label}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[10.5px] ${
                  it.active
                    ? "bg-[var(--fs-bg-soft)] font-semibold text-[var(--fs-primary)]"
                    : "text-[var(--fs-ink-2)]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    it.active ? "bg-[var(--fs-primary)]" : "bg-[var(--fs-ink-3)] opacity-40"
                  }`}
                />
                {it.label}
              </div>
            ))}
            <div className="mt-3 mb-2 text-[9px] font-semibold tracking-[0.1em] text-[var(--fs-ink-3)] uppercase">
              Opérations
            </div>
            {["Inscription", "Retour patient", "Journal SMS"].map((label) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[10.5px] text-[var(--fs-ink-2)]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--fs-ink-3)] opacity-40" />
                {label}
              </div>
            ))}
          </div>

          {/* Mini queue */}
          <div className="bg-[var(--fs-bg-soft-2)] p-4">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-[14px] font-semibold tracking-[-0.016em] text-[var(--fs-ink)]">
                  File d&apos;attente
                </h3>
                <p className="mt-0.5 text-[10.5px] text-[var(--fs-ink-3)]">
                  Patients P4 / P5 actifs · temps réel
                </p>
              </div>
              <span className="rounded-full bg-[var(--fs-bg-soft)] px-2 py-0.5 text-[9.5px] font-semibold text-[var(--fs-primary)]">
                6 actifs
              </span>
            </div>

            <div className="mt-3 overflow-hidden rounded-lg border border-[var(--fs-line)] bg-white">
              {[
                { name: "Antoine Gagnon", code: "4218", status: "Inscrit", dot: "#1e90d6" },
                { name: "Olivier Bélanger", code: "1875", status: "À confirmer", dot: "#ff9f0a" },
                { name: "Jean-F. Lavoie", code: "5503", status: "Confirmé", dot: "#34c759" },
                { name: "Élise Pelletier", code: "2147", status: "Confirmé", dot: "#34c759" },
                { name: "Mohammed Hassan", code: "6890", status: "Arrivé", dot: "#007aff" },
              ].map((row, i) => (
                <div
                  key={row.code}
                  className={`flex items-center gap-2.5 px-3 py-2 text-[10.5px] ${
                    i > 0 ? "border-t border-[var(--fs-line)]" : ""
                  }`}
                >
                  <div className="grid h-5 w-5 place-items-center rounded-full bg-[var(--fs-bg-soft-2)] text-[8px] font-semibold text-[var(--fs-ink-2)]">
                    {row.name
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <span className="flex-1 truncate font-medium text-[var(--fs-ink)]">
                    {row.name}
                  </span>
                  <span className="font-mono tabular-nums text-[var(--fs-primary)]">
                    {row.code}
                  </span>
                  <span className="flex items-center gap-1 text-[9.5px] text-[var(--fs-ink-3)]">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: row.dot }}
                    />
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingNotif({
  className,
  icon,
  title,
  body,
  tone = "neutral",
}: {
  className?: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  tone?: "neutral" | "success" | "primary";
}) {
  const toneCls = {
    neutral: "bg-[var(--fs-bg-soft)] text-[var(--fs-primary)]",
    success: "bg-[#e6f7ee] text-[#108a52]",
    primary: "bg-[var(--fs-bg-soft)] text-[var(--fs-primary)]",
  }[tone];
  return (
    <div
      className={`absolute z-10 flex items-center gap-2.5 rounded-2xl border border-[var(--fs-line)] bg-white/95 p-2.5 pr-3.5 backdrop-blur ${className ?? ""}`}
      style={{ boxShadow: "0 14px 30px -10px rgba(0, 0, 0, 0.18)" }}
    >
      <div className={`grid h-7 w-7 place-items-center rounded-lg ${toneCls}`}>
        {icon}
      </div>
      <div>
        <div className="text-[12px] font-semibold tracking-[-0.01em] text-[var(--fs-ink)]">
          {title}
        </div>
        <div className="text-[10.5px] text-[var(--fs-ink-3)]">{body}</div>
      </div>
    </div>
  );
}
