import type { ReactNode } from "react";

type Crumb = { label: string; href?: string };

type Props = {
  title: string;
  description?: string;
  crumbs?: Crumb[];
  eyebrow?: string;
  actions?: ReactNode;
};

export function PageHeader({
  title,
  description,
  crumbs,
  eyebrow,
  actions,
}: Props) {
  return (
    <header className="flex flex-col gap-4 bg-white px-10 py-9">
      {crumbs && crumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-[12.5px] text-[var(--ap-ink-muted-48)]">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
              {c.href ? (
                <a
                  href={c.href}
                  className="text-[var(--fs-primary)] hover:underline"
                >
                  {c.label}
                </a>
              ) : (
                <span>{c.label}</span>
              )}
              {i < crumbs.length - 1 && (
                <span className="text-[var(--ap-hairline)]">/</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-[680px]">
          {eyebrow && <div className="fs-eyebrow mb-2">{eyebrow}</div>}
          <h1 className="fs-display-md">{title}</h1>
          {description && <p className="fs-lead mt-2">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
