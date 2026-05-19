import type { PatientStatus } from "@/lib/filesante/types";

const STYLES: Record<
  PatientStatus,
  { label: string; bg: string; fg: string; dot: string }
> = {
  REGISTERED: {
    label: "Inscrit · Domicile",
    bg: "#e8f3fb",
    fg: "#0a3a5e",
    dot: "#1e90d6",
  },
  AWAITING_CONFIRMATION: {
    label: "Attente confirmation",
    bg: "#fff7e6",
    fg: "#7a5b14",
    dot: "#d99814",
  },
  AWAITING_CONFIRMATION_FINAL: {
    label: "Dernière chance",
    bg: "#ffeed6",
    fg: "#7a3f0a",
    dot: "#e07a14",
  },
  CONFIRMED: {
    label: "Confirmé · 60 min",
    bg: "#e6f7ee",
    fg: "#0a6b39",
    dot: "#108a52",
  },
  CANCELLED_BY_PATIENT: {
    label: "Annulé (patient)",
    bg: "#f1f3f5",
    fg: "#536270",
    dot: "#7a92a4",
  },
  NO_RESPONSE: {
    label: "Pas de réponse",
    bg: "#fbe9e9",
    fg: "#7a1414",
    dot: "#c83333",
  },
  ARRIVED: {
    label: "Arrivé",
    bg: "#e3edff",
    fg: "#0b3b8c",
    dot: "#2756d0",
  },
  NO_SHOW: {
    label: "Non-présentation",
    bg: "#fbe9e9",
    fg: "#7a1414",
    dot: "#c83333",
  },
  COMPLETED: {
    label: "Terminé",
    bg: "#f1f3f5",
    fg: "#536270",
    dot: "#7a92a4",
  },
};

export function StatusBadge({ status }: { status: PatientStatus }) {
  const s = STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: s.dot }}
      />
      {s.label}
    </span>
  );
}
