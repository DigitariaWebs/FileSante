"use client";

import { MessageSquare, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Input } from "@/components/ui/input";
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
        title="Journal SMS"
        description="Notifications générées par FileSanté (simulation pilote)."
        actions={
          <div className="relative">
            <Search
              size={14}
              className="absolute top-1/2 left-3 -translate-y-1/2 text-[#8b9aab]"
            />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher (nom, téléphone, texte)"
              className="h-9 w-[280px] pl-9"
            />
          </div>
        }
      />

      <div className="px-8 py-6">
        <div className="fs-dash-card-flush">
          <div className="flex items-center justify-between border-b border-[#eef2f6] px-5 py-3.5">
            <h2 className="text-[13.5px] font-semibold text-[#0c2535]">
              {items.length} message{items.length === 1 ? "" : "s"}
            </h2>
            <span className="text-[11.5px] text-[#7a8898]">
              En prod → Twilio · Telnyx · équivalent.
            </span>
          </div>
          {items.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={18} />}
              title="Aucun message"
              description={
                q
                  ? "Aucun résultat pour cette recherche."
                  : "Inscrivez un patient pour voir l'activité SMS."
              }
            />
          ) : (
            <ul className="divide-y divide-[#eef2f6]">
              {items.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-[#fbfdff]"
                >
                  <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e8f3fb] text-[#1e90d6]">
                    <MessageSquare size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-[#0c2535]">
                        {m.patient
                          ? `${m.patient.firstName} ${m.patient.lastName}`
                          : "Patient inconnu"}
                      </span>
                      {m.patient && (
                        <span className="font-mono text-[11.5px] text-[#7a8898] tabular-nums">
                          {m.patient.phone}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[13px] text-[#36546b]">{m.body}</p>
                  </div>
                  <span className="shrink-0 self-start font-mono text-[11px] text-[#8b9aab]">
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
