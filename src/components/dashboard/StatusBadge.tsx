import type { PatientStatus } from "@/lib/filesante/types";

type Tone = "info" | "success" | "warn" | "danger" | "neutral";

const STYLES: Record<PatientStatus, { label: string; tone: Tone }> = {
  REGISTERED: { label: "Inscrit", tone: "info" },
  AWAITING_CONFIRMATION: { label: "À confirmer", tone: "warn" },
  AWAITING_CONFIRMATION_FINAL: { label: "Dernière chance", tone: "danger" },
  CONFIRMED: { label: "Confirmé", tone: "success" },
  CANCELLED_BY_PATIENT: { label: "Annulé", tone: "neutral" },
  NO_RESPONSE: { label: "Pas de réponse", tone: "danger" },
  ARRIVED: { label: "Arrivé", tone: "info" },
  NO_SHOW: { label: "Non-présentation", tone: "danger" },
  COMPLETED: { label: "Terminé", tone: "neutral" },
};

const TONE_CLASS: Record<Tone, string> = {
  info: "fs-status fs-status-info",
  success: "fs-status fs-status-success",
  warn: "fs-status fs-status-warn",
  danger: "fs-status fs-status-danger",
  neutral: "fs-status",
};

export function StatusBadge({ status }: { status: PatientStatus }) {
  const s = STYLES[status];
  return <span className={TONE_CLASS[s.tone]}>{s.label}</span>;
}
