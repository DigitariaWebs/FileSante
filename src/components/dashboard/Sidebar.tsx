"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon, type IconName } from "@/components/ui/Icon";

export type SidebarItem = {
  href: string;
  label: string;
  icon: IconName;
};

export type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

export type SidebarUser = {
  initials: string;
  name: string;
  role: string;
  email: string;
  accentClass?: string;
};

const DEFAULT_SECTIONS: SidebarSection[] = [
  {
    title: "Pilotage",
    items: [
      { href: "/dashboard/triage", label: "Vue d'ensemble", icon: "viewGrid" },
      {
        href: "/dashboard/triage/queue",
        label: "File d'attente",
        icon: "taskList",
      },
      { href: "/dashboard/triage/kpi", label: "Indicateurs", icon: "graphUp" },
      {
        href: "/dashboard/triage/analytics",
        label: "Analytique",
        icon: "gauge",
      },
    ],
  },
  {
    title: "Opérations",
    items: [
      {
        href: "/dashboard/triage/register",
        label: "Inscription",
        icon: "userPlus",
      },
      { href: "/dashboard/triage/scan", label: "Retour patient", icon: "qr" },
      {
        href: "/dashboard/triage/civieres",
        label: "Civières",
        icon: "archive",
      },
      {
        href: "/dashboard/triage/calls",
        label: "Rappels téléphone",
        icon: "phoneOff",
      },
      { href: "/dashboard/triage/sms", label: "Journal SMS", icon: "chat" },
    ],
  },
];

const DEFAULT_USER: SidebarUser = {
  initials: "MT",
  name: "Marie Tremblay",
  role: "Infirmière triage · HMR",
  email: "marie.tremblay@hmr.qc.ca",
};

type Props = {
  sections?: SidebarSection[];
  user?: SidebarUser;
  exactRoots?: string[];
};

export function Sidebar({
  sections = DEFAULT_SECTIONS,
  user = DEFAULT_USER,
  exactRoots = ["/dashboard", "/dashboard/triage"],
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string) {
    if (exactRoots.includes(href)) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function logout() {
    router.push("/");
  }

  return (
    <aside className="sticky top-0 flex h-screen w-[248px] shrink-0 flex-col border-r border-[var(--ap-hairline)] bg-[var(--ap-canvas)]">
      <Link
        href="/"
        className="flex h-13 items-center border-b border-[var(--ap-hairline)] px-6"
        aria-label="FileSanté"
      >
        <Image
          src="/Logo.png"
          alt="FileSanté"
          width={160}
          height={40}
          priority
          className="h-8 w-auto"
        />
      </Link>

      <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-6">
        {sections.map((sec) => (
          <div key={sec.title}>
            <div className="fs-eyebrow mb-2 px-3">{sec.title}</div>
            <div className="flex flex-col gap-0.5">
              {sec.items.map((it) => {
                const active = isActive(it.href);
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={`group flex items-center gap-3 rounded-md px-3 py-2 text-[14px] transition-colors ${
                      active
                        ? "bg-[var(--ap-surface-strong)] font-semibold text-[var(--ap-ink)]"
                        : "font-medium text-[var(--ap-ink-muted-80)] hover:bg-[var(--ap-canvas-parchment)] hover:text-[var(--ap-ink)]"
                    }`}
                  >
                    <Icon
                      name={it.icon}
                      size={18}
                      className={
                        active
                          ? "text-[var(--ap-ink)]"
                          : "text-[var(--ap-ink-muted-48)] group-hover:text-[var(--ap-ink)]"
                      }
                    />
                    <span className="truncate">{it.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--ap-hairline)] p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-[var(--ap-canvas-parchment)]"
            >
              <div
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white ${
                  user.accentClass ?? "bg-[var(--fs-primary)]"
                }`}
              >
                {user.initials}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[13.5px] font-semibold tracking-[-0.016em] text-[var(--ap-ink)]">
                  {user.name}
                </span>
                <span className="truncate text-[11.5px] text-[var(--ap-ink-muted-48)]">
                  {user.role}
                </span>
              </div>
              <Icon
                name="arrowSeparate"
                size={14}
                className="text-[var(--ap-ink-muted-48)]"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-[var(--ap-ink)]">
                  {user.name}
                </span>
                <span className="truncate text-[11.5px] text-[var(--ap-ink-muted-48)]">
                  {user.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Icon name="settings" size={15} className="mr-1" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icon name="help" size={15} className="mr-1" />
              Aide
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icon name="lifebelt" size={15} className="mr-1" />
              Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-[#c8102e] focus:bg-[rgba(200,16,46,0.06)] focus:text-[#c8102e]"
            >
              <Icon name="logout" size={15} className="mr-1" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
