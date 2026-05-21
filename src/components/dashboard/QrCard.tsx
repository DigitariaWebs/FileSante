"use client";

import { QRCodeSVG } from "qrcode.react";

export function QrCard({ value, size = 168 }: { value: string; size?: number }) {
  return (
    <div
      className="rounded-2xl border border-(--ap-hairline) bg-white p-3 text-(--ap-ink)"
      style={{ width: size + 24, height: size + 24 }}
    >
      <QRCodeSVG
        value={value}
        size={size}
        bgColor="#ffffff"
        fgColor="#1d1d1f"
        level="M"
        marginSize={0}
      />
    </div>
  );
}
