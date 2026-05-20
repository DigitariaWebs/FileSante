import type { ReactNode } from "react";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { Ticker } from "@/components/dashboard/Ticker";
import { Topbar } from "@/components/dashboard/Topbar";
import { AuthGate } from "@/components/layout/AuthGate";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="fs-dash-page flex min-h-screen">
      <Sidebar />
      <Ticker />
      <main className="flex flex-1 flex-col">
        <Topbar />
        <AuthGate allow="TRIAGE">{children}</AuthGate>
      </main>
    </div>
  );
}
