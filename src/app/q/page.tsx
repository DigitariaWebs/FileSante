"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

import { auth } from "@/lib/filesante/auth";
import type { HospitalCode } from "@/lib/filesante/types";

const VALID_HOSPITALS: HospitalCode[] = ["HMR", "HND", "HSC", "HGM"];

function QrLoginInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    // Demo override: always land on the demo patient account regardless of QR identity.
    const rawH = (params.get("h") ?? "HMR").trim().toUpperCase();
    const hospital: HospitalCode = VALID_HOSPITALS.includes(rawH as HospitalCode)
      ? (rawH as HospitalCode)
      : "HMR";

    auth.login({
      role: "PATIENT",
      firstName: "Olivier",
      lastName: "Bélanger",
      hospital,
    });

    router.replace("/dashboard/patient?code=1875");
  }, [params, router]);

  return (
    <div className="grid min-h-screen place-items-center bg-white px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-6 w-6 animate-pulse rounded-full bg-fs-primary" />
        <p className="text-[14px] text-(--ap-ink-muted-80)">
          Connexion en cours…
        </p>
      </div>
    </div>
  );
}

export default function QrLoginPage() {
  return (
    <Suspense fallback={null}>
      <QrLoginInner />
    </Suspense>
  );
}
