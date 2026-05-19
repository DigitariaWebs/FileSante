import type { ReactNode } from "react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Ticker } from "@/components/dashboard/Ticker";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[var(--fs-bg-soft-2)]">
      <Sidebar />
      <Ticker />
      <main className="flex-1">{children}</main>
    </div>
  );
}
