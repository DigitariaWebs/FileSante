"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { auth, ROLE_HOME, useAuth } from "@/lib/filesante/auth";

type Props = {
  onOpenLogin: () => void;
};

const NAV_LINKS = [
  { label: "Comment ça marche", href: "#flow" },
  { label: "Fonctionnalités", href: "#features" },
  { label: "Portails", href: "#portails" },
  { label: "Partenaires", href: "#partenaires" },
];

export function Navbar({ onOpenLogin }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  function logout() {
    auth.logout();
    router.replace("/?logout=1");
  }

  function handleMobileNavClick() {
    setMobileOpen(false);
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-[rgba(219,231,240,0.7)] bg-white/78 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-16 md:h-18 max-w-360 items-center justify-between px-4 sm:px-6 md:px-10">
        <Link href="/" className="flex items-center" aria-label="FileSanté">
          <Image
            src="/Logo.png"
            alt="FileSanté"
            width={160}
            height={40}
            priority
            className="h-8 md:h-9 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden gap-9 text-[14.5px] font-medium text-fs-ink-2 md:flex">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="transition-colors hover:text-fs-primary">
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href={ROLE_HOME[user.role]}
                className="hidden text-[13px] font-semibold text-[var(--fs-primary)] sm:inline"
              >
                {user.firstName} {user.lastName}
              </Link>
              <button className="fs-pill fs-pill-sm" onClick={logout} type="button">
                Déconnexion
              </button>
            </>
          ) : (
            <button className="fs-pill fs-pill-sm md:fs-pill" onClick={onOpenLogin} type="button">
              Connexion
            </button>
          )}

          {/* Hamburger — mobile only */}
          <button
            className="ml-1 flex md:hidden h-9 w-9 items-center justify-center rounded-lg text-fs-ink-2"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
            type="button"
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[rgba(219,231,240,0.7)] bg-white/96 px-4 py-3 md:hidden">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={handleMobileNavClick}
              className="block py-3 text-[16px] font-medium text-fs-ink-2 border-b border-fs-line last:border-0 hover:text-fs-primary"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
