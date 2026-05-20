"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  slow?: boolean;
  className?: string;
};

export function Marquee({ children, slow, className = "" }: Props) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        maskImage:
          "linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)",
      }}
    >
      <div
        className={`fs-marquee-track ${slow ? "fs-marquee-track-slow" : ""}`}
      >
        <div className="flex shrink-0 items-center gap-12 pr-12">
          {children}
        </div>
        <div
          className="flex shrink-0 items-center gap-12 pr-12"
          aria-hidden="true"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
