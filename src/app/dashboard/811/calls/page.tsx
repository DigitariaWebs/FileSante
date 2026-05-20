"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Icon } from "@/components/ui/Icon";
import { Input } from "@/components/ui/input";
import { useFileSante } from "@/hooks/useFileSante";
import { isActive } from "@/lib/filesante/store";
import type { Patient } from "@/lib/filesante/types";

type TabKey = "all" | "active" | "closed";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "active", label: "Actifs" },
  { key: "closed", label: "Fermés" },
];

const MIN = 60_000;

export default function HotlineCalls() {
  const s = useFileSante();
  const [tab, setTab] = useState<TabKey>("all");
  const [q, setQ] = useState("");

  const calls = useMemo(
    () => s.patients.filter((p) => p.origin === "HOME_811"),
    [s.patients],
  );

  const filtered = useMemo(() => {
    let list = calls;
    if (tab === "active") list = list.filter(isActive);
    else if (tab === "closed") list = list.filter((p) => !isActive(p));
    const term = q.trim().toLowerCase();
    if (term) {
      list = list.filter((p) => {
        const name = `${p.firstName} ${p.lastName}`.toLowerCase();
        return (
          name.includes(term) ||
          p.phone.toLowerCase().includes(term) ||
          p.code.includes(term) ||
          p.motif.toLowerCase().includes(term)
        );
      });
    }
    return [...list].sort((a, b) => b.registeredAt - a.registeredAt);
  }, [calls, tab, q]);

  const counts = useMemo(
    () => ({
      all: calls.length,
      active: calls.filter(isActive).length,
      closed: calls.filter((p) => !isActive(p)).length,
    }),
    [calls],
  );

  return (
    <>
      <PageHeader
        eyebrow="Info-Santé 811"
        title="Appels du quart"
        description="Historique des orientations téléphoniques."
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
              placeholder="Rechercher nom, téléphone, code…"
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
              icon={<Icon name="chat" size={20} />}
              title="Aucun appel"
              description={
                q
                  ? "Aucun résultat pour cette recherche."
                  : "Les évaluations 811 apparaîtront ici."
              }
              action={
                <Link
                  href="/dashboard/811/new"
                  className="fs-btn fs-btn-primary"
                >
                  <Icon name="userPlus" size={14} />
                  Inscrire un appelant
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="fs-dash-table">
                <thead>
                  <tr>
                    <th>Appelant</th>
                    <th>Priorité</th>
                    <th>Code</th>
                    <th>Statut</th>
                    <th>Téléphone</th>
                    <th>Hôpital</th>
                    <th className="text-right">Reçu</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <Row key={p.id} p={p} now={s.simClock} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Row({ p, now }: { p: Patient; now: number }) {
  const minutesAgo = Math.max(0, Math.floor((now - p.registeredAt) / MIN));
  const label =
    minutesAgo < 60
      ? `il y a ${minutesAgo} min`
      : `il y a ${Math.floor(minutesAgo / 60)}h${(minutesAgo % 60)
          .toString()
          .padStart(2, "0")}`;
  return (
    <tr>
      <td>
        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--ap-canvas-parchment)] text-[12px] font-semibold text-[var(--ap-ink-muted-80)]">
            {p.firstName.charAt(0)}
            {p.lastName.charAt(0)}
          </div>
          <div>
            <div className="text-[14px] font-semibold tracking-[-0.016em] text-[var(--ap-ink)]">
              {p.firstName} {p.lastName}
            </div>
            <div className="text-[12px] text-[var(--ap-ink-muted-48)]">
              {p.motif}
            </div>
          </div>
        </div>
      </td>
      <td>
        <span className="fs-chip fs-chip-primary">{p.priority}</span>
      </td>
      <td>
        <span className="font-mono text-[13px] font-semibold tracking-[0.04em] tabular-nums text-[var(--fs-primary)]">
          {p.code}
        </span>
      </td>
      <td>
        <StatusBadge status={p.status} />
      </td>
      <td className="font-mono text-[12.5px] tabular-nums text-[var(--ap-ink-muted-80)]">
        {p.phone}
      </td>
      <td className="text-[14px] font-medium text-[var(--ap-ink-muted-80)]">
        {p.hospital}
      </td>
      <td className="text-right text-[12px] text-[var(--ap-ink-muted-48)]">
        {label}
      </td>
    </tr>
  );
}
