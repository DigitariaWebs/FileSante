import { IconBed, IconBuildingHospital, IconClipboardList, IconStethoscope } from "@tabler/icons-react";
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
    icon: <IconClipboardList size={22} strokeWidth={1.5} />,
  },
  {
    title: "Suivi des civières",
    body: "20 lits, statut en direct, durée d'occupation, alertes de libération.",
    tags: ["20 lits", "Alertes"],
    icon: <IconBed size={22} strokeWidth={1.5} />,
  },
  {
    title: "Ajustement d'attente",
    body: "+15, +30 ou +45 min — diffusé instantanément par SMS aux patients.",
    tags: ["+15", "+30", "+45 min"],
    icon: <IconStethoscope size={22} strokeWidth={1.5} />,
  },
  {
    title: "Carte & GMF/CLSC",
    body: "Ressources de première ligne géolocalisées avec dispo en direct.",
    tags: ["GMF", "CLSC", "IPS", "UMF"],
    icon: <IconBuildingHospital size={22} strokeWidth={1.5} />,
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
