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
    title: "Établissement",
    items: [
      {
        href: "/dashboard/clinique",
        label: "Vue d'ensemble",
        icon: "viewGrid",
      },
      {
        href: "/dashboard/clinique/inbox",
        label: "Demandes reçues",
        icon: "taskList",
      },
      {
        href: "/dashboard/clinique/capacity",
        label: "Capacité",
        icon: "graphUp",
      },
    ],
  },
];

const USER: SidebarUser = {
  initials: "GP",
  name: "GMF Plateau",
  role: "Première ligne · Plateau-Mont-Royal",
  email: "accueil@gmfplateau.qc.ca",
  accentClass: "bg-[#34c759]",
};

export default function CliniqueLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fs-dash-page flex min-h-screen">
      <Sidebar
        sections={SECTIONS}
        user={USER}
        exactRoots={["/dashboard", "/dashboard/clinique"]}
      />
      <Ticker />
      <main className="flex flex-1 flex-col">
        <Topbar />
        {children}
      </main>
    </div>
  );
}
