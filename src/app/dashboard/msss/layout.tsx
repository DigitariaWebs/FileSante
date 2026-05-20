import type { ReactNode } from "react";

import {
  Sidebar,
  type SidebarSection,
  type SidebarUser,
} from "@/components/dashboard/Sidebar";
import { Ticker } from "@/components/dashboard/Ticker";
import { Topbar } from "@/components/dashboard/Topbar";

const SECTIONS: SidebarSection[] = [
  {
    title: "Province",
    items: [
      {
        href: "/dashboard/msss",
        label: "Vue provinciale",
        icon: "viewGrid",
      },
      {
        href: "/dashboard/msss/hospitals",
        label: "Tous les hôpitaux",
        icon: "graphUp",
      },
      {
        href: "/dashboard/msss/sectors",
        label: "Carte sectorielle",
        icon: "taskList",
      },
    ],
  },
];

const USER: SidebarUser = {
  initials: "MS",
  name: "Marc Soucy",
  role: "MSSS · Analyste réseau",
  email: "marc.soucy@msss.gouv.qc.ca",
  accentClass: "bg-[#0d74ce]",
};

export default function MsssLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fs-dash-page flex min-h-screen">
      <Sidebar
        sections={SECTIONS}
        user={USER}
        exactRoots={["/dashboard", "/dashboard/msss"]}
      />
      <Ticker />
      <main className="flex flex-1 flex-col">
        <Topbar />
        {children}
      </main>
    </div>
  );
}
