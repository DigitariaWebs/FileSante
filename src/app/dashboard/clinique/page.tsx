"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";

type ReferralStatus = "PENDING" | "ACCEPTED" | "REFUSED" | "EXPIRED";

type Referral = {
  id: string;
  patientInitials: string;
  patientName: string;
  source: "TRIAGE" | "811" | "911";
  sourceLabel: string;
  motif: string;
  priority: "P4" | "P5";
  receivedAt: number; // minutes ago (sim)
  slaSecondsLeft: number; // countdown until expiry
  status: ReferralStatus;
};

const INITIAL_REFERRALS: Referral[] = [
  {
    id: "r_001",
    patientInitials: "AG",
    patientName: "Antoine Gagnon",
    source: "TRIAGE",
    sourceLabel: "Triage HMR",
    motif: "Douleur lombaire persistante depuis 3 jours",
    priority: "P4",
    receivedAt: 2,
    slaSecondsLeft: 24,
    status: "PENDING",
  },
  {
    id: "r_002",
    patientInitials: "SR",
    patientName: "Sophie Roy",
    source: "811",
    sourceLabel: "Info-Santé 811",
    motif: "Suspicion d'otite — adulte",
    priority: "P5",
    receivedAt: 4,
    slaSecondsLeft: 14,
    status: "PENDING",
  },
  {
    id: "r_003",
    patientInitials: "OB",
    patientName: "Olivier Bélanger",
    source: "TRIAGE",
    sourceLabel: "Triage HMR",
    motif: "Fièvre 38,5°C — adulte autonome",
    priority: "P4",
    receivedAt: 7,
    slaSecondsLeft: 0,
    status: "ACCEPTED",
  },
  {
    id: "r_004",
    patientInitials: "ÉP",
    patientName: "Élise Pelletier",
    source: "811",
    sourceLabel: "Info-Santé 811",
    motif: "Migraine — antécédents connus",
    priority: "P4",
    receivedAt: 12,
    slaSecondsLeft: 0,
    status: "REFUSED",
  },
];

