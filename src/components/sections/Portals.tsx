import type { ReactNode } from "react";

type Portal = {
  title: string;
  body: string;
  badge: string;
  meta: ReactNode;
  icon: ReactNode;
};

const portals: Portal[] = [
  {
    title: "Infirmières de triage",
    body: "Tableau de bord principal : file, civières, ajustements, retours patients.",
    badge: "PRIMAIRE",
    meta: (
      <>
        <b>4 hôpitaux</b> · accès complet
      </>
    ),
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
      >
        <path d="M12 4v6" />
        <path d="M9 7h6" />
        <circle cx="12" cy="15" r="4" />
      </svg>
    ),
  },
  {
    title: "Info-Santé 811",
    body: "Orientation téléphonique vers la file ou directement vers une ressource.",
    badge: "811",
    meta: (
      <>
        <b>Province</b> · vue d&apos;écoute
      </>
    ),
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 4h12l3 3v13a1 1 0 0 1-1 1H5z" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    title: "Direction d'hôpital",
    body: "KPI temps réel · 12 h d'inscription · taux LWBS · no-show · occupation.",
    badge: "DIRECTION",
    meta: (
      <>
        <b>HMR · HND · HSC · HGM</b>
      </>
    ),
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 21h18" />
        <path d="M5 21V9l7-5 7 5v12" />
        <path d="M10 21v-6h4v6" />
      </svg>
    ),
  },
  {
    title: "Gouvernement du Québec",
    body: "Vue consolidée sur le pilote — performance, équité, suivi des indicateurs.",
    badge: "GOUV",
    meta: (
      <>
        <b>MSSS</b> · pilote 2026
      </>
    ),
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7l9-4 9 4-9 4z" />
        <path d="M3 12l9 4 9-4" />
        <path d="M3 17l9 4 9-4" />
      </svg>
    ),
  },
  {
    title: "GMF / CLSC / IPS / UMF",
    body: "Cliniques de première ligne — capacité, plages disponibles, patients reçus.",
    badge: "RÉSEAU",
    meta: (
      <>
        <b>+38 partenaires</b> en pilote
      </>
    ),
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
    ),
  },
  {
    title: "Patient",
    body: "Suivi de sa file, son code, ses rappels et son rendez-vous, en français simple.",
    badge: "PATIENT",
    meta: (
      <>
        <b>SMS + Web</b> · sans installation
      </>
    ),
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
];

export function Portals() {
  return (
    <section id="portails" className="py-24">
      <div className="fs-shell">
        <div className="fs-portals">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="fs-sec-eyebrow">Six rôles · Un seul réseau</div>
              <h2 className="mt-2.5 text-[clamp(28px,3vw,40px)] leading-[1.05]">
                Le bon portail pour chaque acteur du réseau
              </h2>
            </div>
            <p className="max-w-[380px] text-[15px]">
              Chaque rôle dispose d&apos;une vue adaptée à ses besoins — du
              triage à la gouvernance provinciale.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {portals.map((p) => (
              <div key={p.title} className="fs-portal">
                <div className="flex items-center justify-between">
                  <span className="ic">{p.icon}</span>
                  <span className="badge">{p.badge}</span>
                </div>
                <h3 className="text-[18px]">{p.title}</h3>
                <p className="text-[13.5px]">{p.body}</p>
                <div className="mt-auto flex items-center gap-2 text-xs text-[var(--fs-ink-3)]">
                  {p.meta}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
