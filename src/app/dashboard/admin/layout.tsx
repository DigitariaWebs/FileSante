import type { ReactNode } from "react";

import { Sidebar, type SidebarSection } from "@/components/dashboard/Sidebar";
import { Ticker } from "@/components/dashboard/Ticker";
import { Topbar } from "@/components/dashboard/Topbar";
import { AuthGate } from "@/components/layout/AuthGate";

const ADMIN_SECTIONS: SidebarSection[] = [
  {
    title: "Administration",
    items: [
      { href: "/dashboard/admin", label: "Vue globale", icon: "viewGrid" },
      {
        href: "/dashboard/msss",
        label: "Tableau MSSS",
        icon: "graphUp",
      },
      {
        href: "/dashboard/direction",
        label: "Direction d'hôpital",
        icon: "gauge",
      },
    ],
  },
  {
    title: "Réseau",
    items: [
      { href: "/dashboard/msss/hospitals", label: "Hôpitaux", icon: "archive" },
      { href: "/dashboard/msss/sectors", label: "Secteurs", icon: "taskList" },
    ],
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fs-dash-page flex min-h-screen">
      <Sidebar
        sections={ADMIN_SECTIONS}
        user={{
          initials: "AD",
          name: "Admin système",
          role: "Vue tous hôpitaux",
          email: "admin@filesante.qc.ca",
          accentClass: "bg-[#7c3aed]",
        }}
        exactRoots={["/dashboard/admin"]}
      />
      <Ticker />
      <main className="flex flex-1 flex-col">
        <Topbar />
        <AuthGate allow="MSSS">{children}</AuthGate>
      </main>
    </div>
  );
}
