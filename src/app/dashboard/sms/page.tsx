"use client";

import { useMemo } from "react";

import { Topbar } from "@/components/dashboard/Topbar";
import { useFileSante } from "@/hooks/useFileSante";

export default function SmsPage() {
  const s = useFileSante();
  const items = useMemo(() => {
    const byId = new Map(s.patients.map((p) => [p.id, p]));
    return [...s.sms]
      .sort((a, b) => b.at - a.at)
      .map((m) => ({ ...m, patient: byId.get(m.patientId) }));
  }, [s.sms, s.patients]);

  return (
    <>
      <Topbar title="Journal SMS · simulé" />
      <div className="px-8 py-8">
        <div className="rounded-2xl border border-[var(--fs-line)] bg-white">
          <div className="border-b border-[var(--fs-line)] px-6 py-4">
            <h2 className="font-display text-lg font-semibold text-[var(--fs-ink)]">
              {items.length} messages
            </h2>
            <p className="text-xs text-[var(--fs-ink-3)]">
              Tous les messages générés par le routage. En production →
              fournisseur SMS (Twilio, Telnyx ou équivalent).
            </p>
          </div>
          {items.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-[var(--fs-ink-3)]">
              Aucun message envoyé pour l&apos;instant.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--fs-line)]">
              {items.map((m) => (
                <li key={m.id} className="flex gap-4 px-6 py-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--fs-bg-soft)] text-[var(--fs-primary)]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-[var(--fs-ink)]">
                        {m.patient
                          ? `${m.patient.firstName} ${m.patient.lastName}`
                          : "Patient inconnu"}
                        <span className="ml-2 font-normal text-[var(--fs-ink-3)]">
                          {m.patient?.phone ?? ""}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-[var(--fs-ink-3)]">
                        {fmt(m.at)}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-[var(--fs-ink-2)]">
                      {m.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

function fmt(simMs: number): string {
  const min = Math.floor(simMs / 60000);
  const sec = Math.floor((simMs % 60000) / 1000);
  return `T+${min}m${sec.toString().padStart(2, "0")}s`;
}
