"use client";

import { SpecialDayBanner } from "@/components/special-day-banner";
import type { SpecialDay } from "@/db/schema";

/** Smart Log modal header — gradient sparkle square + title + close, then a
 *  date row with any special-day chips. */
export function SLHeader({
  locale,
  logDate,
  specialDays,
  onClose,
  titleId,
}: {
  locale: string;
  logDate: Date;
  specialDays: SpecialDay[];
  onClose: () => void;
  titleId: string;
}) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, var(--purple), #C9A6F5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M12 3 L13.5 9 L20 12 L13.5 15 L12 21 L10.5 15 L4 12 L10.5 9 Z" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span id={titleId} style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--w-ink)" }}>
            {locale === "th" ? "บันทึกด้วย AI" : "Smart Log AI"}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label={locale === "th" ? "ปิด" : "Close"}
          style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--w-tint)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M6 6l12 12M18 6L6 18" stroke="var(--w-ink-2)" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div style={{ padding: "12px 28px 0", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }} aria-hidden>
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="var(--w-ink-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--w-ink-2)" }}>
            {logDate.toLocaleDateString(locale === "th" ? "th-TH" : "en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
        {specialDays.length > 0 && <SpecialDayBanner days={specialDays} locale={locale} />}
      </div>
    </>
  );
}
