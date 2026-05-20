import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { Ticker } from "@/components/dashboard/Ticker";

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fs-dash-page flex min-h-screen flex-col">
      <Ticker />
      <header className="fs-sub-nav sticky top-0 z-10">
        <div className="mx-auto flex h-[60px] max-w-[920px] items-center justify-between px-6">
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
          <div className="flex items-center gap-3 text-[13px] text-[var(--ap-ink-muted-80)]">
            <span className="hidden sm:inline">Espace patient</span>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
