"use client";

import { buildSeed } from "@/data/seed";

import type { Patient, Store } from "./types";

const KEY = "filesante.store.v1";
const MIN = 60_000;

const initial: Store = {
  simClock: 0,
  realAnchor: 0,
  speed: 60, // demo default: 1 real sec = 1 sim min
  patients: [],
  sms: [],
  lwbs: 0,
};

function seeded(): Store {
  const seed = buildSeed();
  return {
    ...initial,
    ...seed,
    realAnchor: Date.now(),
  };
}

type Listener = (s: Store) => void;
const listeners = new Set<Listener>();
let state: Store = initial;
let hydrated = false;

function emit() {
  for (const l of listeners) l(state);
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota or private mode — ignore */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Store>;
      state = { ...initial, ...parsed };
      if (!state.patients || state.patients.length === 0) {
        state = seeded();
        persist();
      }
    } else {
      state = seeded();
      persist();
    }
  } catch {
    state = seeded();
    persist();
  }
  // Anchor real clock now so tick deltas start fresh.
  state.realAnchor = Date.now();
}

export const store = {
  get(): Store {
    if (!hydrated) hydrate();
    return state;
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  set(updater: (s: Store) => Store) {
    state = updater(state);
    persist();
    emit();
  },
  reset() {
    state = seeded();
    persist();
    emit();
  },
};

export function randomCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function newPatientId(): string {
  return `p_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export function avgServiceMin() {
  return 18; // minutes per P4/P5 patient (mock)
}

export function estimateWaitMin(queueLength: number): number {
  return Math.max(15, queueLength * avgServiceMin());
}

export function addPatient(
  draft: Omit<
    Patient,
    | "id"
    | "code"
    | "status"
    | "registeredAt"
    | "estimatedSlotAt"
    | "askConfirmAt"
    | "confirmDeadlineAt"
    | "finalDeadlineAt"
    | "arrivalDeadlineAt"
    | "arrivedAt"
    | "closedAt"
  >,
): Patient {
  const s = store.get();
  const active = s.patients.filter(isActive).length;
  const waitMin = estimateWaitMin(active + 1);
  const now = s.simClock;
  const patient: Patient = {
    ...draft,
    id: newPatientId(),
    code: randomCode(),
    status: "REGISTERED",
    registeredAt: now,
    estimatedSlotAt: now + waitMin * MIN,
    askConfirmAt: now + Math.max(0, waitMin - 60) * MIN,
    confirmDeadlineAt: null,
    finalDeadlineAt: null,
    arrivalDeadlineAt: null,
    arrivedAt: null,
    closedAt: null,
  };
  store.set((s) => ({ ...s, patients: [...s.patients, patient] }));
  logSms(
    patient.id,
    `Bienvenue chez FileSanté. Code retour: ${patient.code}. Attente estimée: ${waitMin} min.`,
  );
  return patient;
}

export function isActive(p: Patient): boolean {
  return (
    p.status === "REGISTERED" ||
    p.status === "AWAITING_CONFIRMATION" ||
    p.status === "AWAITING_CONFIRMATION_FINAL" ||
    p.status === "CONFIRMED"
  );
}

export function logSms(patientId: string, body: string) {
  store.set((s) => ({
    ...s,
    sms: [
      ...s.sms,
      {
        id: `sms_${Math.random().toString(36).slice(2, 9)}`,
        patientId,
        at: s.simClock,
        body,
      },
    ].slice(-200),
  }));
}

export function updatePatient(id: string, patch: Partial<Patient>) {
  store.set((s) => ({
    ...s,
    patients: s.patients.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  }));
}

export function confirmPatient(id: string) {
  const s = store.get();
  const p = s.patients.find((x) => x.id === id);
  if (!p) return;
  if (
    p.status !== "AWAITING_CONFIRMATION" &&
    p.status !== "AWAITING_CONFIRMATION_FINAL"
  )
    return;
  const arrivalDeadline = s.simClock + 60 * MIN;
  updatePatient(id, {
    status: "CONFIRMED",
    confirmDeadlineAt: null,
    finalDeadlineAt: null,
    arrivalDeadlineAt: arrivalDeadline,
  });
  logSms(
    id,
    `Confirmé. Présentez-vous avant ${formatHhmm(arrivalDeadline)}. Code retour: ${p.code}`,
  );
}

export function cancelPatient(id: string) {
  const s = store.get();
  const p = s.patients.find((x) => x.id === id);
  if (!p) return;
  if (
    p.status !== "AWAITING_CONFIRMATION" &&
    p.status !== "AWAITING_CONFIRMATION_FINAL" &&
    p.status !== "REGISTERED"
  )
    return;
  updatePatient(id, { status: "CANCELLED_BY_PATIENT", closedAt: s.simClock });
  logSms(id, `Annulation enregistrée. Composez 811 si besoin.`);
}

export function markArrived(idOrCode: string) {
  const s = store.get();
  const p = s.patients.find(
    (x) => x.id === idOrCode || x.code === idOrCode,
  );
  if (!p) return { ok: false, reason: "Code inconnu" } as const;
  if (p.status === "CONFIRMED" || p.status === "AWAITING_CONFIRMATION" || p.status === "AWAITING_CONFIRMATION_FINAL" || p.status === "REGISTERED") {
    updatePatient(p.id, {
      status: "ARRIVED",
      arrivedAt: s.simClock,
      arrivalDeadlineAt: null,
    });
    return { ok: true, patient: p } as const;
  }
  return { ok: false, reason: `Statut invalide: ${p.status}` } as const;
}

export function completePatient(id: string) {
  const s = store.get();
  updatePatient(id, { status: "COMPLETED", closedAt: s.simClock });
}

export function setSpeed(speed: number) {
  store.set((s) => ({ ...s, speed, realAnchor: Date.now() }));
}

export function bumpSimClock() {
  const now = Date.now();
  const s = store.get();
  if (!s.realAnchor) {
    store.set((s) => ({ ...s, realAnchor: now }));
    return;
  }
  const deltaReal = now - s.realAnchor;
  if (deltaReal <= 0) return;
  store.set((s) => ({
    ...s,
    realAnchor: now,
    simClock: s.simClock + deltaReal * s.speed,
  }));
}

export function formatHhmm(simMs: number): string {
  // Sim clock = ms since session start. Render as wall-clock by adding to current real time origin.
  const realDate = new Date(Date.now() + (simMs - store.get().simClock));
  return realDate.toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function incLwbs() {
  store.set((s) => ({ ...s, lwbs: s.lwbs + 1 }));
}
