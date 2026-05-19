type Partner = { mark: string; name: string; sub: string };

const partners: Partner[] = [
  {
    mark: "HMR",
    name: "Hôpital Maisonneuve-Rosemont",
    sub: "CIUSSS de l'Est-de-l'Île",
  },
  {
    mark: "HND",
    name: "Hôpital Notre-Dame",
    sub: "CIUSSS du Centre-Sud",
  },
  {
    mark: "HSC",
    name: "Hôpital du Sacré-Cœur",
    sub: "CIUSSS du Nord-de-l'Île",
  },
  {
    mark: "HGM",
    name: "Hôpital général de Montréal",
    sub: "CUSM",
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
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {partners.map((p) => (
            <div key={p.mark} className="fs-partner">
              <div className="fs-partner-mark">{p.mark}</div>
              <div>
                <div className="text-[15.5px] font-semibold text-[var(--fs-ink)]">
                  {p.name}
                </div>
                <div className="mt-0.5 text-[12.5px] text-[var(--fs-ink-3)]">
                  {p.sub}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
