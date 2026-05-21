"use client";

import Link from "next/link";
import { useMemo } from "react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { decideReferral } from "@/lib/filesante/store";
import type { Referral } from "@/lib/filesante/types";
import {
  PDF_COLORS,
  dataTable,
  downloadPdf,
  nowStamp,
  reportHeader,
  sectionTitle,
  statTiles,
} from "@/lib/pdf/export";

export default function CliniqueHome() {
  const s = useFileSante();

  const counts = useMemo(() => {
    const pending = s.referrals.filter((r) => r.status === "PENDING").length;
    const accepted = s.referrals.filter((r) => r.status === "ACCEPTED").length;
    const refused = s.referrals.filter((r) => r.status === "REFUSED").length;
    return { pending, accepted, refused, total: s.referrals.length };
  }, [s.referrals]);

  const topPending = useMemo(
    () =>
      s.referrals
        .filter((r) => r.status === "PENDING")
        .sort((a, b) => a.slaDeadlineAt - b.slaDeadlineAt)
        .slice(0, 3),
    [s.referrals],
  );

  // Mock 12-bucket heartbeat that drifts with simClock
  const heartbeat = useMemo(() => {
    const buckets = 12;
    return new Array(buckets).fill(0).map((_, i) => {
      const base = 2 + Math.sin(i * 0.7 + s.simClock / 600000) * 1.6;
      return Math.max(0, Math.round(base + (i % 3 === 0 ? 1 : 0)));
    });
  }, [s.simClock]);

  const load = s.clinic.currentLoad;
  const loadPct = Math.round(load * 100);
  const loadBarColor =
    load > 0.85 ? "#c8102e" : load > 0.65 ? "#ff9f0a" : "#34c759";

  return (
    <>
      <PageHeader
        eyebrow="Première ligne · GMF Plateau"
        title="Vue d'ensemble"
        description="Demandes reçues, charge actuelle et heartbeat de la clinique."
        actions={
          <button
            type="button"
            onClick={() =>
              exportCliniquePdf({
                counts,
                load,
                loadPct,
                totalDaily: s.clinic.totalDaily,
                pending: s.referrals.filter((r) => r.status === "PENDING"),
                accepted: s.referrals.filter((r) => r.status === "ACCEPTED"),
                refused: s.referrals.filter((r) => r.status === "REFUSED"),
              })
            }
            className="fs-btn fs-btn-pearl"
          >
            <Icon name="archive" size={14} />
            Rapport de quart
          </button>
        }
      />

      <div className="flex flex-col gap-10 px-10 py-10">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Tile
            label="En attente"
            value={counts.pending}
            sub="Délai SLA 5 min par demande"
            icon="alarm"
            tone={counts.pending > 0 ? "warn" : "neutral"}
          />
          <Tile
            label="Acceptés (quart)"
            value={counts.accepted}
            sub="Patients orientés vers ici"
            icon="checkCircle"
            tone="success"
            spark={heartbeat}
          />
          <Tile
            label="Refusés"
            value={counts.refused}
            sub="Hors capacité ou hors champ"
            icon="xCircle"
            tone={counts.refused > 0 ? "danger" : "neutral"}
          />
          <Tile
            label="Charge actuelle"
            value={`${loadPct}%`}
            sub={`${Math.round(load * s.clinic.totalDaily)} / ${s.clinic.totalDaily} patients aujourd'hui`}
            icon="graphUp"
            tone={load > 0.85 ? "danger" : load > 0.65 ? "warn" : "success"}
          />
        </section>

        {/* Capacity bar */}
        <section className="fs-dash-card p-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="fs-eyebrow">Capacité quotidienne</div>
              <h2 className="fs-tagline mt-1">Charge vs plages disponibles</h2>
              <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
                Capacité totale: {s.clinic.totalDaily} patients/jour · 1 MD +
                1 IPS sur place
              </p>
            </div>
            <div className="text-right">
              <div className="fs-display-md leading-none tabular-nums">
                {Math.round(load * s.clinic.totalDaily)}
                <span className="text-[var(--ap-ink-muted-48)]">
                  /{s.clinic.totalDaily}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-5 flex h-2 overflow-hidden rounded-full bg-[var(--ap-surface-strong)]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${loadPct}%`, background: loadBarColor }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11.5px] text-[var(--ap-ink-muted-48)]">
            <span>0</span>
            <span>{Math.round(s.clinic.totalDaily / 2)}</span>
            <span>{s.clinic.totalDaily}</span>
          </div>
        </section>

        {/* Top pending + heartbeat */}
        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="fs-dash-card-flush">
            <div className="flex items-end justify-between border-b border-[var(--ap-hairline)] px-6 py-4">
              <div>
                <div className="fs-eyebrow">À décider maintenant</div>
                <h2 className="fs-tagline mt-1">Demandes urgentes</h2>
                <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
                  Triées par SLA — agissez avant expiration.
                </p>
              </div>
              <Link
                href="/dashboard/clinique/inbox"
                className="text-[13px] font-medium text-[var(--fs-primary)] hover:underline"
              >
                Tout voir →
              </Link>
            </div>
            {topPending.length === 0 ? (
              <EmptyState
                icon={<Icon name="checkCircle" size={18} />}
                title="Aucune demande en attente"
                description="Vous êtes à jour. Les nouvelles demandes apparaîtront ici."
              />
            ) : (
              <ul className="divide-y divide-[var(--ap-hairline)]">
                {topPending.map((r) => (
                  <ReferralPreview
                    key={r.id}
                    referral={r}
                    now={s.simClock}
                    onAccept={() => decideReferral(r.id, "ACCEPTED")}
                    onRefuse={() => decideReferral(r.id, "REFUSED")}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="fs-dash-card p-6">
            <div className="fs-eyebrow">Activité 24 h</div>
            <h2 className="fs-tagline mt-1">Heartbeat</h2>
            <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
              Patients reçus par heure.
            </p>
            <div className="mt-5">
              <Sparkline
                data={heartbeat}
                width={420}
                height={80}
                stroke="#34c759"
                fill="rgba(52,199,89,0.14)"
              />
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-y-3 border-t border-[var(--ap-hairline)] pt-5 text-[13px]">
              <dt className="text-[var(--ap-ink-muted-80)]">Secteur</dt>
              <dd className="text-right font-medium text-[var(--ap-ink)]">
                Plateau-Mont-Royal
              </dd>
              <dt className="text-[var(--ap-ink-muted-80)]">CIUSSS</dt>
              <dd className="text-right font-medium text-[var(--ap-ink)]">
                Centre-Sud
              </dd>
              <dt className="text-[var(--ap-ink-muted-80)]">Heures</dt>
              <dd className="text-right font-medium text-[var(--ap-ink)]">
                08:00 – 20:00
              </dd>
              <dt className="text-[var(--ap-ink-muted-80)]">
                Champ d&apos;exercice
              </dt>
              <dd className="text-right font-medium text-[var(--ap-ink)]">
                P4 / P5
              </dd>
            </dl>
          </div>
        </section>
      </div>
    </>
  );
}

async function exportCliniquePdf(args: {
  counts: { pending: number; accepted: number; refused: number; total: number };
  load: number;
  loadPct: number;
  totalDaily: number;
  pending: Referral[];
  accepted: Referral[];
  refused: Referral[];
}) {
  const renderReferral = (r: Referral) => r.patientName;
  await downloadPdf({
    filename: `filesante-clinique-${nowStamp()}.pdf`,
    content: [
      ...reportHeader({
        eyebrow: "Première ligne · GMF Plateau",
        title: "Rapport de quart — clinique",
        subtitle: "Demandes reçues, décisions et charge.",
        metadata: [
          { label: "Édité", value: new Date().toLocaleString("fr-CA") },
          { label: "Secteur", value: "Plateau-Mont-Royal" },
          { label: "Heures", value: "08:00 – 20:00" },
          { label: "Champ d'exercice", value: "P4 / P5" },
        ],
      }),
      sectionTitle("Indicateurs"),
      statTiles([
        {
          label: "En attente",
          value: args.counts.pending,
          tone: args.counts.pending > 0 ? "warn" : "default",
        },
        {
          label: "Acceptés",
          value: args.counts.accepted,
          tone: "success",
        },
        {
          label: "Refusés",
          value: args.counts.refused,
          tone: args.counts.refused > 0 ? "danger" : "default",
        },
        {
          label: "Charge actuelle",
          value: `${args.loadPct}%`,
          hint: `${Math.round(args.load * args.totalDaily)} / ${args.totalDaily} patients`,
          tone:
            args.load > 0.85 ? "danger" : args.load > 0.65 ? "warn" : "success",
        },
      ]),
      sectionTitle("Demandes en attente"),
      dataTable<Referral>(
        args.pending,
        [
          { header: "Patient", width: "*", render: renderReferral },
          { header: "Pr.", width: 25, render: (r) => r.priority },
          { header: "Source", width: 80, render: (r) => r.sourceLabel },
          {
            header: "Motif",
            width: "*",
            render: (r) => r.motif,
            color: () => PDF_COLORS.inkMuted,
          },
        ],
        { emptyText: "Aucune demande en attente." },
      ),
      sectionTitle("Demandes acceptées"),
      dataTable<Referral>(
        args.accepted,
        [
          { header: "Patient", width: "*", render: renderReferral },
          { header: "Pr.", width: 25, render: (r) => r.priority },
          { header: "Source", width: 80, render: (r) => r.sourceLabel },
          {
            header: "Motif",
            width: "*",
            render: (r) => r.motif,
            color: () => PDF_COLORS.inkMuted,
          },
        ],
        { emptyText: "Aucune demande acceptée." },
      ),
      sectionTitle("Demandes refusées"),
      dataTable<Referral>(
        args.refused,
        [
          { header: "Patient", width: "*", render: renderReferral },
          { header: "Pr.", width: 25, render: (r) => r.priority },
          { header: "Source", width: 80, render: (r) => r.sourceLabel },
          {
            header: "Motif",
            width: "*",
            render: (r) => r.motif,
            color: () => PDF_COLORS.inkMuted,
          },
        ],
        { emptyText: "Aucune demande refusée." },
      ),
    ],
  });
}

function ReferralPreview({
  referral,
  now,
  onAccept,
  onRefuse,
}: {
  referral: Referral;
  now: number;
  onAccept: () => void;
  onRefuse: () => void;
}) {
  const secLeft = Math.max(0, Math.floor((referral.slaDeadlineAt - now) / 1000));
  const minLeft = Math.floor(secLeft / 60);
  const sec = secLeft % 60;
  const slaLabel =
    secLeft > 60
      ? `${minLeft}m ${sec.toString().padStart(2, "0")}s`
      : `${secLeft}s`;
  return (
    <li className="flex items-center gap-4 px-6 py-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--ap-surface-strong)] text-[12.5px] font-semibold text-[var(--ap-ink-muted-80)]">
        {referral.patientInitials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold text-[var(--ap-ink)]">
            {referral.patientName}
          </span>
          <span className="fs-chip fs-chip-primary">{referral.priority}</span>
          <span className="fs-chip">{referral.sourceLabel}</span>
        </div>
        <div className="mt-0.5 text-[12.5px] text-[var(--ap-ink-muted-80)]">
          {referral.motif}
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-[12.5px] font-semibold tabular-nums text-[#c8102e]">
          {slaLabel}
        </div>
        <div className="text-[11px] text-[var(--ap-ink-muted-48)]">SLA</div>
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={onAccept}
          className="fs-btn fs-btn-primary fs-btn-sm"
        >
          Accepter
        </button>
        <button
          type="button"
          onClick={onRefuse}
          className="fs-btn fs-btn-danger fs-btn-sm"
        >
          Refuser
        </button>
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
