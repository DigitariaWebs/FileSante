import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { PatientLogoutButton } from "@/components/dashboard/PatientLogoutButton";
import { Ticker } from "@/components/dashboard/Ticker";

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fs-dash-page flex min-h-screen flex-col">
      <Ticker />
      <header className="fs-sub-nav sticky top-0 z-10">
        <div className="mx-auto flex h-15 max-w-230 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center" aria-label="FileSanté">
            <Image
              src="/Logo.png"
              alt="FileSanté"
              width={140}
              height={32}
              priority
              className="h-7 w-auto"
            />
          </Link>
          <div className="flex items-center gap-3 text-[13px] text-(--ap-ink-muted-80)">
            <span className="hidden sm:inline">Espace patient</span>
            <PatientLogoutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
