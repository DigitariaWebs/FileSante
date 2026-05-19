"use client";

import Link from "next/link";

type Props = {
  onOpenLogin: () => void;
};

export function Navbar({ onOpenLogin }: Props) {
  return (
    <nav className="sticky top-0 z-50 border-b border-[rgba(219,231,240,0.7)] bg-white/[0.78] backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-display text-[22px] font-semibold tracking-[-0.02em]"
        >
          <span className="fs-brand-mark" aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 4v6a4 4 0 0 0 8 0V4" />
              <path d="M5 4h2M11 4h2" />
              <path d="M9 14v2a5 5 0 0 0 10 0v-1.5" />
              <circle cx="19" cy="11.5" r="2" />
            </svg>
          </span>
          <b className="font-semibold text-[var(--fs-ink)]">
            File<span className="text-[var(--fs-primary)]">Santé</span>
          </b>
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
          <Link href="/dashboard" className="fs-pill fs-pill-ghost">
            Voir le tableau de bord
          </Link>
          <button className="fs-pill" onClick={onOpenLogin} type="button">
            Connexion
          </button>
        </div>
      </div>
    </nav>
  );
}
