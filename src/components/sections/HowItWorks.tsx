type Step = {
  num: string;
  title: string;
  body: string;
  pill: string;
};

const steps: Step[] = [
  {
    num: "1",
    title: "Triage",
    body: "L'infirmière évalue et classe le patient comme P4 ou P5 admissible.",
    pill: "ÉTSTA",
  },
  {
    num: "2",
    title: "Code & QR",
    body: "Un code à 4 chiffres et un QR sont remis et envoyés par SMS.",
    pill: "SMS · QR",
  },
  {
    num: "3",
    title: "Routage",
    body: "FileSanté propose la ressource de première ligne la plus proche et disponible.",
    pill: "GMF · CLSC · IPS · UMF",
  },
  {
    num: "4",
    title: "Suivi & rappel",
    body: "Le patient reçoit un rappel et son temps d'attente est ajusté automatiquement.",
    pill: "+15 / 30 / 45 min",
  },
  {
    num: "5",
    title: "Retour",
    body: "Si nécessaire, le patient revient à l'urgence — scan QR ou code, sans triage.",
    pill: "RETOUR",
  },
];

export function HowItWorks() {
  return (
    <section id="flow" className="py-24">
      <div className="fs-shell">
        <div className="mx-auto mb-14 max-w-[680px] text-center">
          <div className="fs-sec-eyebrow">Parcours patient</div>
          <h2 className="mt-2.5 text-[clamp(32px,3.4vw,44px)] leading-[1.08]">
            Comment FileSanté oriente un P4/P5
          </h2>
          <p className="mt-3.5 text-base">
            De l&apos;arrivée à l&apos;urgence jusqu&apos;au retour à domicile —
            cinq étapes, sans perdre le fil.
          </p>
        </div>

        <div className="fs-flow">
          <div className="fs-flow-rail">
            {steps.map((s, i) => (
              <div className="fs-step" key={s.num}>
                <div className={`num ${i === 0 ? "filled" : ""}`}>{s.num}</div>
                <h4 className="mt-4 text-base">{s.title}</h4>
                <p className="mt-2 text-[13.5px]">{s.body}</p>
                <span className="fs-step-pill">{s.pill}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
