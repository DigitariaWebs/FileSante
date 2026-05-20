import { Marquee } from "@/components/ui/Marquee";

const items = [
  "4 hôpitaux pilotes",
  "6 portails de rôle",
  "+38 partenaires de première ligne",
  "100% Web · sans installation",
  "SMS + Web · accessible 24/7",
  "Loi 25 · conformité Québec",
  "Routage en < 4 secondes",
  "Données journalisées · auditables",
];

export function MarqueeStrip() {
  return (
    <section className="border-y border-[var(--ap-hairline)] bg-[var(--ap-canvas)] py-5">
      <Marquee>
        {items.map((it, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-3 text-[14px] text-[#424245]"
          >
            <span className="text-[var(--fs-primary)]">●</span>
            <span className="font-medium tracking-[-0.016em]">{it}</span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
