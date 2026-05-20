"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: 0 | 1 | 2 | 3 | 4 | 5;
  className?: string;
  as?: "div" | "section" | "article" | "li" | "span";
  threshold?: number;
};

export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
  threshold = 0.15,
}: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -80px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  const cls = [
    "fs-reveal",
    delay > 0 ? `fs-reveal-delay-${delay}` : "",
    shown ? "is-in" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag ref={ref as React.Ref<never>} className={cls}>
      {children}
    </Tag>
  );
}