export default function CliniqueHome() {
  const s = useFileSante();
  const [referrals, setReferrals] = useState<Referral[]>(INITIAL_REFERRALS);
  const [load, setLoad] = useState(0.62); // 62% capacity start

  const counts = useMemo(() => {
    const pending = referrals.filter((r) => r.status === "PENDING").length;
    const accepted = referrals.filter((r) => r.status === "ACCEPTED").length;
    const refused = referrals.filter((r) => r.status === "REFUSED").length;
    return { pending, accepted, refused, total: referrals.length };
  }, [referrals]);

  function decide(id: string, status: "ACCEPTED" | "REFUSED") {
    setReferrals((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, slaSecondsLeft: 0 } : r)),
    );
    if (status === "ACCEPTED") {
      setLoad((l) => Math.min(0.98, l + 0.05));
    }
  }

  // Mock heartbeat series — last 12 sim hours of patient acceptance throughput
  const heartbeat = useMemo(() => {
    const buckets = 12;
    const arr = new Array(buckets).fill(0).map((_, i) => {
      const base = 2 + Math.sin(i * 0.7 + s.simClock / 600000) * 1.6;
      return Math.max(0, Math.round(base + (i % 3 === 0 ? 1 : 0)));
    });
    return arr;
  }, [s.simClock]);

  const loadPct = Math.round(load * 100);
  const loadBarColor =
    load > 0.85 ? "#c8102e" : load > 0.65 ? "#ff9f0a" : "#34c759";

  return (
    <>
      <PageHeader
        eyebrow="Première ligne · GMF Plateau"
        title="Demandes de référencement"
        description="Acceptez ou refusez les patients orientés par le triage hospitalier et 811."
        actions={
          <button
            type="button"
            onClick={() => setLoad(0.62)}
            className="fs-btn fs-btn-pearl"
          >
            <Icon name="refresh" size={14} />
            Réinitialiser charge
          </button>
        }
      />

      <div className="flex flex-col gap-10 px-10 py-10">
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Tile
            label="En attente"
            value={counts.pending}
            sub="Délai SLA 30 s par demande"
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
            sub="14 / 22 patients aujourd'hui"
            icon="graphUp"
            tone={load > 0.85 ? "danger" : load > 0.65 ? "warn" : "success"}
          />
        </section>

        {/* Capacity bar */}
        <section className="fs-dash-card p-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="fs-eyebrow">Capacité quotidienne</div>
              <h2 className="fs-tagline mt-1">
                Charge vs plages disponibles
              </h2>
              <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
                Capacité totale: 22 patients/jour · 1 MD + 1 IPS sur place
              </p>
            </div>
            <div className="text-right">
              <div className="font-mono text-[34px] font-semibold leading-none tabular-nums text-[var(--ap-ink)]">
                {Math.round(load * 22)}
                <span className="text-[var(--ap-ink-muted-48)]">/22</span>
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
            <span>11</span>
            <span>22</span>
          </div>
        </section>

        {/* Inbox */}
        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="fs-dash-card-flush">
            <div className="flex items-end justify-between border-b border-[var(--ap-hairline)] px-6 py-4">
              <div>
                <div className="fs-eyebrow">Inbox</div>
                <h2 className="fs-tagline mt-1">
                  Demandes en attente de décision
                </h2>
                <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
                  Acceptez en moins de 30 s — sinon la demande est routée
                  ailleurs automatiquement.
                </p>
              </div>
              <span
                className="fs-chip"
                style={
                  counts.pending > 0
                    ? { background: "rgba(255,159,10,0.16)", color: "#a06400" }
                    : undefined
                }
              >
                {counts.pending} en attente
              </span>
            </div>

            {referrals.filter((r) => r.status === "PENDING").length === 0 ? (
              <EmptyState
                icon={<Icon name="checkCircle" size={18} />}
                title="Aucune demande en attente"
                description="Vous êtes à jour. Les nouvelles demandes arriveront ici en temps réel."
              />
            ) : (
              <ul className="divide-y divide-[var(--ap-hairline)]">
                {referrals
                  .filter((r) => r.status === "PENDING")
                  .map((r) => (
                    <ReferralRow
                      key={r.id}
                      ref={r}
                      onAccept={() => decide(r.id, "ACCEPTED")}
                      onRefuse={() => decide(r.id, "REFUSED")}
                    />
                  ))}
              </ul>
            )}
          </div>

          {/* Heartbeat + activity */}
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
              <dt className="text-[var(--ap-ink-muted-80)]">Champ d&apos;exercice</dt>
              <dd className="text-right font-medium text-[var(--ap-ink)]">
                P4 / P5
              </dd>
            </dl>
          </div>
        </section>

        {/* Recent decisions */}
        <section className="fs-dash-card-flush">
          <div className="border-b border-[var(--ap-hairline)] px-6 py-4">
            <div className="fs-eyebrow">Historique</div>
            <h2 className="fs-tagline mt-1">Décisions récentes</h2>
          </div>
          <ul className="divide-y divide-[var(--ap-hairline)]">
            {referrals
              .filter((r) => r.status !== "PENDING")
              .map((r) => (
                <ReferralRow key={r.id} ref={r} />
              ))}
          </ul>
        </section>
      </div>
    </>
  );
}

function ReferralRow({
  ref,
  onAccept,
  onRefuse,
}: {
  ref: Referral;
  onAccept?: () => void;
  onRefuse?: () => void;
}) {
  const isPending = ref.status === "PENDING";
  const sourceColor =
    ref.source === "TRIAGE"
      ? "#c8102e"
      : ref.source === "811"
        ? "#0d74ce"
        : "#a06400";
  return (
    <li className="flex items-center gap-4 px-6 py-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--ap-surface-strong)] text-[12.5px] font-semibold text-[var(--ap-ink-muted-80)]">
        {ref.patientInitials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold tracking-[-0.016em] text-[var(--ap-ink)]">
            {ref.patientName}
          </span>
          <span className="fs-chip fs-chip-primary">{ref.priority}</span>
          <span
            className="fs-chip"
            style={{
              background: `${sourceColor}1a`,
              color: sourceColor,
            }}
          >
            {ref.sourceLabel}
          </span>
        </div>
        <div className="mt-0.5 text-[12.5px] text-[var(--ap-ink-muted-80)]">
          {ref.motif}
        </div>
      </div>
      {isPending ? (
        <>
          <div className="text-right">
            <div className="font-mono text-[12.5px] font-semibold tabular-nums text-[#c8102e]">
              {ref.slaSecondsLeft}s
            </div>
            <div className="text-[11px] text-[var(--ap-ink-muted-48)]">
              SLA
            </div>
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
        <span
          className="fs-chip"
          style={
            ref.status === "ACCEPTED"
              ? { background: "rgba(52,199,89,0.12)", color: "#1a6d2f" }
              : { background: "rgba(200,16,46,0.1)", color: "#c8102e" }
          }
        >
          {ref.status === "ACCEPTED" ? "Accepté" : "Refusé"}
        </span>
      )}
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
