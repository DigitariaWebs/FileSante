export type PatientStatus =
  | "REGISTERED"
  | "AWAITING_CONFIRMATION"
  | "AWAITING_CONFIRMATION_FINAL"
  | "CONFIRMED"
  | "CANCELLED_BY_PATIENT"
  | "NO_RESPONSE"
  | "ARRIVED"
  | "NO_SHOW"
  | "COMPLETED";

export type Priority = "P4" | "P5";

export type ContactMethod = "SMS" | "CALL";

export type Origin = "DESK" | "HOME_811";

export type HospitalCode = "HMR" | "HND" | "HSC" | "HGM";

export type AgeRange = "0-2" | "3-12" | "13-17" | "18-64" | "65+";

export type Patient = {
  id: string;
  code: string; // 4-digit return code
  firstName: string;
  lastName: string;
  phone: string;
  motif: string;
  priority: Priority;
  contact: ContactMethod;
  origin: Origin;
  hospital: HospitalCode;
  consent: boolean;
  status: PatientStatus;

  manualNotify: boolean; // true if nurse pushed "Rappeler" manually

  // sim-clock timestamps (ms)
  registeredAt: number;
  activatedAt: number | null; // null until patient taps Loi 25 + phone via QR
  notifiedAt: number | null;  // when notify went out (manual or scheduled)
  ttlAt: number | null;       // activatedAt + 24h — personal data purge marker
  estimatedSlotAt: number;
  askConfirmAt: number | null;
  confirmDeadlineAt: number | null;
  finalDeadlineAt: number | null;
  arrivalDeadlineAt: number | null;
  arrivedAt: number | null;
  closedAt: number | null;
};

export type SmsLog = {
  id: string;
  patientId: string;
  at: number;
  body: string;
};

export type ReferralSource = "TRIAGE" | "HOTLINE_811" | "EMS_911";
export type ReferralStatus = "PENDING" | "ACCEPTED" | "REFUSED" | "EXPIRED";
export type ClinicType = "GMF" | "CLSC" | "IPS" | "UMF";

export type Referral = {
  id: string;
  patientId: string; // links to Patient.id for cross-dashboard coherence
  patientInitials: string;
  patientName: string;
  source: ReferralSource;
  sourceLabel: string;
  motif: string;
  priority: Priority;
  destinationId: string; // clinic id (only "default" supported for demo)
  status: ReferralStatus;
  receivedAt: number;
  decidedAt: number | null;
  slaDeadlineAt: number; // sim ms when PENDING expires
};

export type ClinicCapacity = {
  totalDaily: number;
  currentLoad: number; // 0..1 fraction
};

/* ─── Civière (in-facility stretcher) tracking ─── */

export type CiviereStatus =
  | "AWAITING_RESULTS"   // labo/radio/consult pending
  | "RESULTS_IN"          // results back, pending physician decision
  | "DECISION"            // physician deciding orientation
  | "DISCHARGED";         // bed released

export type CiviereReason = "LABO" | "RADIO" | "CONSULTANT" | "OTHER";

export type CiviereTransition = {
  status: CiviereStatus;
  at: number; // sim-clock
};

export type Civiere = {
  id: string;
  patientName: string;
  stretcherNum: number;
  reason: CiviereReason;
  status: CiviereStatus;
  hospital: HospitalCode;
  createdAt: number;
  updatedAt: number;
  alertDismissedAt: number | null;
  transitions: CiviereTransition[]; // append-only per-status log
};

/* ─── Triage operations state ─── */

export type NurseShift = {
  firstName: string;
  lastName: string;
  changedAt: number;
};

export type StaffIndicators = {
  nurses: number;
  doctors: number;
  civieresAvail: number;
  civieresTotal: number;
  shiftLabel: string;
};

export type SurgeState = {
  minutes: number;         // 0 | 15 | 30 | 45
  startedAt: number | null; // sim-clock ms (null when inactive)
};

export type SurgeEvent = {
  id: string;
  hospital: HospitalCode;
  minutes: number;
  startedAt: number;       // sim-clock ms
  endedAt: number | null;  // null until cleared / auto-resumed
};

export type HospitalSettings = {
  confirmDelayMin: number; // 1..15 — minutes patient has to confirm after notify
};

export type HospitalSettingsMap = Record<HospitalCode, HospitalSettings>;

export type Store = {
  simClock: number; // simulated ms since session start
  realAnchor: number; // Date.now() at last tick
  speed: number; // multiplier 1 | 60 | 600
  patients: Patient[];
  sms: SmsLog[];
  lwbs: number; // counter
  referrals: Referral[];
  clinic: ClinicCapacity;
  civieres: Civiere[];
  surgeByHospital: Record<HospitalCode, SurgeState>;
  surgeEvents: SurgeEvent[];
  nurseShift: NurseShift;
  staff: StaffIndicators;
  hospitalSettings: HospitalSettingsMap;
  expiryAlerts: ExpiryAlert[]; // recent NO_RESPONSE / NO_SHOW events, not dismissed
};

export type ExpiryAlertKind = "NO_RESPONSE" | "NO_SHOW";

export type ExpiryAlert = {
  id: string;
  patientId: string;
  patientName: string;
  kind: ExpiryAlertKind;
  hospital: HospitalCode;
  at: number; // sim-clock
  dismissedAt: number | null;
};
