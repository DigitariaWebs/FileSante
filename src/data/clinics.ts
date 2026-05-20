import type { ClinicType } from "@/lib/filesante/types";

export type Clinic = {
  id: string;
  type: ClinicType;
  name: string;
  sector: string;
  loadInitial: number; // baseline 0..1 (mock)
  eta: string; // ETA label
  hours: string;
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
  },
  {
    id: "clsc_hochelaga",
    type: "CLSC",
    name: "CLSC Hochelaga",
    sector: "Hochelaga-Maisonneuve",
    loadInitial: 0.71,
    eta: "18 min",
    hours: "08:00 – 20:00",
  },
  {
    id: "ips_rosemont",
    type: "IPS",
    name: "IPS Rosemont",
    sector: "Rosemont",
    loadInitial: 0.55,
    eta: "14 min",
    hours: "09:00 – 17:00",
  },
  {
    id: "umf_maisonneuve",
    type: "UMF",
    name: "UMF Maisonneuve",
    sector: "Hochelaga-Maisonneuve",
    loadInitial: 0.89,
    eta: "—",
    hours: "08:00 – 18:00",
  },
  {
    id: "gmf_verdun",
    type: "GMF",
    name: "GMF Verdun",
    sector: "Verdun",
    loadInitial: 0.31,
    eta: "22 min",
    hours: "08:00 – 19:00",
  },
  {
    id: "clsc_cdn",
    type: "CLSC",
    name: "CLSC Côte-des-Neiges",
    sector: "Côte-des-Neiges",
    loadInitial: 0.62,
    eta: "16 min",
    hours: "08:00 – 20:00",
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
