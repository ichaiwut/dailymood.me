"use client";

import { useTranslations } from "next-intl";
import { PASticker } from "../pa-sticker";

/**
 * Empty state for the Today feed (no entries logged today).
 * A washi-taped paper sheet with a haloed mood sticker and a gentle nudge
 * toward the mood picker above, plus a "write freely" CTA that focuses the
 * inline AI composer. Theme-aware; copy stays soft, never demanding.
 */
export function EmptyToday({
  locale,
  pack,
  iconFormat,
  onWriteFreely,
}: {
  locale: string;
  pack?: string;
  iconFormat?: string;
  onWriteFreely: () => void;
}) {
  const t = useTranslations("home");

  return (
    <div
      className="pa-sheet fade-in"
      style={{
        maxWidth: 420,
        margin: "8px auto 0",
        padding: "44px 32px 36px",
        textAlign: "center",
        position: "relative",
      }}
    >
      <span className="pa-washi lav" aria-hidden style={{ width: 104 }} />

      {/* Soft halo + floating sticker */}
      <div style={{ position: "relative", display: "grid", placeItems: "center", marginTop: 14, marginBottom: 22 }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            width: 132,
            height: 132,
            borderRadius: "50%",
            background: "radial-gradient(circle, var(--lavender), transparent 70%)",
            opacity: 0.5,
          }}
        />
        <div className="pa-float" style={{ position: "relative" }}>
          <PASticker moodId="happy" color="#85ECCB" size={76} borderWidth={5} pack={pack} iconFormat={iconFormat} />
          <span aria-hidden style={{ position: "absolute", top: -6, right: -10, fontSize: 16, opacity: 0.85 }}>✦</span>
          <span aria-hidden style={{ position: "absolute", bottom: 2, left: -12, fontSize: 11, opacity: 0.7 }}>✦</span>
        </div>
      </div>

      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--w-ink)", margin: "0 0 8px", letterSpacing: "-0.01em" }}>
        {t("emptyTitle")}
      </h2>
      <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.6, color: "var(--w-ink-2)", margin: "0 auto 22px", maxWidth: 300 }}>
        {t("emptyBody")}
      </p>

      <button type="button" className="pa-btn purple" onClick={onWriteFreely} style={{ height: "auto", padding: "11px 22px", lineHeight: 1.3 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3 L13.5 9 L20 12 L13.5 15 L12 21 L10.5 15 L4 12 L10.5 9 Z" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t("emptyAction")}
      </button>
    </div>
  );
}
