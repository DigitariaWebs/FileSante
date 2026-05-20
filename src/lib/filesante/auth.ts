"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import type { HospitalCode } from "./types";

// Persisted auth store. Separate from the main FileSanté store so that
// resetting demo data (which wipes patients) never logs the user out.
//
// Storage: `filesante.auth.v1` in localStorage.

export type AuthRole =
  | "TRIAGE"
  | "HOTLINE_811"
  | "DIRECTION"
  | "MSSS"
  | "CLINIQUE"
  | "PATIENT";

export type AuthUser = {
  role: AuthRole;
  firstName: string;
  lastName: string;
  email?: string;
  hospital?: HospitalCode;
  loggedInAt: number; // Date.now() at login
};

export type AuthState = {
  user: AuthUser | null;
};

const KEY = "filesante.auth.v1";

const EMPTY: AuthState = { user: null };

type Listener = (s: AuthState) => void;
const listeners = new Set<Listener>();

let state: AuthState = EMPTY;
let hydrated = false;

function emit() {
  for (const l of listeners) l(state);
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode — ignore */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AuthState>;
      if (parsed && parsed.user && typeof parsed.user === "object") {
        state = { user: parsed.user as AuthUser };
      }
    }
  } catch {
    state = EMPTY;
  }
  emit();
}

export const auth = {
  get(): AuthState {
    return state;
  },
  hydrate() {
    hydrate();
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  login(input: Omit<AuthUser, "loggedInAt">) {
    state = {
      user: { ...input, loggedInAt: Date.now() },
    };
    persist();
    emit();
  },
  patch(patch: Partial<AuthUser>) {
    if (!state.user) return;
    state = { user: { ...state.user, ...patch } };
    persist();
    emit();
  },
  logout() {
    state = EMPTY;
    persist();
    emit();
  },
};

function getSnapshot(): AuthState {
  return state;
}

function getServerSnapshot(): AuthState {
  return EMPTY;
}

export function useAuth(): AuthState {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    auth.hydrate();
    setMounted(true);
  }, []);
  const live = useSyncExternalStore(auth.subscribe, getSnapshot, getServerSnapshot);
  return mounted ? live : EMPTY;
}

// Map auth role to its home dashboard path.
export const ROLE_HOME: Record<AuthRole, string> = {
  TRIAGE: "/dashboard/triage",
  HOTLINE_811: "/dashboard/811",
  DIRECTION: "/dashboard/direction",
  MSSS: "/dashboard/msss",
  CLINIQUE: "/dashboard/clinique",
  PATIENT: "/dashboard/patient",
};

export const ROLE_LABEL: Record<AuthRole, string> = {
  TRIAGE: "Infirmière triage",
  HOTLINE_811: "Opérateur 811",
  DIRECTION: "Direction hôpital",
  MSSS: "Direction MSSS",
  CLINIQUE: "Première ligne",
  PATIENT: "Patient",
};
