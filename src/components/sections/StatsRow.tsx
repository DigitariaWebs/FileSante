import { IconBed, IconBuildingHospital, IconClipboardList, IconUserCheck } from "@tabler/icons-react";
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
    icon: <IconClipboardList size={18} strokeWidth={1.5} />,
  },
  {
    title: "Civières & lits",
    body: "Carte des 20 civières en temps réel — occupation, durée et alertes.",
    cta: "Suivi",
    href: "/dashboard/direction",
    icon: <IconBed size={18} strokeWidth={1.5} />,
  },
  {
    title: "Retour patient",
    body: "Scan QR ou code 4 chiffres — le patient revient sans repasser au triage.",
    cta: "Scanner",
    href: "/dashboard/triage/scan",
    icon: <IconUserCheck size={18} strokeWidth={1.5} />,
  },
  {
    title: "Carte sectorielle",
    body: "GMF, CLSC, IPS et UMF disponibles à proximité du patient.",
    cta: "Carte",
    href: "/dashboard/msss/sectors",
    icon: <IconBuildingHospital size={18} strokeWidth={1.5} />,
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
