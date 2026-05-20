"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import { store } from "@/lib/filesante/store";
import type { Store } from "@/lib/filesante/types";

function getSnapshot(): Store {
  return store.get();
}

function getServerSnapshot(): Store {
  return store.getServer();
}

export function useFileSante(): Store {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    store.hydrate();
    setMounted(true);
  }, []);
  const live = useSyncExternalStore(
    store.subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return mounted ? live : store.getServer();
}
