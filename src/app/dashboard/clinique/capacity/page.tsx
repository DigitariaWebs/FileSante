"use client";

import { useMemo, useState } from "react";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { Icon, type IconName } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { setClinicCapacity } from "@/lib/filesante/store";

const HOURS = [
  "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19",
];

export default function CliniqueCapacityPage() {
  const s = useFileSante();
  const [draftCapacity, setDraftCapacity] = useState(
    s.clinic.totalDaily.toString(),
  );
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = s.clinic.currentLoad;
  const totalDaily = s.clinic.totalDaily;
  const currentSeen = Math.round(load * totalDaily);
  const loadPct = Math.round(load * 100);
  const loadBarColor =
    load > 0.85 ? "#c8102e" : load > 0.65 ? "#ff9f0a" : "#34c759";

  // Hourly bookings (mock, deterministic from simClock)
  const hourly = useMemo(() => {
    return HOURS.map((_, i) => {
      const t = (i / HOURS.length) * Math.PI;
      const noisy = 0.5 + Math.sin(t * 1.4 + s.simClock / 900000) * 0.45;
      const norm = Math.max(0, Math.min(1, noisy));
      return Math.round(norm * (totalDaily / HOURS.length) * 2.4);
    });
  }, [s.simClock, totalDaily]);

  const hourlyMax = Math.max(1, ...hourly);
  const acceptedToday = currentSeen;
  const remainingSlots = Math.max(0, totalDaily - currentSeen);

  function applyCapacity() {
    const v = Number(draftCapacity);
    if (!Number.isFinite(v) || v < 1) return;
    setClinicCapacity(v);
    setSavedAt(s.simClock);
  }

  return (
    <>
      <PageHeader
        eyebrow="Première ligne · GMF Plateau"
        title="Capacité"
        description="Charge actuelle, ventilation horaire et configuration de la capacité quotidienne."
      />

      <div className="flex flex-col gap-10 px-10 py-10">
        {/* Top tiles */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Tile
            label="Patients aujourd'hui"
            value={acceptedToday}
            sub={`sur ${totalDaily} plages`}
            icon="checkCircle"
            tone="success"
          />
          <Tile
            label="Plages restantes"
            value={remainingSlots}
            sub="Capacité disponible jusqu'à 19h"
            icon="archive"
            tone={remainingSlots < 3 ? "warn" : "neutral"}
          />
          <Tile
            label="Charge actuelle"
            value={`${loadPct}%`}
            sub="Pondération en temps réel"
            icon="graphUp"
            tone={load > 0.85 ? "danger" : load > 0.65 ? "warn" : "success"}
          />
          <Tile
            label="Pic horaire"
            value={hourly.reduce((a, b) => Math.max(a, b), 0)}
            sub="Patients reçus sur l'heure la plus chargée"
            icon="alarm"
          />
        </section>

        {/* Capacity bar */}
        <section className="fs-dash-card p-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="fs-eyebrow">Capacité quotidienne</div>
              <h2 className="fs-tagline mt-1">
                {currentSeen} / {totalDaily} patients
              </h2>
              <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
                Mise à jour à chaque acceptation de demande.
              </p>
            </div>
            <div className="text-right">
              <div className="fs-display-md leading-none tabular-nums">
                {loadPct}%
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
            <span>{Math.round(totalDaily / 2)}</span>
            <span>{totalDaily}</span>
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-end gap-2 text-[12px] text-[var(--ap-ink-muted-48)]">
            La charge augmente automatiquement à chaque acceptation de demande
            dans l&apos;inbox.
          </div>
        </section>

        {/* Hourly breakdown + capacity settings */}
        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="fs-dash-card p-6">
            <div className="flex items-end justify-between">
              <div>
                <div className="fs-eyebrow">Ventilation horaire</div>
                <h2 className="fs-tagline mt-1">Patients par heure</h2>
                <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
                  Réception 08 h – 20 h. Heures hors créneau grisées.
                </p>
              </div>
              <Sparkline
                data={hourly}
                width={140}
                height={36}
                stroke="#34c759"
                fill="rgba(52,199,89,0.14)"
              />
            </div>

            <div className="mt-6 grid grid-cols-12 items-end gap-2">
              {hourly.map((v, i) => {
                const h = Math.max(6, Math.round((v / hourlyMax) * 120));
                return (
                  <div
                    key={HOURS[i]}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full rounded-md bg-[var(--fs-primary)]"
                      style={{ height: `${h}px`, opacity: 0.85 }}
                      title={`${HOURS[i]}h — ${v} patient${v === 1 ? "" : "s"}`}
                    />
                    <div className="font-mono text-[10.5px] text-[var(--ap-ink-muted-48)] tabular-nums">
                      {HOURS[i]}
                    </div>
                    <div className="font-mono text-[10px] font-semibold tabular-nums text-[var(--ap-ink-muted-80)]">
                      {v}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="fs-dash-card p-6">
            <div className="fs-eyebrow">Paramètres</div>
            <h2 className="fs-tagline mt-1">Capacité quotidienne</h2>
            <p className="mt-1 text-[12.5px] text-[var(--ap-ink-muted-80)]">
              Ajustez le nombre maximal de plages — applique non-rétroactivement.
            </p>

            <div className="mt-5 flex items-end gap-3">
              <div className="flex-1">
                <label
                  htmlFor="capacity"
                  className="block text-[12.5px] font-medium text-[var(--ap-ink-muted-80)]"
                >
                  Plages / jour
                </label>
                <input
                  id="capacity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={120}
                  value={draftCapacity}
                  onChange={(e) => setDraftCapacity(e.target.value)}
                  className="fs-input fs-input-rect mt-1.5 font-mono tabular-nums"
                />
              </div>
              <button
                type="button"
                onClick={applyCapacity}
                className="fs-btn fs-btn-primary"
              >
                Enregistrer
              </button>
            </div>
            {savedAt !== null && (
              <p className="mt-2 text-[12px] text-[#1a6d2f]">
                Enregistré · capacité = {totalDaily}.
              </p>
            )}

            <div className="mt-6 border-t border-[var(--ap-hairline)] pt-5">
              <div className="fs-eyebrow mb-3">Contexte secteur</div>
              <dl className="grid grid-cols-2 gap-y-2.5 text-[13px]">
                <dt className="text-[var(--ap-ink-muted-80)]">Sect.</dt>
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
                <dt className="text-[var(--ap-ink-muted-80)]">Champ</dt>
                <dd className="text-right font-medium text-[var(--ap-ink)]">
                  P4 / P5
                </dd>
              </dl>
            </div>
          </div>
        </section>
      </div>
    </>
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
  tone?: "success" | "warn" | "danger" | "neutral";
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
      <p className="mt-4 text-[12.5px] text-[var(--ap-ink-muted-80)]">{sub}</p>
    </div>
  );
}
