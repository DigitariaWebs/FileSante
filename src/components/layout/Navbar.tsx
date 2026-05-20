"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { auth, ROLE_HOME, useAuth } from "@/lib/filesante/auth";

type Props = {
  onOpenLogin: () => void;
};

export function Navbar({ onOpenLogin }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  function logout() {
    auth.logout();
    router.replace("/?logout=1");
  }
  return (
    <nav className="sticky top-0 z-50 border-b border-[rgba(219,231,240,0.7)] bg-white/[0.78] backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-10">
        <Link href="/" className="flex items-center" aria-label="FileSanté">
          <Image
            src="/Logo.png"
            alt="FileSanté"
            width={160}
            height={40}
            priority
            className="h-9 w-auto"
          />
        </Link>

        <div className="hidden gap-9 text-[14.5px] font-medium text-[var(--fs-ink-2)] md:flex">
          <a href="#flow" className="transition-colors hover:text-[var(--fs-primary)]">
            Comment ça marche
          </a>
          <a
            href="#features"
            className="transition-colors hover:text-[var(--fs-primary)]"
          >
            Fonctionnalités
          </a>
          <a
            href="#portails"
            className="transition-colors hover:text-[var(--fs-primary)]"
          >
            Portails
          </a>
          <a
            href="#partenaires"
            className="transition-colors hover:text-[var(--fs-primary)]"
          >
            Partenaires
          </a>
        </div>

        <div className="flex items-center gap-2.5">
          {user ? (
            <>
              <Link
                href={ROLE_HOME[user.role]}
                className="hidden text-[13px] font-semibold text-[var(--fs-primary)] sm:inline"
              >
                {user.firstName} {user.lastName}
              </Link>
              <button
                className="fs-pill"
                onClick={logout}
                type="button"
                title="Déconnexion"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <button className="fs-pill" onClick={onOpenLogin} type="button">
              Connexion
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
