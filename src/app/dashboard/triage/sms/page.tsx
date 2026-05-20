"use client";

import { useMemo, useState } from "react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { useFileSante } from "@/hooks/useFileSante";

export default function SmsPage() {
  const s = useFileSante();
  const [q, setQ] = useState("");

  const items = useMemo(() => {
    const byId = new Map(s.patients.map((p) => [p.id, p]));
    const list = [...s.sms]
      .sort((a, b) => b.at - a.at)
      .map((m) => ({ ...m, patient: byId.get(m.patientId) }));
    if (!q.trim()) return list;
    const term = q.trim().toLowerCase();
    return list.filter((m) => {
      const name = m.patient
        ? `${m.patient.firstName} ${m.patient.lastName}`.toLowerCase()
        : "";
      const phone = m.patient?.phone.toLowerCase() ?? "";
      return (
        m.body.toLowerCase().includes(term) ||
        name.includes(term) ||
        phone.includes(term)
      );
    });
  }, [s.sms, s.patients, q]);

  return (
    <>
      <PageHeader
        eyebrow="Opérations"
        title="Journal SMS"
        description="Notifications générées par FileSanté (simulation pilote)."
        actions={
          <div className="relative">
            <Icon
              name="search"
              size={15}
              className="absolute top-1/2 left-4 -translate-y-1/2 text-[var(--ap-ink-muted-48)]"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (nom, téléphone, texte)"
              className="fs-input pl-10"
              style={{ width: 320 }}
            />
          </div>
        }
      />

      <div className="px-10 py-10">
        <div className="fs-dash-card-flush">
          <div className="flex items-center justify-between border-b border-[var(--ap-divider-soft)] px-6 py-5">
            <h2 className="fs-tagline text-[15px]!">
              {items.length} message{items.length === 1 ? "" : "s"}
            </h2>
            <span className="text-[11.5px] text-[var(--ap-ink-muted-48)]">
              En prod → Twilio · Telnyx · équivalent.
            </span>
          </div>
          {items.length === 0 ? (
            <EmptyState
              icon={<Icon name="chat" size={20} />}
              title="Aucun message"
              description={
                q
                  ? "Aucun résultat pour cette recherche."
                  : "Inscrivez un patient pour voir l'activité SMS."
              }
            />
          ) : (
            <ul className="divide-y divide-[var(--ap-divider-soft)]">
              {items.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-[var(--ap-canvas-parchment)]"
                >
                  <div className="fs-icon-chip fs-icon-chip-info mt-0.5">
                    <Icon name="chat" size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14.5px] font-semibold tracking-[-0.016em] text-[var(--ap-ink)]">
                        {m.patient
                          ? `${m.patient.firstName} ${m.patient.lastName}`
                          : "Patient inconnu"}
                      </span>
                      {m.patient && (
                        <span className="font-mono text-[12px] tabular-nums text-[var(--ap-ink-muted-48)]">
                          {m.patient.phone}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[14px] text-[var(--ap-ink-muted-80)]">
                      {m.body}
                    </p>
                  </div>
                  <span className="shrink-0 self-start font-mono text-[11.5px] text-[var(--ap-ink-muted-48)]">
                    {formatT(m.at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
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
