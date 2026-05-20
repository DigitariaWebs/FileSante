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

  // sim-clock timestamps (ms)
  registeredAt: number;
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

export type Store = {
  simClock: number; // simulated ms since epoch start of session
  realAnchor: number; // Date.now() at last tick
  speed: number; // multiplier 1 | 60 | 600
  patients: Patient[];
  sms: SmsLog[];
  lwbs: number; // counter
  referrals: Referral[];
  clinic: ClinicCapacity;
};
