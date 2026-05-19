"use client";

type Props = {
  onOpenLogin: () => void;
};

export function Hero({ onOpenLogin }: Props) {
  return (
    <section className="overflow-hidden pt-12 pb-16">
      <div className="fs-shell">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-[var(--fs-primary)] uppercase">
              <span className="fs-pulse-dot" />
              Projet pilote · Montréal 2026
            </div>
            <h1 className="text-[clamp(40px,4.8vw,64px)] leading-[1.02] tracking-[-0.03em]">
              Le bon patient,
              <br />
              au bon endroit, <span className="fs-accent">en temps réel</span>.
            </h1>
            <p className="mt-5 max-w-[520px] text-[17px] text-[var(--fs-ink-2)]">
              FileSanté oriente les patients P4 et P5 vers les ressources de
              première ligne disponibles — GMF, CLSC, IPS, UMF — pour
              désengorger l&apos;urgence et réduire les temps d&apos;attente.
            </p>
            <div className="mt-8 flex items-center gap-3">
              <button className="fs-pill" onClick={onOpenLogin} type="button">
                Accéder au portail
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
              <a className="fs-pill fs-pill-ghost" href="#flow">
                En savoir plus
              </a>
            </div>
            <div className="mt-10 flex items-center gap-8">
              <HeroStat num="4" label="Hôpitaux pilotes" />
              <div className="h-9 w-px bg-[var(--fs-line)]" />
              <HeroStat num="6" label="Portails de rôle" />
              <div className="h-9 w-px bg-[var(--fs-line)]" />
              <HeroStat num="P4 / P5" label="Patients ciblés" />
            </div>
          </div>

          <HeroPanel />
        </div>
      </div>
    </section>
  );
}

function HeroStat({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-display text-[28px] leading-none font-semibold tracking-[-0.02em] text-[var(--fs-ink)]">
        {num}
      </span>
      <span className="text-xs tracking-[0.04em] text-[var(--fs-ink-3)] uppercase">
        {label}
      </span>
    </div>
  );
}

