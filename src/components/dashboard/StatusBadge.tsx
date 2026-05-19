import type { PatientStatus } from "@/lib/filesante/types";

const STYLES: Record<
  PatientStatus,
  { label: string; bg: string; fg: string; dot: string }
> = {
  REGISTERED: {
    label: "Inscrit",
    bg: "rgba(30, 144, 214, 0.08)",
    fg: "#0a3a5e",
    dot: "#1e90d6",
  },
  AWAITING_CONFIRMATION: {
    label: "À confirmer",
    bg: "rgba(255, 159, 10, 0.1)",
    fg: "#7a4a00",
    dot: "#ff9f0a",
  },
  AWAITING_CONFIRMATION_FINAL: {
    label: "Dernière chance",
    bg: "rgba(255, 69, 58, 0.1)",
    fg: "#a02016",
    dot: "#ff453a",
  },
  CONFIRMED: {
    label: "Confirmé",
    bg: "rgba(52, 199, 89, 0.1)",
    fg: "#1a6d2f",
    dot: "#34c759",
  },
  CANCELLED_BY_PATIENT: {
    label: "Annulé",
    bg: "rgba(142, 142, 147, 0.12)",
    fg: "#6e6e73",
    dot: "#8e8e93",
  },
  NO_RESPONSE: {
    label: "Pas de réponse",
    bg: "rgba(255, 69, 58, 0.1)",
    fg: "#a02016",
    dot: "#ff453a",
  },
  ARRIVED: {
    label: "Arrivé",
    bg: "rgba(0, 122, 255, 0.1)",
    fg: "#0040a0",
    dot: "#007aff",
  },
  NO_SHOW: {
    label: "Non-présentation",
    bg: "rgba(255, 69, 58, 0.1)",
    fg: "#a02016",
    dot: "#ff453a",
  },
  COMPLETED: {
    label: "Terminé",
    bg: "rgba(142, 142, 147, 0.12)",
    fg: "#6e6e73",
    dot: "#8e8e93",
  },
};

export function StatusBadge({ status }: { status: PatientStatus }) {
  const s = STYLES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium tracking-[-0.1px]"
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
