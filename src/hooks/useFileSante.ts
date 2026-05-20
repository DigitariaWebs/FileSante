"use client";

import { useEffect, useSyncExternalStore } from "react";

import { store } from "@/lib/filesante/store";
import type { Store } from "@/lib/filesante/types";

function getSnapshot(): Store {
  return store.get();
}

function getServerSnapshot(): Store {
  return store.get();
}

export function useFileSante(): Store {
  // Defer localStorage hydration to after first commit so server-rendered
  // HTML matches the initial client render (fixes hydration mismatch).
  useEffect(() => {
    store.hydrate();
  }, []);
  return useSyncExternalStore(store.subscribe, getSnapshot, getServerSnapshot);
}
