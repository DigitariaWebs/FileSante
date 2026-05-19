"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/dashboard/queue",
    label: "File d'attente",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 6h16M4 12h10M4 18h7" />
      </svg>
    ),
  },
  {
    href: "/dashboard/register",
    label: "Inscription",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    href: "/dashboard/scan",
    label: "Retour patient",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="3" height="3" rx=".5" />
        <rect x="18" y="14" width="3" height="3" rx=".5" />
        <rect x="14" y="18" width="3" height="3" rx=".5" />
        <rect x="18" y="18" width="3" height="3" rx=".5" />
      </svg>
    ),
  },
  {
    href: "/dashboard/kpi",
    label: "Indicateurs",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="M7 14l3-3 4 4 5-6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/sms",
    label: "Journal SMS",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 flex h-screen w-[240px] flex-col border-r border-[var(--fs-line)] bg-white">
      <Link
        href="/"
        className="flex items-center border-b border-[var(--fs-line)] px-5 py-5"
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

      <nav className="flex flex-col gap-1 p-3">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-[var(--fs-bg-soft)] text-[var(--fs-primary)]"
                  : "text-[var(--fs-ink-2)] hover:bg-[var(--fs-bg-soft-2)]"
              }`}
            >
              <span className={active ? "text-[var(--fs-primary)]" : "text-[var(--fs-ink-3)]"}>
                {it.icon}
              </span>
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-[var(--fs-line)] p-4 text-xs text-[var(--fs-ink-3)]">
        <div className="font-semibold text-[var(--fs-ink-2)]">Infirmière triage</div>
        <div className="mt-0.5">HMR · zone Bleue</div>
      </div>
    </aside>
  );
}
