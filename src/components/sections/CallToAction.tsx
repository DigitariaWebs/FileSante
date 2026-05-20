"use client";

type Props = {
  onOpenLogin: () => void;
};

export function CallToAction({ onOpenLogin }: Props) {
  return (
    <section className="pt-8 pb-24">
      <div className="fs-shell">
        <div className="fs-cta-strip">
          <div>
            <h2 className="max-w-[520px] text-[clamp(28px,3vw,40px)] leading-[1.05] text-white">
              Prêt à essayer le tableau de bord ?
            </h2>
            <p className="mt-3.5 max-w-[480px]">
              Aucun mot de passe. Choisissez votre rôle — triage, 811,
              direction, MSSS, clinique ou patient — vous êtes dans votre
              portail en 4 secondes.
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <button className="fs-pill" onClick={onOpenLogin} type="button">
              Se connecter
              <svg
                width="16"
                height="16"
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
            </button>
            <div className="text-[12.5px] text-white/70">
              Démo · projet pilote · données fictives
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
