import Link from "next/link";
import type { ReactNode } from "react";

type Stat = {
  title: string;
  body: string;
  cta: string;
  href: string;
  icon: ReactNode;
  primary?: boolean;
};

const stats: Stat[] = [
  {
    title: "File d'attente virtuelle",
    body: "Suivi en direct des patients P4/P5 avec position, attente estimée et notifications SMS.",
    cta: "Voir la file",
    href: "/dashboard/triage/queue",
    primary: true,
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      >
        <path d="M4 6h16M4 12h10M4 18h7" />
      </svg>
    ),
  },
  {
    title: "Civières & lits",
    body: "Carte des 20 civières en temps réel — occupation, durée et alertes.",
    cta: "Suivi",
    href: "/dashboard/direction",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 8h14a4 4 0 0 1 4 4v4H3z" />
        <path d="M3 16v4M21 16v4" />
        <circle cx="7" cy="11.5" r="1.6" />
      </svg>
    ),
  },
  {
    title: "Retour patient",
    body: "Scan QR ou code 4 chiffres — le patient revient sans repasser au triage.",
    cta: "Scanner",
    href: "/dashboard/triage/scan",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
      </svg>
    ),
  },
  {
    title: "Carte sectorielle",
    body: "GMF, CLSC, IPS et UMF disponibles à proximité du patient.",
    cta: "Carte",
    href: "/dashboard/msss/sectors",
    icon: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 3 3 5v16l6-2 6 2 6-2V3l-6 2z" />
        <path d="M9 3v16M15 5v16" />
      </svg>
    ),
  },
];

export function StatsRow() {
  return (
    <section className="pt-0 pb-20">
      <div className="fs-shell relative z-[2] -mt-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.title} stat={s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className={`fs-stat-card ${stat.primary ? "primary" : ""}`}>
      <div className="flex items-start justify-between">
        <h3 className="max-w-[140px] text-[18px] leading-tight">{stat.title}</h3>
        <span className="ic">{stat.icon}</span>
      </div>
      <div className="body">
        <p>{stat.body}</p>
      </div>
      <div className="mt-auto">
        <Link href={stat.href} className="mini-btn">
          {stat.cta}
        </Link>
      </div>
    </div>
  );
}
