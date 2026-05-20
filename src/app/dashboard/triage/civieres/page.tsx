"use client";

import { useMemo, useState } from "react";

import { AddStretcherModal } from "@/components/dashboard/AddStretcherModal";
import { CiviereAlertBar } from "@/components/dashboard/CiviereAlertBar";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import {
  removeCiviere,
  setCiviereStatus,
} from "@/lib/filesante/store";
import type { Civiere, CiviereStatus } from "@/lib/filesante/types";

const MIN = 60_000;

const STATUS_LABEL: Record<CiviereStatus, string> = {
  AWAITING_RESULTS: "Attente résultats",
  RESULTS_IN: "Résultats reçus",
  DECISION: "Décision médicale",
  DISCHARGED: "Libérée",
};

const STATUS_TONE: Record<CiviereStatus, string> = {
  AWAITING_RESULTS: "bg-[#fff8e6] text-[#a06400] border-[#ffd789]",
  RESULTS_IN: "bg-[rgba(30,144,214,0.08)] text-[var(--fs-primary)] border-[rgba(30,144,214,0.3)]",
  DECISION: "bg-[rgba(124,58,237,0.08)] text-[#5b21b6] border-[rgba(124,58,237,0.3)]",
  DISCHARGED: "bg-[rgba(52,199,89,0.1)] text-[#1a6d2f] border-[rgba(52,199,89,0.3)]",
};

const REASON_LABEL = {
  LABO: "Laboratoire",
  RADIO: "Radiologie",
  CONSULTANT: "Consultant",
  OTHER: "Autre",
};

const NEXT_STATUS: Record<CiviereStatus, CiviereStatus | null> = {
  AWAITING_RESULTS: "RESULTS_IN",
  RESULTS_IN: "DECISION",
  DECISION: "DISCHARGED",
  DISCHARGED: null,
};

const NEXT_LABEL: Record<CiviereStatus, string> = {
  AWAITING_RESULTS: "Résultats reçus",
  RESULTS_IN: "Passer en décision",
  DECISION: "Libérer civière",
  DISCHARGED: "—",
};

