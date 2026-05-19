"use client";

import { useEffect } from "react";

import { tick } from "@/lib/filesante/engine";

export function Ticker() {
  useEffect(() => {
    const id = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(id);
  }, []);
  return null;
}
