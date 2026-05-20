import type { ReactNode } from "react";

type Props = {
  children?: ReactNode;
  className?: string;
};

export function PhoneFrame({ children, className = "" }: Props) {
  return (
    <div
      className={`relative ${className}`}
      style={{ filter: "drop-shadow(rgba(0,0,0,0.25) 4px 14px 40px)" }}
    >
      <div
        className="relative h-[560px] w-[280px] rounded-[44px] bg-[#1d1d1f] p-[10px]"
        style={{
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 0 0 2px #2a2a2c",
        }}
      >
        {/* Notch */}
        <div className="absolute top-2 left-1/2 z-10 h-7 w-[110px] -translate-x-1/2 rounded-full bg-black" />
        {/* Side button stubs */}
        <div className="absolute top-24 -left-[3px] h-12 w-[3px] rounded-l-md bg-[#1d1d1f]" />
        <div className="absolute top-40 -right-[3px] h-16 w-[3px] rounded-r-md bg-[#1d1d1f]" />
        {/* Screen */}
        <div className="relative h-full w-full overflow-hidden rounded-[36px] bg-[var(--ap-canvas-parchment)]">
          {children}
        </div>
      </div>
    </div>
  );
}
