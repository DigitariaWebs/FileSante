"use client";

import { buildSeed } from "@/data/seed";

import type {
  Civiere,
  CiviereReason,
  CiviereStatus,
  NurseShift,
  Patient,
  Referral,
  StaffIndicators,
  Store,
} from "./types";

const KEY = "filesante.store.v5";
const MIN = 60_000;

const DEFAULT_SHIFT: NurseShift = {
  firstName: "Marie",
  lastName: "Tremblay",
  changedAt: 0,
};

const DEFAULT_STAFF: StaffIndicators = {
  nurses: 6,
  doctors: 3,
  civieresAvail: 8,
  civieresTotal: 20,
  shiftLabel: "Jour · 07h–19h",
};

const initial: Store = {
  simClock: 0,
  realAnchor: 0,
  speed: 60, // demo default: 1 real sec = 1 sim min
  patients: [],
  sms: [],
  lwbs: 0,
  referrals: [],
  clinic: { totalDaily: 22, currentLoad: 0.62 },
  civieres: [],
  surgeMinutes: 0,
  surgeStartedAt: null,
  nurseShift: DEFAULT_SHIFT,
  staff: DEFAULT_STAFF,
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

function seededInitial(): Store {
  const seed = buildSeed();
  return { ...initial, ...seed };
}

let state: Store = seededInitial();
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
      // Schema check: reseed if any required collection missing OR no active
      // patients remain (stale demo data from prior session).
      const activeCount = (state.patients ?? []).filter(isActive).length;
      if (
        !state.patients ||
        state.patients.length === 0 ||
        activeCount === 0 ||
        !state.referrals ||
        !state.clinic ||
        !state.civieres ||
        !state.nurseShift ||
        !state.staff
      ) {
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
  // Anchor real clock so tick deltas start fresh.
  state.realAnchor = Date.now();
  emit();
}

// Stable empty snapshot for SSR + client hydration first render. Real
// (seeded/localStorage) state takes over after mount via a post-hydration
// re-render, preventing SSR/client drift in dev.
const EMPTY_STATE: Store = Object.freeze({ ...initial }) as Store;

export const store = {
  get(): Store {
    return state;
  },
  getServer(): Store {
    return EMPTY_STATE;
  },
  // Called from a client-only useEffect to swap to localStorage state
  // after the first paint. Safe to call repeatedly.
  hydrate() {
    hydrate();
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
  const waitMin = estimateWaitMin(active + 1) + s.surgeMinutes;
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
  const channel = draft.contact === "CALL" ? "Appel" : "SMS";
  logSms(
    patient.id,
    `Bienvenue chez FileSanté (${channel}). Code retour: ${patient.code}. Attente estimée: ${waitMin} min.`,
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
    p.status !== "REGISTERED" &&
    p.status !== "CONFIRMED"
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

/* ─── Clinique (first-line destination) actions ─── */

export function decideReferral(id: string, status: "ACCEPTED" | "REFUSED") {
  store.set((s) => {
    const next = s.referrals.map((r) =>
      r.id === id ? { ...r, status, decidedAt: s.simClock } : r,
    );
    let load = s.clinic.currentLoad;
    if (status === "ACCEPTED") {
      load = Math.min(0.98, load + 1 / s.clinic.totalDaily);
    }
    return { ...s, referrals: next, clinic: { ...s.clinic, currentLoad: load } };
  });
}

export function addReferral(
  draft: Omit<Referral, "id" | "receivedAt" | "decidedAt" | "slaDeadlineAt" | "status"> & {
    slaMinutes?: number;
  },
): Referral {
  const s = store.get();
  const slaMin = draft.slaMinutes ?? 5;
  const referral: Referral = {
    id: `r_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`,
    patientId: draft.patientId,
    patientInitials: draft.patientInitials,
    patientName: draft.patientName,
    source: draft.source,
    sourceLabel: draft.sourceLabel,
    motif: draft.motif,
    priority: draft.priority,
    destinationId: draft.destinationId,
    status: "PENDING",
    receivedAt: s.simClock,
    decidedAt: null,
    slaDeadlineAt: s.simClock + slaMin * MIN,
  };
  store.set((s) => ({ ...s, referrals: [...s.referrals, referral] }));
  return referral;
}

export function setClinicLoad(load: number) {
  const v = Math.max(0, Math.min(0.98, load));
  store.set((s) => ({ ...s, clinic: { ...s.clinic, currentLoad: v } }));
}

export function setClinicCapacity(totalDaily: number) {
  const v = Math.max(1, Math.floor(totalDaily));
  store.set((s) => ({ ...s, clinic: { ...s.clinic, totalDaily: v } }));
}

/* ─── Civière (in-facility stretcher) actions ─── */

export function newCiviereId(): string {
  return `civ_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}

export function addCiviere(draft: {
  patientName: string;
  stretcherNum: number;
  reason: CiviereReason;
  hospital: Civiere["hospital"];
}): Civiere {
  const s = store.get();
  const civiere: Civiere = {
    id: newCiviereId(),
    patientName: draft.patientName,
    stretcherNum: draft.stretcherNum,
    reason: draft.reason,
    status: "AWAITING_RESULTS",
    hospital: draft.hospital,
    createdAt: s.simClock,
    updatedAt: s.simClock,
    alertDismissedAt: null,
  };
  store.set((s) => ({
    ...s,
    civieres: [...s.civieres, civiere],
    staff: { ...s.staff, civieresAvail: Math.max(0, s.staff.civieresAvail - 1) },
  }));
  return civiere;
}

export function setCiviereStatus(id: string, status: CiviereStatus) {
  store.set((s) => ({
    ...s,
    civieres: s.civieres.map((c) =>
      c.id === id ? { ...c, status, updatedAt: s.simClock } : c,
    ),
    staff:
      status === "DISCHARGED"
        ? {
            ...s.staff,
            civieresAvail: Math.min(
              s.staff.civieresTotal,
              s.staff.civieresAvail + 1,
            ),
          }
        : s.staff,
  }));
}

export function dismissCiviereAlert(id: string) {
  store.set((s) => ({
    ...s,
    civieres: s.civieres.map((c) =>
      c.id === id ? { ...c, alertDismissedAt: s.simClock } : c,
    ),
  }));
}

export function removeCiviere(id: string) {
  store.set((s) => ({
    ...s,
    civieres: s.civieres.filter((c) => c.id !== id),
  }));
}

/* ─── Surge mode + nurse shift ─── */

export function setSurge(minutes: 0 | 15 | 30 | 45) {
  const s = store.get();
  store.set((cur) => ({
    ...cur,
    surgeMinutes: minutes,
    surgeStartedAt: minutes > 0 ? s.simClock : null,
  }));
}

export function changeShift(firstName: string, lastName: string) {
  const s = store.get();
  store.set((cur) => ({
    ...cur,
    nurseShift: { firstName, lastName, changedAt: s.simClock },
  }));
}
