import type { ClinicType } from "@/lib/filesante/types";

export type Clinic = {
  id: string;
  type: ClinicType;
  name: string;
  sector: string;
  loadInitial: number; // baseline 0..1 (mock)
  eta: string; // ETA label
  hours: string;
  // ── 2.0 parity additions ──
  address: string;
  phone: string;
  distanceKm: number; // approx from typical sector centroid (mock)
  nextSlotMin: number; // mock minutes until next available slot
  lastActivitySimMin: number; // sim-min before NOW when last heartbeat happened (mock)
};

// Sectors covered by the Montreal pilot.
export const SECTORS = [
  "Plateau-Mont-Royal",
  "Hochelaga-Maisonneuve",
  "Rosemont",
  "Villeray",
  "Verdun",
  "Lachine",
  "Centre-Sud",
  "Côte-des-Neiges",
  "Saint-Laurent",
  "Pierrefonds",
  "Anjou",
  "Rivière-des-Prairies",
] as const;

export type Sector = (typeof SECTORS)[number];

// Mock first-line clinic registry shared across 811 + Clinique + MSSS map.
export const CLINICS: Clinic[] = [
  {
    id: "gmf_plateau",
    type: "GMF",
    name: "GMF du Plateau",
    sector: "Plateau-Mont-Royal",
    loadInitial: 0.62,
    eta: "11 min",
    hours: "08:00 – 20:00",
    address: "4519, av. du Parc, Montréal",
    phone: "+1 514 555 1101",
    distanceKm: 1.4,
    nextSlotMin: 35,
    lastActivitySimMin: 2,
  },
  {
    id: "clsc_hochelaga",
    type: "CLSC",
    name: "CLSC Hochelaga",
    sector: "Hochelaga-Maisonneuve",
    loadInitial: 0.71,
    eta: "18 min",
    hours: "08:00 – 20:00",
    address: "1620, av. de La Salle, Montréal",
    phone: "+1 514 555 1202",
    distanceKm: 2.8,
    nextSlotMin: 50,
    lastActivitySimMin: 6,
  },
  {
    id: "ips_rosemont",
    type: "IPS",
    name: "IPS Rosemont",
    sector: "Rosemont",
    loadInitial: 0.55,
    eta: "14 min",
    hours: "09:00 – 17:00",
    address: "2700, rue Beaubien Est, Montréal",
    phone: "+1 514 555 1303",
    distanceKm: 2.1,
    nextSlotMin: 25,
    lastActivitySimMin: 4,
  },
  {
    id: "umf_maisonneuve",
    type: "UMF",
    name: "UMF Maisonneuve",
    sector: "Hochelaga-Maisonneuve",
    loadInitial: 0.89,
    eta: "—",
    hours: "08:00 – 18:00",
    address: "5800, rue Saint-Denis, Montréal",
    phone: "+1 514 555 1404",
    distanceKm: 3.2,
    nextSlotMin: 110,
    lastActivitySimMin: 290, // > 4h — stale
  },
  {
    id: "gmf_verdun",
    type: "GMF",
    name: "GMF Verdun",
    sector: "Verdun",
    loadInitial: 0.31,
    eta: "22 min",
    hours: "08:00 – 19:00",
    address: "3942, boul. LaSalle, Verdun",
    phone: "+1 514 555 1505",
    distanceKm: 4.6,
    nextSlotMin: 15,
    lastActivitySimMin: 1,
  },
  {
    id: "clsc_cdn",
    type: "CLSC",
    name: "CLSC Côte-des-Neiges",
    sector: "Côte-des-Neiges",
    loadInitial: 0.62,
    eta: "16 min",
    hours: "08:00 – 20:00",
    address: "5700, ch. de la Côte-des-Neiges, Montréal",
    phone: "+1 514 555 1606",
    distanceKm: 3.0,
    nextSlotMin: 40,
    lastActivitySimMin: 260, // > 4h — stale
  },
];

// Common symptom set surfaced in 811 + clinic intake forms.
export const SYMPTOMS = [
  "Douleur lombaire",
  "Fièvre légère",
  "Mal de gorge",
  "Migraine",
  "Otite",
  "Toux persistante",
  "Brûlure mineure",
  "Entorse",
  "Éraflure",
  "Conjonctivite",
  "Vomissements légers",
  "Douleur abdominale",
] as const;

export const AGE_RANGES = ["0-2", "3-12", "13-17", "18-64", "65+"] as const;
