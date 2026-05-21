import Image from "next/image";

type Partner = {
  mark: string;
  name: string;
  sub: string;
  ciusss: string;
  img: string;
};

const partners: Partner[] = [
  {
    mark: "HMR",
    name: "Hôpital Maisonneuve-Rosemont",
    sub: "5415 boul. de l'Assomption, Montréal",
    ciusss: "CIUSSS de l'Est-de-l'Île",
    img: "https://upload.wikimedia.org/wikipedia/commons/e/ef/Hopital_Maisonneuve-Rosemont_04.jpg",
  },
  {
    mark: "HND",
    name: "Hôpital Notre-Dame",
    sub: "1560 rue Sherbrooke Est, Montréal",
    ciusss: "CIUSSS du Centre-Sud",
    img: "https://upload.wikimedia.org/wikipedia/commons/2/22/Notre_Dame_Hospital_Montreal.jpg",
  },
  {
    mark: "HSC",
    name: "Hôpital du Sacré-Cœur",
    sub: "5400 boul. Gouin Ouest, Montréal",
    ciusss: "CIUSSS du Nord-de-l'Île",
    img: "https://upload.wikimedia.org/wikipedia/commons/9/93/Hopital_du_Sacre_Coeur_de_Montreal.jpg",
  },
  {
    mark: "HGM",
    name: "Hôpital général de Montréal",
    sub: "1650 av. Cedar, Montréal",
    ciusss: "CUSM",
    img: "https://upload.wikimedia.org/wikipedia/commons/a/aa/H%C3%B4pital_G%C3%A9n%C3%A9ral_de_Montr%C3%A9al.JPG",
  },
];

export function Partners() {
  return (
    <section id="partenaires" className="pt-16 pb-24">
      <div className="fs-shell">
        <div className="mx-auto mb-14 max-w-[680px] text-center">
          <div className="fs-sec-eyebrow">Hôpitaux pilotes · Montréal 2026</div>
          <h2 className="mt-2.5 text-[clamp(32px,3.4vw,44px)] leading-[1.08]">
            Quatre établissements, un même réseau
          </h2>
          <p className="mt-3.5 text-base text-[var(--fs-ink-2)]">
            FileSanté est déployé dans les quatre hôpitaux du réseau universitaire de Montréal — un même système, quatre urgences connectées.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {partners.map((p) => (
            <div
              key={p.mark}
              className="group overflow-hidden rounded-2xl border border-[var(--fs-line)] bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="relative h-48 sm:h-64 md:h-82 w-full overflow-hidden bg-fs-bg-soft-2">
                <Image
                  src={p.img}
                  alt={p.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-lg bg-[var(--fs-primary)] px-2.5 py-1 font-mono text-[13px] font-bold text-white tracking-wider">
                  {p.mark}
                </span>
              </div>
              <div className="px-6 py-5">
                <div className="text-[17px] font-semibold tracking-[-0.016em] text-[var(--fs-ink)]">
                  {p.name}
                </div>
                <div className="mt-1 text-[13px] text-[var(--fs-ink-3)]">
                  {p.sub}
                </div>
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--fs-line)] px-3 py-1 text-[11.5px] font-medium text-[var(--fs-ink-3)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--fs-primary)]" />
                  {p.ciusss}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
