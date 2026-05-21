import type { ReactNode } from "react";

import {
  Sidebar,
  type SidebarSection,
  type SidebarUser,
} from "@/components/dashboard/Sidebar";
import { Ticker } from "@/components/dashboard/Ticker";
import { Topbar } from "@/components/dashboard/Topbar";
import { AuthGate } from "@/components/layout/AuthGate";

const SECTIONS: SidebarSection[] = [
  {
    title: "Direction",
    items: [
      {
        href: "/dashboard/direction",
        label: "Vue d'ensemble",
        icon: "viewGrid",
      },
      {
        href: "/dashboard/direction/alerts",
        label: "Alertes > 3 h",
        icon: "warning",
      },
      {
        href: "/dashboard/direction/hourly",
        label: "Graphiques horaires",
        icon: "graphUp",
      },
    ],
  },
];

const USER: SidebarUser = {
  initials: "FL",
  name: "Dr. François Lévesque",
  role: "Direction · HMR",
  email: "francois.levesque@hmr.qc.ca",
  accentClass: "bg-[var(--ap-ink)]",
};

export default function DirectionLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="fs-dash-page flex min-h-screen">
      <Sidebar
        sections={SECTIONS}
        user={USER}
        exactRoots={["/dashboard", "/dashboard/direction"]}
      />
      <Ticker />
      <main className="flex flex-1 flex-col">
        <Topbar />
        <AuthGate allow={["DIRECTION", "MSSS"]}>{children}</AuthGate>
      </main>
    </div>
  );
}
