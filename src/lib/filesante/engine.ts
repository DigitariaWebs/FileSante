"use client";

import {
  bumpSimClock,
  clearSurge,
  incLwbs,
  isActive,
  logSms,
  notifyPatient,
  pushExpiryAlert,
  redactPatientPii,
  store,
  updatePatient,
} from "./store";
import type { HospitalCode, Patient } from "./types";

const MIN = 60_000;

export function tick() {
  bumpSimClock();
  runTransitions();
  purgeExpired();
  autoResumeSurge();
}

// Auto-resume: once a hospital's surge window has elapsed (startedAt + minutes),
// clear the surge so notifications and ETAs return to normal.
function autoResumeSurge() {
  const s = store.get();
  const now = s.simClock;
  for (const code of Object.keys(s.surgeByHospital) as HospitalCode[]) {
    const surge = s.surgeByHospital[code];
    if (
      surge.minutes > 0 &&
      surge.startedAt !== null &&
      now >= surge.startedAt + surge.minutes * MIN
    ) {
      clearSurge(code);
    }
  }
}

// 24h TTL purge: once a patient is terminal (closed dossier) and their
// ttlAt has elapsed, wipe PII columns. Row stays for KPI history.
function purgeExpired() {
  const s = store.get();
  const now = s.simClock;
  for (const p of s.patients) {
    if (
      !isActive(p) &&
      p.ttlAt !== null &&
      now >= p.ttlAt &&
      p.phone !== "***"
    ) {
      redactPatientPii(p.id);
    }
  }
}

function runTransitions() {
  const s = store.get();
  const now = s.simClock;

  for (const p of s.patients) {
    if (
      p.status === "REGISTERED" &&
      p.askConfirmAt !== null &&
      now >= p.askConfirmAt
    ) {
      notifyPatient(p.id);
      continue;
    }

    if (
      p.status === "AWAITING_CONFIRMATION" &&
      p.confirmDeadlineAt !== null &&
      now >= p.confirmDeadlineAt
    ) {
      enterAwaitingConfirmationFinal(p, now);
      continue;
    }

    if (
      p.status === "AWAITING_CONFIRMATION_FINAL" &&
      p.finalDeadlineAt !== null &&
      now >= p.finalDeadlineAt
    ) {
      enterNoResponse(p, now);
      continue;
    }

    if (
      p.status === "CONFIRMED" &&
      p.arrivalDeadlineAt !== null
    ) {
      const remaining = p.arrivalDeadlineAt - now;
      if (remaining <= 0) {
        enterNoShow(p, now);
        continue;
      }
      // 15-min-remaining reminder
      if (
        remaining <= 15 * MIN &&
        !alreadyReminded(p.id)
      ) {
        logSms(p.id, "15 min restantes. Présentez-vous au triage.");
        markReminded(p.id);
      }
    }
  }
}

function enterAwaitingConfirmationFinal(p: Patient, now: number) {
  updatePatient(p.id, {
    status: "AWAITING_CONFIRMATION_FINAL",
    confirmDeadlineAt: null,
    finalDeadlineAt: now + 10 * MIN,
  });
  logSms(p.id, "Dernière chance. Répondez OUI dans 10 min.");
}

function enterNoResponse(p: Patient, now: number) {
  updatePatient(p.id, {
    status: "NO_RESPONSE",
    finalDeadlineAt: null,
    closedAt: now,
  });
  logSms(
    p.id,
    "Place libérée faute de réponse. Composez 811 si vous arrivez plus tard.",
  );
  pushExpiryAlert({
    patientId: p.id,
    patientName: `${p.firstName} ${p.lastName}`,
    hospital: p.hospital,
    kind: "NO_RESPONSE",
  });
}

function enterNoShow(p: Patient, now: number) {
  updatePatient(p.id, {
    status: "NO_SHOW",
    arrivalDeadlineAt: null,
    closedAt: now,
  });
  incLwbs();
  logSms(p.id, "Place libérée — non-présentation.");
  pushExpiryAlert({
    patientId: p.id,
    patientName: `${p.firstName} ${p.lastName}`,
    hospital: p.hospital,
    kind: "NO_SHOW",
  });
}

// In-memory dedupe set for 15-min reminder (cleared on reload — fine for demo).
const reminded = new Set<string>();
function alreadyReminded(id: string) {
  return reminded.has(id);
}
function markReminded(id: string) {
  reminded.add(id);
}
