import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 bg-[#0a2030] py-16 pb-8 text-[#cfdbe7]">
      <div className="fs-shell">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/Logo.png"
              alt="FileSanté"
              width={180}
              height={45}
              className="h-10 w-auto brightness-0 invert"
            />
            <p className="mt-3.5 max-w-[280px] text-sm text-[#92a8bd]">
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
              { label: "Tableau de bord", href: "/dashboard" },
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
              { label: "contact@filesante.qc", href: "mailto:contact@filesante.qc" },
              { label: "Soutien technique", href: "#" },
              { label: "Documentation", href: "#" },
              { label: "Confidentialité", href: "#" },
            ]}
          />
        </div>

        <div className="mt-12 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-6 text-[12.5px] text-[#92a8bd]">
          <span>© 2026 FileSanté · Projet pilote Montréal</span>
          <span>
            <a href="#" className="ml-4 text-[#92a8bd] hover:text-white">
              Mentions légales
            </a>
            <a href="#" className="ml-4 text-[#92a8bd] hover:text-white">
              Vie privée
            </a>
            <a href="#" className="ml-4 text-[#92a8bd] hover:text-white">
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
      <h5 className="mb-3.5 text-xs font-semibold tracking-[0.16em] text-[#7ec4ec] uppercase">
        {title}
      </h5>
      {links.map((l) => (
        <Link
          key={l.label}
          href={l.href}
          className="block py-1.5 text-sm text-[#cfdbe7] hover:text-white"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
