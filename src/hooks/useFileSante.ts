"use client";

import { useSyncExternalStore } from "react";

import { store } from "@/lib/filesante/store";
import type { Store } from "@/lib/filesante/types";

function getSnapshot(): Store {
  return store.get();
}

function getServerSnapshot(): Store {
  return store.get();
}

export function useFileSante(): Store {
  return useSyncExternalStore(store.subscribe, getSnapshot, getServerSnapshot);
}