export default function CivieresPage() {
  const s = useFileSante();
  const [openAdd, setOpenAdd] = useState(false);

  const active = useMemo(
    () => s.civieres.filter((c) => c.status !== "DISCHARGED"),
    [s.civieres],
  );
  const released = useMemo(
    () =>
      s.civieres
        .filter((c) => c.status === "DISCHARGED")
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 10),
    [s.civieres],
  );

  return (
    <>
      <PageHeader
        eyebrow="Urgence · civières"
        title="Suivi des civières"
        description="Patients sur civière à l'urgence — flux laboratoire / radio / consultant / décision."
        actions={
          <button
            type="button"
            onClick={() => setOpenAdd(true)}
            className="fs-btn fs-btn-primary"
          >
            <Icon name="userPlus" size={14} />
            Ajouter civière
          </button>
        }
      />

      <div className="flex flex-col gap-6 px-10 py-8">
        <CiviereAlertBar />

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Tile
            label="Civières actives"
            value={active.length}
            sub="Patients en cours"
            tone="info"
          />
          <Tile
            label="Disponibles"
            value={`${s.staff.civieresAvail}/${s.staff.civieresTotal}`}
            sub={`${Math.round((s.staff.civieresAvail / s.staff.civieresTotal) * 100)}% libres`}
            tone={s.staff.civieresAvail < 4 ? "danger" : "neutral"}
          />
          <Tile
            label="Attente résultats"
            value={
              active.filter((c) => c.status === "AWAITING_RESULTS").length
            }
            sub="Labo · radio · consultant"
            tone="warn"
          />
          <Tile
            label="En décision"
            value={active.filter((c) => c.status === "DECISION").length}
            sub="Orientation à conclure"
            tone="neutral"
          />
        </section>

        <section className="fs-dash-card-flush">
          <div className="border-b border-[var(--ap-hairline)] px-6 py-4">
            <div className="fs-eyebrow">Civières en cours</div>
            <h2 className="fs-tagline mt-1">
              {active.length} patient{active.length === 1 ? "" : "s"} sur civière
            </h2>
          </div>
          {active.length === 0 ? (
            <EmptyState
              icon={<Icon name="checkCircle" size={20} />}
              title="Aucune civière occupée"
              description="Tous les patients ont été libérés."
              action={
                <button
                  type="button"
                  onClick={() => setOpenAdd(true)}
                  className="fs-btn fs-btn-primary"
                >
                  <Icon name="userPlus" size={14} />
                  Ajouter civière
                </button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="fs-dash-table">
                <thead>
                  <tr>
                    <th>Civière</th>
                    <th>Patient</th>
                    <th>Motif</th>
                    <th>Statut</th>
                    <th>Durée</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...active]
                    .sort((a, b) => a.stretcherNum - b.stretcherNum)
                    .map((c) => (
                      <Row key={c.id} c={c} simClock={s.simClock} />
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {released.length > 0 && (
          <section className="fs-dash-card-flush">
            <div className="border-b border-[var(--ap-hairline)] px-6 py-4">
              <div className="fs-eyebrow">Civières libérées · dernières</div>
              <h2 className="fs-tagline mt-1">Historique récent</h2>
            </div>
            <ul className="divide-y divide-[var(--ap-hairline)]">
              {released.map((c) => {
                const ageMin = Math.floor((s.simClock - c.createdAt) / MIN);
                return (
                  <li
                    key={c.id}
                    className="flex items-center gap-4 px-6 py-3.5"
                  >
                    <span className="font-mono text-[13px] font-semibold text-[var(--ap-ink-muted-80)] tabular-nums">
                      #{c.stretcherNum}
                    </span>
                    <span className="text-[13.5px] font-medium text-[var(--ap-ink)]">
                      {c.patientName}
                    </span>
                    <span className="text-[12px] text-[var(--ap-ink-muted-48)]">
                      {REASON_LABEL[c.reason]} · {Math.floor(ageMin / 60)}h
                      {(ageMin % 60).toString().padStart(2, "0")}
                    </span>
                    <span className={`fs-chip ml-auto`}>libérée</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>

      <AddStretcherModal open={openAdd} onClose={() => setOpenAdd(false)} />
    </>
  );
}

function Row({ c, simClock }: { c: Civiere; simClock: number }) {
  const ageMin = Math.max(0, Math.floor((simClock - c.createdAt) / MIN));
  const next = NEXT_STATUS[c.status];
  return (
    <tr>
      <td>
        <span className="font-mono text-[15px] font-semibold tabular-nums text-[var(--ap-ink)]">
          #{c.stretcherNum}
        </span>
      </td>
      <td>
        <div className="text-[14px] font-semibold text-[var(--ap-ink)]">
          {c.patientName}
        </div>
      </td>
      <td className="text-[13px] text-[var(--ap-ink-muted-80)]">
        {REASON_LABEL[c.reason]}
      </td>
      <td>
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold ${STATUS_TONE[c.status]}`}
        >
          {STATUS_LABEL[c.status]}
        </span>
      </td>
      <td>
        <span className="font-mono text-[13px] tabular-nums text-[var(--ap-ink-muted-80)]">
          {Math.floor(ageMin / 60)}h{(ageMin % 60).toString().padStart(2, "0")}
        </span>
      </td>
      <td className="text-right">
        <div className="inline-flex items-center gap-1.5">
          {next && (
            <button
              type="button"
              onClick={() => setCiviereStatus(c.id, next)}
              className="fs-btn fs-btn-primary fs-btn-sm"
            >
              {NEXT_LABEL[c.status]}
            </button>
          )}
          <button
            type="button"
            onClick={() => removeCiviere(c.id)}
            className="fs-btn fs-btn-pearl fs-btn-sm"
            title="Retirer de la liste"
          >
            <Icon name="x" size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function Tile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string | number;
  sub: string;
  tone: "info" | "warn" | "danger" | "neutral";
}) {
  const cls = {
    info: "bg-[rgba(30,144,214,0.08)] text-[var(--fs-primary)]",
    warn: "bg-[rgba(255,159,10,0.16)] text-[#a06400]",
    danger: "bg-[rgba(200,16,46,0.1)] text-[#c8102e]",
    neutral: "bg-[var(--ap-surface-strong)] text-[var(--ap-ink-muted-80)]",
  }[tone];
  return (
    <div className="fs-stat-tile">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="fs-eyebrow">{label}</div>
          <div className="fs-display-md mt-3 leading-none tabular-nums">
            {value}
          </div>
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-md ${cls}`}>
          <Icon name="archive" size={18} />
        </div>
      </div>
      <p className="mt-4 text-[12.5px] text-[var(--ap-ink-muted-80)]">{sub}</p>
    </div>
  );
}
