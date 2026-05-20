"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { useFileSante } from "@/hooks/useFileSante";
import { decideReferral } from "@/lib/filesante/store";
import type { Referral, ReferralStatus } from "@/lib/filesante/types";

type TabKey = "pending" | "accepted" | "refused" | "all";

const TABS: { key: TabKey; label: string }[] = [
  { key: "pending", label: "En attente" },
  { key: "accepted", label: "Acceptés" },
  { key: "refused", label: "Refusés" },
  { key: "all", label: "Tous" },
];

export default function CliniqueInbox() {
  const s = useFileSante();
  const [tab, setTab] = useState<TabKey>("pending");
  const [q, setQ] = useState("");

  const counts = useMemo(() => {
    return {
      pending: s.referrals.filter((r) => r.status === "PENDING").length,
      accepted: s.referrals.filter((r) => r.status === "ACCEPTED").length,
      refused: s.referrals.filter((r) => r.status === "REFUSED").length,
      all: s.referrals.length,
    };
  }, [s.referrals]);

  const filtered = useMemo(() => {
    let list = s.referrals;
    if (tab === "pending")
      list = list.filter((r) => r.status === "PENDING");
    else if (tab === "accepted")
      list = list.filter((r) => r.status === "ACCEPTED");
    else if (tab === "refused")
      list = list.filter((r) => r.status === "REFUSED");
    const term = q.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (r) =>
          r.patientName.toLowerCase().includes(term) ||
          r.motif.toLowerCase().includes(term) ||
          r.sourceLabel.toLowerCase().includes(term),
      );
    }
    return [...list].sort((a, b) => b.receivedAt - a.receivedAt);
  }, [s.referrals, tab, q]);

  return (
    <>
      <PageHeader
        eyebrow="Première ligne · GMF Plateau"
        title="Demandes reçues"
        description="Acceptez ou refusez les patients orientés par le triage hospitalier et 811."
      />

      <div className="flex flex-col gap-6 px-10 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="fs-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                data-active={tab === t.key}
                onClick={() => setTab(t.key)}
              >
                {t.label}
                <span className="ml-1.5 text-[11px] text-[var(--ap-ink-muted-48)] tabular-nums">
                  {counts[t.key]}
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-[320px]">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher patient, motif, source…"
              className="h-11 rounded-full pr-4 pl-10 text-[14px]"
            />
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[var(--ap-ink-muted-48)]">
              <Icon name="search" size={16} />
            </span>
          </div>
        </div>

        <div className="fs-dash-card-flush">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Icon name="checkCircle" size={20} />}
              title="Aucune demande"
              description={
                q
                  ? "Aucun résultat pour cette recherche."
                  : tab === "pending"
                    ? "Vous êtes à jour. Les nouvelles demandes apparaîtront ici."
                    : "Aucune demande dans cette catégorie."
              }
            />
          ) : (
            <ul className="divide-y divide-[var(--ap-hairline)]">
              {filtered.map((r) => (
                <ReferralRow
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
      </div>
    </>
  );
}

const SOURCE_COLOR: Record<Referral["source"], string> = {
  TRIAGE: "#c8102e",
  HOTLINE_811: "#0d74ce",
  EMS_911: "#a06400",
};

function ReferralRow({
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
  const isPending = referral.status === "PENDING";
  const sourceColor = SOURCE_COLOR[referral.source];
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
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[14px] font-semibold text-[var(--ap-ink)]">
            {referral.patientName}
          </span>
          <span className="fs-chip fs-chip-primary">{referral.priority}</span>
          <span
            className="fs-chip"
            style={{ background: `${sourceColor}1a`, color: sourceColor }}
          >
            {referral.sourceLabel}
          </span>
        </div>
        <div className="mt-0.5 text-[12.5px] text-[var(--ap-ink-muted-80)]">
          {referral.motif}
        </div>
      </div>
      {isPending ? (
        <>
          <div className="text-right">
            <div className="font-mono text-[13px] font-semibold tabular-nums text-[#c8102e]">
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
        </>
      ) : (
        <StatusPill status={referral.status} />
      )}
    </li>
  );
}

function StatusPill({ status }: { status: ReferralStatus }) {
  const tone =
    status === "ACCEPTED"
      ? { bg: "rgba(52,199,89,0.12)", fg: "#1a6d2f", label: "Accepté" }
      : status === "REFUSED"
        ? { bg: "rgba(200,16,46,0.1)", fg: "#c8102e", label: "Refusé" }
        : { bg: "rgba(255,159,10,0.16)", fg: "#a06400", label: "Expiré" };
  return (
    <span
      className="fs-chip"
      style={{ background: tone.bg, color: tone.fg }}
    >
      {tone.label}
    </span>
  );
}
