import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      {icon && (
        <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--ap-canvas-parchment)] text-[var(--ap-ink-muted-48)]">
          {icon}
        </div>
      )}
      <div>
        <div className="fs-tagline text-[17px]!">{title}</div>
        {description && (
          <p className="fs-body mt-1.5 max-w-[400px] text-[var(--ap-ink-muted-48)]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
