import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[var(--ap-canvas-parchment)] py-16 text-[var(--ap-ink-muted-80)]">
      <div className="fs-shell">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/Logo.png"
              alt="FileSanté"
              width={140}
              height={32}
              className="h-7 w-auto"
            />
            <p className="mt-4 max-w-[280px] text-[14px] leading-[1.5] text-[var(--ap-ink-muted-80)]">
              Plateforme de routage des patients P4/P5 vers les ressources de
              première ligne — projet pilote 2026.
            </p>
          </div>

          <FooterCol
            title="Produit"
            links={[
              { label: "Comment ça marche", href: "#flow" },
              { label: "Fonctionnalités", href: "#features" },
              { label: "Portails", href: "#portails" },
            ]}
          />
          <FooterCol
            title="Réseau"
            links={[
              { label: "Hôpitaux pilotes", href: "#partenaires" },
              { label: "GMF / CLSC / IPS / UMF", href: "#" },
              { label: "Info-Santé 811", href: "#" },
              { label: "MSSS", href: "#" },
            ]}
          />
          <FooterCol
            title="Contact"
            links={[
              {
                label: "contact@filesante.qc",
                href: "mailto:contact@filesante.qc",
              },
              { label: "Soutien technique", href: "#" },
              { label: "Documentation", href: "#" },
              { label: "Confidentialité", href: "#" },
            ]}
          />
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--ap-hairline)] pt-6 text-[12px] text-[var(--ap-ink-muted-48)]">
          <span>© 2026 FileSanté · Projet pilote Montréal</span>
          <span className="flex gap-4">
            <a href="#" className="hover:text-[var(--ap-ink)]">
              Mentions légales
            </a>
            <a href="#" className="hover:text-[var(--ap-ink)]">
              Vie privée
            </a>
            <a href="#" className="hover:text-[var(--ap-ink)]">
              Accessibilité
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h5 className="mb-2 text-[14px] font-semibold tracking-[-0.016em] text-[var(--ap-ink)]">
        {title}
      </h5>
      <ul>
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              className="block text-[17px] leading-[2.41] text-[var(--ap-ink-muted-80)] hover:text-[var(--ap-ink)]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
