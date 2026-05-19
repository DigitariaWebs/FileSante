import type { ReactNode } from "react";

type Feature = {
  title: string;
  body: string;
  tags: string[];
  icon: ReactNode;
};

const features: Feature[] = [
  {
    title: "File virtuelle P4/P5",
    body: "Position en direct, attente estimée, glisser-déposer pour réordonner.",
    tags: ["QR", "SMS", "Codes 4 chiffres"],
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 5h16M4 12h11M4 19h7" />
        <circle cx="19" cy="19" r="3" />
      </svg>
    ),
  },
  {
    title: "Suivi des civières",
    body: "20 lits, statut en direct, durée d'occupation, alertes de libération.",
    tags: ["20 lits", "Alertes"],
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="9" width="18" height="9" rx="3" />
        <path d="M3 18v3M21 18v3" />
        <circle cx="8" cy="13.5" r="1.6" />
        <path d="M13 13.5h5" />
      </svg>
    ),
  },
  {
    title: "Ajustement d'attente",
    body: "+15, +30 ou +45 min — diffusé instantanément par SMS aux patients.",
    tags: ["+15", "+30", "+45 min"],
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    title: "Carte & GMF/CLSC",
    body: "Ressources de première ligne géolocalisées avec dispo en direct.",
    tags: ["GMF", "CLSC", "IPS", "UMF"],
    icon: (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 12c0-4 4-7 9-7s9 3 9 7-4 7-9 7c-1 0-2 0-3-.3L4 21l1.3-3.7C4.4 16.2 3 14.2 3 12Z" />
      </svg>
    ),
  },
];

export function Features() {
  return (
    <section id="features" className="pt-12 pb-24">
      <div className="fs-shell">
        <div className="mx-auto mb-14 max-w-[680px] text-center">
          <div className="fs-sec-eyebrow">Fonctionnalités</div>
          <h2 className="mt-2.5 text-[clamp(32px,3.4vw,44px)] leading-[1.08]">
            Tout ce dont l&apos;urgence a besoin, dans un seul tableau
          </h2>
          <p className="mt-3.5 text-base">
            Conçu avec et pour les infirmières de triage du réseau québécois.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="fs-feature">
              <div className="ic">{f.icon}</div>
              <h3 className="text-[18px]">{f.title}</h3>
              <p className="text-[13.5px]">{f.body}</p>
              <div className="mt-auto flex flex-wrap gap-1.5">
                {f.tags.map((t) => (
                  <span key={t} className="fs-tag">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