function HeroPanel() {
  return (
    <div className="fs-hero-panel">
      <svg
        className="fs-hero-svg"
        viewBox="0 0 600 600"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="flowGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset=".5" stopColor="#ffffff" stopOpacity=".9" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="ring" cx=".5" cy=".5" r=".5">
            <stop offset=".7" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="1" stopColor="#ffffff" stopOpacity=".22" />
          </radialGradient>
        </defs>

        <circle
          cx="300"
          cy="300"
          r="220"
          fill="none"
          stroke="rgba(255,255,255,.14)"
          strokeDasharray="2 6"
        />
        <circle
          cx="300"
          cy="300"
          r="160"
          fill="none"
          stroke="rgba(255,255,255,.18)"
          strokeDasharray="2 6"
        />
        <circle cx="300" cy="300" r="280" fill="url(#ring)" />

        <g transform="translate(60, 230)">
          <rect width="140" height="140" rx="24" fill="#ffffff" opacity=".96" />
          <rect x="14" y="14" width="112" height="22" rx="6" fill="#e8f3fb" />
          <rect x="14" y="14" width="60" height="22" rx="6" fill="#1e90d6" />
          <text
            x="44"
            y="30"
            fontFamily="Plus Jakarta Sans"
            fontSize="11"
            fontWeight="700"
            fill="#ffffff"
            textAnchor="middle"
          >
            TRIAGE
          </text>
          <rect x="14" y="46" width="112" height="10" rx="3" fill="#dbe7f0" />
          <rect x="14" y="62" width="80" height="10" rx="3" fill="#dbe7f0" />
          <g transform="translate(14,82)">
            <rect width="112" height="20" rx="6" fill="#e8f3fb" />
            <circle cx="12" cy="10" r="5" fill="#1e90d6" />
            <rect x="22" y="6" width="40" height="3" rx="1.5" fill="#0a3a5e" />
            <rect x="22" y="12" width="60" height="3" rx="1.5" fill="#7a92a4" />
          </g>
          <g transform="translate(14,108)">
            <rect width="112" height="20" rx="6" fill="#e8f3fb" />
            <circle cx="12" cy="10" r="5" fill="#1e90d6" opacity=".5" />
            <rect x="22" y="6" width="60" height="3" rx="1.5" fill="#0a3a5e" />
            <rect x="22" y="12" width="40" height="3" rx="1.5" fill="#7a92a4" />
          </g>
        </g>
        <text
          x="130"
          y="220"
          fontFamily="Plus Jakarta Sans"
          fontSize="12"
          fontWeight="600"
          fill="rgba(255,255,255,.85)"
          textAnchor="middle"
          letterSpacing="1"
        >
          URGENCE · P4/P5
        </text>

        <g
          fontFamily="Plus Jakarta Sans"
          fontWeight="700"
          fontSize="13"
          fill="#0a3a5e"
        >
          <g transform="translate(420, 90)">
            <rect width="120" height="58" rx="16" fill="#ffffff" />
            <text x="60" y="26" textAnchor="middle">
              GMF
            </text>
            <text
              x="60"
              y="44"
              textAnchor="middle"
              fontSize="10"
              fontWeight="500"
              fill="#7a92a4"
            >
              Groupe de méd. fam.
            </text>
          </g>
          <g transform="translate(440, 200)">
            <rect width="120" height="58" rx="16" fill="#ffffff" />
            <text x="60" y="26" textAnchor="middle">
              CLSC
            </text>
            <text
              x="60"
              y="44"
              textAnchor="middle"
              fontSize="10"
              fontWeight="500"
              fill="#7a92a4"
            >
              Centre local · santé
            </text>
          </g>
          <g transform="translate(440, 320)">
            <rect width="120" height="58" rx="16" fill="#ffffff" />
            <text x="60" y="26" textAnchor="middle">
              IPS
            </text>
            <text
              x="60"
              y="44"
              textAnchor="middle"
              fontSize="10"
              fontWeight="500"
              fill="#7a92a4"
            >
              Infirmière praticienne
            </text>
          </g>
          <g transform="translate(420, 430)">
            <rect width="120" height="58" rx="16" fill="#ffffff" />
            <text x="60" y="26" textAnchor="middle">
              UMF
            </text>
            <text
              x="60"
              y="44"
              textAnchor="middle"
              fontSize="10"
              fontWeight="500"
              fill="#7a92a4"
            >
              Unité de méd. fam.
            </text>
          </g>
        </g>

        <g
          fill="none"
          stroke="rgba(255,255,255,.55)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="4 6"
        >
          <path d="M200 280 C 280 280 360 120 420 120" />
          <path d="M200 295 C 290 295 380 230 440 230" />
          <path d="M200 310 C 290 310 380 350 440 350" />
          <path d="M200 330 C 280 330 360 460 420 460" />
        </g>

        <g fill="#ffffff">
          <circle r="5">
            <animateMotion
              dur="3.4s"
              repeatCount="indefinite"
              path="M200 280 C 280 280 360 120 420 120"
            />
          </circle>
          <circle r="4" opacity=".8">
            <animateMotion
              dur="3.8s"
              begin=".4s"
              repeatCount="indefinite"
              path="M200 295 C 290 295 380 230 440 230"
            />
          </circle>
          <circle r="5">
            <animateMotion
              dur="3.2s"
              begin=".9s"
              repeatCount="indefinite"
              path="M200 310 C 290 310 380 350 440 350"
            />
          </circle>
          <circle r="4" opacity=".8">
            <animateMotion
              dur="3.6s"
              begin="1.3s"
              repeatCount="indefinite"
              path="M200 330 C 280 330 360 460 420 460"
            />
          </circle>
        </g>

        <g transform="translate(300,300)">
          <circle r="44" fill="#ffffff" opacity=".95" />
          <circle
            r="44"
            fill="none"
            stroke="rgba(255,255,255,.5)"
            strokeWidth="1"
          />
          <text
            y="2"
            fontFamily="Bricolage Grotesque"
            fontWeight="700"
            fontSize="14"
            fill="#0a3a5e"
            textAnchor="middle"
          >
            FileSanté
          </text>
          <text
            y="18"
            fontFamily="Plus Jakarta Sans"
            fontWeight="600"
            fontSize="9"
            fill="#1e90d6"
            textAnchor="middle"
            letterSpacing="1"
          >
            ROUTAGE
          </text>
        </g>
      </svg>

      <div className="fs-float-badge top-6 right-6">
        <span className="ic">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
        <div>
          Attente <span style={{ color: "var(--fs-primary)" }}>42 min</span>
          <div className="sub">HMR · zone Bleue</div>
        </div>
      </div>

      <div className="fs-float-badge bottom-7 left-5">
        <span className="ic">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="3" height="3" rx=".5" />
            <rect x="18" y="14" width="3" height="3" rx=".5" />
            <rect x="14" y="18" width="3" height="3" rx=".5" />
            <rect x="18" y="18" width="3" height="3" rx=".5" />
          </svg>
        </span>
        <div>
          Code QR envoyé
          <div className="sub">SMS · +1 514 ••• 4218</div>
        </div>
      </div>

      <div
        className="fs-float-badge -right-3 top-1/2"
        style={{ transform: "translateY(-50%)" }}
      >
        <span className="ic" style={{ background: "#e6f7ee", color: "#108a52" }}>
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
            <path d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <div>
          Patient routé · CLSC Hochelaga
          <div className="sub">Il y a 2 s</div>
        </div>
      </div>
    </div>
  );
}
