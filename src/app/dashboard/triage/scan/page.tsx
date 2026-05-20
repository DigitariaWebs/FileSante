"use client";

import { useState } from "react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Icon } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";
import { isActive, markArrived } from "@/lib/filesante/store";

type Result =
  | { ok: true; name: string; code: string; hospital: string; at: number }
  | { ok: false; reason: string };

export default function ScanPage() {
  const s = useFileSante();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<
    { name: string; code: string; at: number }[]
  >([]);

  const eligible = s.patients
    .filter((p) => isActive(p))
    .sort((a, b) => a.estimatedSlotAt - b.estimatedSlotAt)
    .slice(0, 8);

  const recentArrivals = s.patients
    .filter((p) => p.status === "ARRIVED" || p.status === "COMPLETED")
    .sort((a, b) => (b.arrivedAt ?? 0) - (a.arrivedAt ?? 0))
    .slice(0, 5);

  function tryMark(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const parsed = trimmed.startsWith("filesante:")
      ? (trimmed.split(":")[2] ?? trimmed)
      : trimmed;
    const r = markArrived(parsed);
    if (r.ok) {
      const at = s.simClock;
      setResult({
        ok: true,
        name: `${r.patient.firstName} ${r.patient.lastName}`,
        code: r.patient.code,
        hospital: r.patient.hospital,
        at,
      });
      setHistory((h) =>
        [
          {
            name: `${r.patient.firstName} ${r.patient.lastName}`,
            code: r.patient.code,
            at,
          },
          ...h,
        ].slice(0, 5),
      );
      setCode("");
    } else {
      setResult({ ok: false, reason: r.reason });
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    tryMark(code);
  }

  return (
    <>
      <PageHeader
        eyebrow="Opérations"
        title="Retour patient"
        description="Le patient revient à l'urgence — scan QR ou code 4 chiffres, sans repasser au triage."
      />

      <div className="grid gap-6 px-10 py-10 lg:grid-cols-[1fr_380px]">
        <div className="fs-dash-card flex flex-col gap-6 p-10">
          <div className="mx-auto flex w-full max-w-[460px] flex-col gap-5">
            <div className="mx-auto fs-icon-chip fs-icon-chip-info h-14 w-14 rounded-2xl">
              <Icon name="scan" size={26} />
            </div>
            <div className="text-center">
              <h2 className="fs-display-md text-[24px]!">
                Scanner le QR ou saisir le code
              </h2>
              <p className="fs-lead mt-2 text-[15px] text-[var(--ap-ink-muted-48)]">
                Statut → ARRIVED. Le patient passe au flux d&apos;urgence
                standard.
              </p>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                inputMode="numeric"
                placeholder="4321"
                className="fs-input fs-input-rect h-16 text-center font-mono text-[28px] tracking-[0.32em] tabular-nums"
                aria-label="Code retour"
              />
              <button
                type="submit"
                className="fs-btn fs-btn-primary"
                style={{ height: 48, fontSize: 15 }}
              >
                Marquer arrivé
              </button>
            </form>

            {result && (
              <div
                className={`flex items-start gap-3 rounded-xl border p-4 text-[13.5px] ${
                  result.ok
                    ? "border-transparent bg-[var(--ap-status-success-bg)] text-[var(--ap-status-success-ink)]"
                    : "border-transparent bg-[var(--ap-status-danger-bg)] text-[var(--ap-status-danger-ink)]"
                }`}
              >
                {result.ok ? (
                  <>
                    <Icon
                      name="checkCircle"
                      size={18}
                      className="mt-0.5 shrink-0"
                    />
                    <div>
                      <div className="font-semibold">
                        {result.name} marqué arrivé
                      </div>
                      <div className="mt-0.5 text-[12.5px] opacity-80">
                        Code{" "}
                        <span className="font-mono tabular-nums">
                          {result.code}
                        </span>{" "}
                        · {result.hospital}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <Icon name="xCircle" size={18} className="mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold">Refusé</div>
                      <div className="mt-0.5 text-[12.5px] opacity-80">
                        {result.reason}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-3">
              <div className="fs-eyebrow mb-2.5">
                Codes actifs (clic pour tester)
              </div>
              {eligible.length === 0 ? (
                <p className="rounded-xl bg-[var(--ap-canvas-parchment)] px-4 py-2.5 text-[12.5px] text-[var(--ap-ink-muted-48)]">
                  Aucun code actif. Inscrivez un patient pour générer un code.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {eligible.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => tryMark(p.code)}
                      className="group inline-flex items-center gap-2 rounded-full border border-[var(--ap-hairline)] bg-[var(--ap-canvas)] px-3 py-1.5 text-[12px] transition-colors hover:border-[var(--fs-primary)] active:scale-95"
                      title={`${p.firstName} ${p.lastName} · ${p.status}`}
                    >
                      <span className="font-mono text-[12.5px] font-semibold tabular-nums text-[var(--fs-primary)]">
                        {p.code}
                      </span>
                      <span className="text-[var(--ap-ink-muted-48)] group-hover:text-[var(--ap-ink)]">
                        {p.firstName} {p.lastName.charAt(0)}.
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="fs-dash-card-flush">
            <div className="flex items-end justify-between border-b border-[var(--ap-divider-soft)] px-6 py-5">
              <h3 className="fs-tagline text-[15px]!">Scans récents</h3>
              <span className="text-[11.5px] text-[var(--ap-ink-muted-48)]">
                Session active
              </span>
            </div>
            {history.length === 0 ? (
              <EmptyState
                icon={<Icon name="qr" size={20} />}
                title="Aucun scan pour l'instant"
                description="Les scans réussis apparaîtront ici."
              />
            ) : (
              <ul className="divide-y divide-[var(--ap-divider-soft)]">
                {history.map((h, i) => (
                  <li
                    key={`${h.code}-${h.at}-${i}`}
                    className="flex items-center gap-3 px-6 py-4"
                  >
                    <Icon
                      name="checkCircle"
                      size={16}
                      className="text-[var(--ap-status-success-ink)]"
                    />
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold tracking-[-0.016em] text-[var(--ap-ink)]">
                        {h.name}
                      </div>
                      <div className="font-mono text-[11.5px] tabular-nums text-[var(--ap-ink-muted-48)]">
                        {h.code}
                      </div>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--ap-ink-muted-48)]">
                      {formatT(h.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="fs-dash-card-flush">
            <div className="border-b border-[var(--ap-divider-soft)] px-6 py-5">
              <h3 className="fs-tagline text-[15px]!">Arrivés (cumul)</h3>
              <p className="fs-body mt-1 text-[12px] text-[var(--ap-ink-muted-48)]">
                Statut ARRIVED ou COMPLETED.
              </p>
            </div>
            {recentArrivals.length === 0 ? (
              <EmptyState title="Aucun arrivé cumulé" />
            ) : (
              <ul className="divide-y divide-[var(--ap-divider-soft)]">
                {recentArrivals.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 px-6 py-4"
                  >
                    <div className="flex-1">
                      <div className="text-[14px] font-semibold tracking-[-0.016em] text-[var(--ap-ink)]">
                        {p.firstName} {p.lastName}
                      </div>
                      <div className="font-mono text-[11.5px] tabular-nums text-[var(--ap-ink-muted-48)]">
                        {p.code}
                      </div>
                    </div>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function formatT(simMs: number): string {
  const min = Math.floor(simMs / 60000);
  const sec = Math.floor((simMs % 60000) / 1000);
  return `T+${min}m${sec.toString().padStart(2, "0")}`;
}
