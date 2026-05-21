import { IconBuildingCommunity, IconBuildingEstate, IconBuildingHospital, IconMap, IconPhone, IconStethoscope, IconUserHeart } from "@tabler/icons-react";
import Link from "next/link";
import type { ReactNode } from "react";

type Portal = {
  title: string;
  body: string;
  badge: string;
  href: string;
  meta: ReactNode;
  icon: ReactNode;
};

const portals: Portal[] = [
  {
    title: "Infirmières de triage",
    body: "Tableau de bord principal : file, civières, ajustements, retours patients.",
    badge: "PRIMAIRE",
    href: "/dashboard/triage",
    meta: (
      <>
        <b>4 hôpitaux</b> · accès complet
      </>
    ),
    icon: <IconStethoscope size={20} strokeWidth={1.5} />,
  },
  {
    title: "Info-Santé 811",
    body: "Orientation téléphonique vers la file ou directement vers une ressource.",
    badge: "811",
    href: "/dashboard/811",
    meta: (
      <>
        <b>Province</b> · vue d&apos;écoute
      </>
    ),
    icon: <IconPhone size={20} strokeWidth={1.5} />,
  },
  {
    title: "Direction d'hôpital",
    body: "KPI temps réel · 12 h d'inscription · taux LWBS · no-show · occupation.",
    badge: "DIRECTION",
    href: "/dashboard/direction",
    meta: (
      <>
        <b>HMR · HND · HSC · HGM</b>
      </>
    ),
    icon: <IconBuildingHospital size={20} strokeWidth={1.5} />,
  },
  {
    title: "Gouvernement du Québec",
    body: "Vue consolidée sur le pilote — performance, équité, suivi des indicateurs.",
    badge: "GOUV",
    href: "/dashboard/msss",
    meta: (
      <>
        <b>MSSS</b> · pilote 2026
      </>
    ),
    icon: <IconBuildingEstate size={20} strokeWidth={1.5} />,
  },
  {
    title: "GMF / CLSC / IPS / UMF",
    body: "Cliniques de première ligne — capacité, plages disponibles, patients reçus.",
    badge: "RÉSEAU",
    href: "/dashboard/clinique",
    meta: (
      <>
        <b>+38 partenaires</b> en pilote
      </>
    ),
    icon: <IconBuildingCommunity size={20} strokeWidth={1.5} />,
  },
  {
    title: "Carte sectorielle",
    body: "Heatmap d'utilisation des cliniques de première ligne par secteur de Montréal.",
    badge: "CARTE",
    href: "/dashboard/msss/sectors",
    meta: (
      <>
        <b>12 secteurs</b> · temps réel
      </>
    ),
    icon: <IconMap size={20} strokeWidth={1.5} />,
  },
  {
    title: "Patient",
    body: "Suivi de sa file, son code, ses rappels et son rendez-vous, en français simple.",
    badge: "PATIENT",
    href: "/dashboard/patient",
    meta: (
      <>
        <b>SMS + Web</b> · sans installation
      </>
    ),
    icon: <IconUserHeart size={20} strokeWidth={1.5} />,
  },
];

export function Portals() {
  return (
    <section id="portails" className="py-24">
      <div className="fs-shell">
        <div className="fs-portals">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="fs-sec-eyebrow">Sept rôles · Un seul réseau</div>
              <h2 className="mt-2.5 text-[clamp(28px,3vw,40px)] leading-[1.05]">
                Le bon portail pour chaque acteur du réseau
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {portals.map((p) => (
              <Link key={p.title} href={p.href} className="fs-portal group">
                <div className="flex items-center justify-between">
                  <span className="ic">{p.icon}</span>
                  <span className="badge">{p.badge}</span>
                </div>
                <h3 className="text-[18px]">{p.title}</h3>
                <p className="text-[13.5px]">{p.body}</p>
                <div className="mt-auto flex items-center justify-between gap-2 text-xs text-[var(--fs-ink-3)]">
                  <span>{p.meta}</span>
                  <span className="inline-flex items-center gap-1 text-[var(--fs-primary)] font-semibold opacity-0 transition-opacity group-hover:opacity-100">
                    Ouvrir
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14" />
                      <path d="m13 6 6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
