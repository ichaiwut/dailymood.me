"use client";

import type { SpecialDay } from "@/db/schema";

export function SpecialDayBanner({
  days,
  locale,
}: {
  days: SpecialDay[];
  locale: string;
}) {
  if (days.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        marginBottom: 12,
      }}
    >
      {days.map((d) => (
        <span
          key={`${d.date}-${d.type}-${d.id ?? d.label}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 100,
            background: d.type === "holiday" ? "#FFF0F3" : "#EFF6FF",
            fontSize: 14,
            fontWeight: 600,
            color: d.type === "holiday" ? "#BE123C" : "#1D4ED8",
          }}
        >
          <span>{d.emoji}</span>
          {locale === "th" ? (d.labelTh ?? d.label) : d.label}
        </span>
      ))}
    </div>
  );
}
