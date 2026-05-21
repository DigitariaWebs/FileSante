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
    title: "Centre d'appels",
    items: [
      { href: "/dashboard/811", label: "Tableau de bord", icon: "viewGrid" },
      {
        href: "/dashboard/811/new",
        label: "Nouvelle évaluation",
        icon: "userPlus",
      },
      {
        href: "/dashboard/811/calls",
        label: "Appels du quart",
        icon: "taskList",
      },
    ],
  },
];

const USER: SidebarUser = {
  initials: "YD",
  name: "Yann Deschamps",
  role: "Infirmier 811 · Province",
  email: "yann.deschamps@infosante.qc.ca",
  accentClass: "bg-[#0d74ce]",
  avatar: "https://i.pravatar.cc/150?img=12",
};

export default function HotlineLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fs-dash-page flex min-h-screen">
      <Sidebar
        sections={SECTIONS}
        user={USER}
        exactRoots={["/dashboard", "/dashboard/811"]}
      />
      <Ticker />
      <main className="flex flex-1 flex-col">
        <Topbar />
        <AuthGate allow="HOTLINE_811">{children}</AuthGate>
      </main>
    </div>
  );
}
