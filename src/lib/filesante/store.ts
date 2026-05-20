"use client";

import { buildSeed } from "@/data/seed";

import type {
  Civiere,
  CiviereReason,
  CiviereStatus,
  ExpiryAlert,
  ExpiryAlertKind,
  HospitalCode,
  HospitalSettingsMap,
  NurseShift,
  Patient,
  Referral,
  StaffIndicators,
  Store,
  SurgeState,
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

const DEFAULT_HOSPITAL_SETTINGS: HospitalSettingsMap = {
  HMR: { confirmDelayMin: 15 },
  HND: { confirmDelayMin: 15 },
  HSC: { confirmDelayMin: 15 },
  HGM: { confirmDelayMin: 15 },
};

const ZERO_SURGE: SurgeState = { minutes: 0, startedAt: null };
const DEFAULT_SURGE: Record<HospitalCode, SurgeState> = {
  HMR: ZERO_SURGE,
  HND: ZERO_SURGE,
  HSC: ZERO_SURGE,
  HGM: ZERO_SURGE,
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
  surgeByHospital: DEFAULT_SURGE,
  surgeEvents: [],
  nurseShift: DEFAULT_SHIFT,
  staff: DEFAULT_STAFF,
  hospitalSettings: DEFAULT_HOSPITAL_SETTINGS,
  expiryAlerts: [],
};

function seeded(): Store {
  const seed = buildSeed();
  return {
    ...initial,
    ...seed,
    realAnchor: Date.now(),
  };
}

// Section 14 demo reset: 5 patients at HMR (Marie/Fatima/Sophie P4; Jean/Roger P5).
function seededDemo(): Store {
  const now = 0;
  const DAY = 24 * 60 * MIN;
  const make = (
    id: string,
    firstName: string,
    lastName: string,
    phone: string,
    priority: Patient["priority"],
    motif: string,
  ): Patient => ({
    id,
    code: Math.floor(1000 + Math.random() * 9000).toString(),
    firstName,
    lastName,
    phone,
    motif,
    priority,
    contact: "SMS",
    origin: "DESK",
    hospital: "HMR",
    consent: true,
    status: "REGISTERED",
    manualNotify: false,
    registeredAt: now,
    activatedAt: now,
    notifiedAt: null,
    ttlAt: now + DAY,
    estimatedSlotAt: now + 90 * MIN,
    askConfirmAt: now + 30 * MIN,
    confirmDeadlineAt: null,
    finalDeadlineAt: null,
    arrivalDeadlineAt: null,
    arrivedAt: null,
    closedAt: null,
  });
  const patients: Patient[] = [
    make("demo_p1", "Marie", "Tremblay", "+1 514 555 0001", "P4", "Douleur lombaire"),
    make("demo_p2", "Fatima", "El-Amrani", "+1 514 555 0002", "P4", "Migraine persistante"),
    make("demo_p3", "Sophie", "Roy", "+1 514 555 0003", "P4", "Otite — adulte"),
    make("demo_p4", "Jean", "Bouchard", "+1 514 555 0004", "P5", "Éraflure profonde"),
    make("demo_p5", "Roger", "Lavoie", "+1 514 555 0005", "P5", "Toux > 2 semaines"),
  ];
  return {
    ...initial,
    patients,
    simClock: now,
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
  // Demo-specific reset: 5 HMR patients (Marie/Fatima/Sophie P4, Jean/Roger P5).
  // Used by /demo/reset button.
  resetDemo() {
    state = seededDemo();
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
    | "manualNotify"
    | "registeredAt"
    | "activatedAt"
    | "notifiedAt"
    | "ttlAt"
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
  const surgeMin = s.surgeByHospital[draft.hospital]?.minutes ?? 0;
  const waitMin = estimateWaitMin(active + 1) + surgeMin;
  const now = s.simClock;
  const patient: Patient = {
    ...draft,
    id: newPatientId(),
    code: randomCode(),
    status: "REGISTERED",
    manualNotify: false,
    registeredAt: now,
    activatedAt: draft.origin === "DESK" ? now : null,
    notifiedAt: null,
    ttlAt: draft.origin === "DESK" ? now + 24 * 60 * MIN : null,
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

// Returns next-up patient for given hospital, or null. Picks first
// REGISTERED row by P4>P5 + FIFO. Used by manual "prochain patient" button
// and as a probe for the scheduler.
export function pickNextForHospital(code: HospitalCode): Patient | null {
  const queue = getHospitalQueue(code).filter(
    (p) => p.status === "REGISTERED",
  );
  return queue[0] ?? null;
}

// Manual or scheduled notify: REGISTERED -> AWAITING_CONFIRMATION immediately,
// starts 15-min confirm timer. Idempotent: noop if already notified.
// For contact=CALL: no SMS auto-send; nurse calls manually (Section 9).
export function notifyPatient(
  id: string,
  opts: { manual?: boolean } = {},
): boolean {
  const s = store.get();
  const p = s.patients.find((x) => x.id === id);
  if (!p || p.status !== "REGISTERED") return false;
  const now = s.simClock;
  const delayMin = getConfirmDelayMin(p.hospital);
  updatePatient(id, {
    status: "AWAITING_CONFIRMATION",
    confirmDeadlineAt: now + delayMin * MIN,
    notifiedAt: now,
    manualNotify: opts.manual === true || p.manualNotify,
  });
  if (p.contact === "CALL") {
    // Nurse-side alert; no SMS goes to patient.
    fireBrowserNotification({
      title: "FileSanté — patient à rappeler",
      body: `${p.firstName} ${p.lastName} (${p.priority}) · ${p.phone}`,
    });
  } else {
    // Neutral SMS, no medical detail.
    logSms(
      id,
      "Votre tour approche. Répondez OUI pour confirmer ou NON pour annuler. Vous avez 15 min pour répondre.",
    );
    fireBrowserNotification({
      title: "FileSanté — votre tour approche",
      body: `Code retour ${p.code}. Répondez OUI pour confirmer.`,
    });
  }
  return true;
}

export function fireBrowserNotification(payload: {
  title: string;
  body: string;
}) {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.navigator?.vibrate === "function") {
      // Amber-Alert-ish pattern: 3 bursts.
      window.navigator.vibrate([400, 120, 400, 120, 400]);
    }
    const N = window.Notification;
    if (!N) return;
    if (N.permission === "granted") {
      new N(payload.title, { body: payload.body });
    } else if (N.permission !== "denied") {
      N.requestPermission()
        .then((perm) => {
          if (perm === "granted") new N(payload.title, { body: payload.body });
        })
        .catch(() => {});
    }
  } catch {
    /* unsupported — ignore */
  }
}

export function activatePatient(id: string, phone: string): boolean {
  const s = store.get();
  const p = s.patients.find((x) => x.id === id);
  if (!p) return false;
  if (p.activatedAt !== null) return true;
  const now = s.simClock;
  updatePatient(id, {
    phone,
    activatedAt: now,
    ttlAt: now + 24 * 60 * MIN,
  });
  logSms(
    id,
    `Activation confirmée. Vous êtes dans la file. Code retour: ${p.code}.`,
  );
  return true;
}

export function redactPatientPii(id: string) {
  updatePatient(id, {
    firstName: "—",
    lastName: "—",
    phone: "***",
    motif: "[supprimé · TTL 24h]",
    ttlAt: null,
  });
}

export function pseudonymizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***-***-${digits.slice(-4)}`;
}

/* ─── Per-hospital settings + expiry alerts ─── */

export function getConfirmDelayMin(code: HospitalCode): number {
  const s = store.get();
  return s.hospitalSettings[code]?.confirmDelayMin ?? 15;
}

export function setConfirmDelay(code: HospitalCode, minutes: number) {
  const clamped = Math.max(1, Math.min(15, Math.round(minutes)));
  store.set((s) => ({
    ...s,
    hospitalSettings: {
      ...s.hospitalSettings,
      [code]: { ...s.hospitalSettings[code], confirmDelayMin: clamped },
    },
  }));
}

export function pushExpiryAlert(args: {
  patientId: string;
  patientName: string;
  hospital: HospitalCode;
  kind: ExpiryAlertKind;
}) {
  const s = store.get();
  const alert: ExpiryAlert = {
    id: `xa_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`,
    patientId: args.patientId,
    patientName: args.patientName,
    hospital: args.hospital,
    kind: args.kind,
    at: s.simClock,
    dismissedAt: null,
  };
  store.set((cur) => ({
    ...cur,
    expiryAlerts: [...cur.expiryAlerts, alert].slice(-50),
  }));
}

export function dismissExpiryAlert(id: string) {
  store.set((s) => ({
    ...s,
    expiryAlerts: s.expiryAlerts.map((a) =>
      a.id === id ? { ...a, dismissedAt: s.simClock } : a,
    ),
  }));
}

// Queue selector — equivalent of `GET /api/hospitals/:code/queue`.
// P4 ranks before P5; within a priority group, FIFO by registeredAt.
export function sortQueue(patients: Patient[]): Patient[] {
  const PRIO_RANK: Record<Patient["priority"], number> = { P4: 0, P5: 1 };
  return [...patients].sort((a, b) => {
    const dp = PRIO_RANK[a.priority] - PRIO_RANK[b.priority];
    if (dp !== 0) return dp;
    return a.registeredAt - b.registeredAt;
  });
}

export function getHospitalQueue(code: HospitalCode): Patient[] {
  const s = store.get();
  return sortQueue(s.patients.filter((p) => p.hospital === code && isActive(p)));
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
    transitions: [{ status: "AWAITING_RESULTS", at: s.simClock }],
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
      c.id === id
        ? {
            ...c,
            status,
            updatedAt: s.simClock,
            transitions:
              c.status === status
                ? c.transitions
                : [...c.transitions, { status, at: s.simClock }],
          }
        : c,
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

/* ─── Civière occupancy selectors (live, used by Director / Provincial KPIs) ─── */

export function getCivieresOccupancyAll(): {
  occupied: number;
  total: number;
  rate: number;
} {
  const s = store.get();
  const occupied = Math.max(0, s.staff.civieresTotal - s.staff.civieresAvail);
  const total = Math.max(1, s.staff.civieresTotal);
  return { occupied, total, rate: occupied / total };
}

// Per-hospital occupancy. Uses active civières against a network-share of
// total beds (proportional split — no per-hospital total tracked yet).
export function getCivieresOccupancyByHospital(
  code: HospitalCode,
): { occupied: number; total: number; rate: number } {
  const s = store.get();
  const occupied = s.civieres.filter(
    (c) => c.hospital === code && c.status !== "DISCHARGED",
  ).length;
  // Naive: assume even split across 4 hospitals when no per-hospital total exists.
  const total = Math.max(1, Math.round(s.staff.civieresTotal / 4));
  return { occupied, total, rate: Math.min(1, occupied / total) };
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

export type SurgeMinutes = 0 | 15 | 30 | 45;

export function getSurge(code: HospitalCode): SurgeState {
  return store.get().surgeByHospital[code] ?? ZERO_SURGE;
}

export function isSurgeActive(code: HospitalCode): boolean {
  return getSurge(code).minutes > 0;
}

// Trigger a surge for one hospital. Side effects:
//   1. Stamp surge state with startedAt (engine clears after window elapses).
//   2. Push back askConfirmAt / estimatedSlotAt by `minutes` for every active
//      patient at that hospital — automatically suspends notifications during
//      the window (engine reads askConfirmAt).
//   3. Broadcast neutral SMS to affected patients (no medical detail).
export function triggerSurge(code: HospitalCode, minutes: SurgeMinutes) {
  const s = store.get();
  if (minutes === 0) {
    clearSurge(code);
    return;
  }
  const now = s.simClock;
  const deltaMs = minutes * MIN;
  const surgeEvent = {
    id: `sg_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`,
    hospital: code,
    minutes,
    startedAt: now,
    endedAt: null as number | null,
  };
  store.set((cur) => ({
    ...cur,
    surgeByHospital: {
      ...cur.surgeByHospital,
      [code]: { minutes, startedAt: now },
    },
    surgeEvents: [...cur.surgeEvents, surgeEvent].slice(-100),
    patients: cur.patients.map((p) => {
      if (p.hospital !== code) return p;
      if (!isActive(p)) return p;
      return {
        ...p,
        estimatedSlotAt: p.estimatedSlotAt + deltaMs,
        askConfirmAt:
          p.askConfirmAt !== null && p.status === "REGISTERED"
            ? p.askConfirmAt + deltaMs
            : p.askConfirmAt,
      };
    }),
  }));
  // Broadcast neutral SMS to affected REGISTERED patients (haven't been
  // notified yet — notify recipients already got their own messaging).
  const affected = store
    .get()
    .patients.filter((p) => p.hospital === code && p.status === "REGISTERED");
  for (const p of affected) {
    logSms(
      p.id,
      `Surcharge à l'urgence. Votre attente est rallongée d'environ ${minutes} min. Merci de votre patience.`,
    );
  }
}

export function clearSurge(code: HospitalCode) {
  store.set((cur) => {
    const now = cur.simClock;
    // Stamp endedAt on the most recent open event for this hospital.
    let closed = false;
    const surgeEvents = [...cur.surgeEvents].reverse().map((e) => {
      if (!closed && e.hospital === code && e.endedAt === null) {
        closed = true;
        return { ...e, endedAt: now };
      }
      return e;
    }).reverse();
    return {
      ...cur,
      surgeByHospital: {
        ...cur.surgeByHospital,
        [code]: ZERO_SURGE,
      },
      surgeEvents,
    };
  });
}

// Section 14 demo: trigger notify on next HMR REGISTERED patient. Returns id
// of notified patient, or null if nobody available.
export function triggerDemoNotify(code: HospitalCode = "HMR"): string | null {
  const next = pickNextForHospital(code);
  if (!next) return null;
  notifyPatient(next.id, { manual: true });
  return next.id;
}

export function changeShift(firstName: string, lastName: string) {
  const s = store.get();
  store.set((cur) => ({
    ...cur,
    nurseShift: { firstName, lastName, changedAt: s.simClock },
  }));
}
