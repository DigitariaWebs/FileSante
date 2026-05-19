"use client";

import {
  bumpSimClock,
  incLwbs,
  logSms,
  store,
  updatePatient,
} from "./store";
import type { Patient } from "./types";

const MIN = 60_000;

export function tick() {
  bumpSimClock();
  runTransitions();
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
      enterAwaitingConfirmation(p, now);
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

function enterAwaitingConfirmation(p: Patient, now: number) {
  updatePatient(p.id, {
    status: "AWAITING_CONFIRMATION",
    confirmDeadlineAt: now + 15 * MIN,
  });
  logSms(
    p.id,
    "Votre tour approche. Répondez OUI pour confirmer ou NON pour annuler. Vous avez 15 min pour répondre.",
  );
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
}

function enterNoShow(p: Patient, now: number) {
  updatePatient(p.id, {
    status: "NO_SHOW",
    arrivalDeadlineAt: null,
    closedAt: now,
  });
  incLwbs();
  logSms(p.id, "Place libérée — non-présentation.");
}

// In-memory dedupe set for 15-min reminder (cleared on reload — fine for demo).
const reminded = new Set<string>();
function alreadyReminded(id: string) {
  return reminded.has(id);
}
function markReminded(id: string) {
  reminded.add(id);
}
