"use client";

/**
 * Achievement share card — a real DOM node (1200×630, OG ratio) captured to PNG
 * via html-to-image. Same constraints as the mood ShareCard: hardcoded HEX,
 * no remote images (the badge "icon" is an emoji glyph), correct Thai shaping
 * in-browser, identical regardless of the app's active theme.
 */

import React from "react";
import {
  CARD_W,
  CARD_H,
  THAI_FONT,
  Watermark,
  palette,
  mix,
  type ShareTheme,
} from "./share-card";
import { formatBadgeDate } from "@/lib/format-badge-date";

export interface AchievementCardBadge {
  id: string;
  icon: string;
  color: string;
  earnedAt: string | null;
}

export const AchievementShareCard = React.forwardRef<HTMLDivElement, {
  badge: AchievementCardBadge;
  title: string;
  desc: string;
  theme: ShareTheme;
  locale: string;
}>(function AchievementShareCard({ badge, title, desc, theme, locale }, ref) {
  const isTh = locale === "th";
  const accent = badge.color;
  const pal = palette(theme, accent);
  // Pastel badge colours are too low-contrast as text — darken on light, brighten on dark.
  const accentText = theme === "dark" ? mix(accent, "#FFFFFF", 0.4) : mix(accent, "#1A1320", 0.42);

  return (
    <div
      ref={ref}
      style={{
        width: CARD_W,
        height: CARD_H,
        boxSizing: "border-box",
        padding: 72,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        backgroundColor: pal.base,
        backgroundImage: pal.grad,
        fontFamily: THAI_FONT,
        color: pal.ink,
      }}
    >
      <div style={{ fontSize: 26, fontWeight: 800, color: accentText, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        {isTh ? "ปลดล็อกความสำเร็จ" : "Achievement unlocked"}
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 64 }}>
        {/* Sticker disc + halo */}
        <div style={{ position: "relative", flexShrink: 0, width: 300, height: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              position: "absolute",
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${mix(accent, pal.base, 0.25)} 0%, ${pal.base} 70%)`,
              opacity: theme === "dark" ? 0.7 : 0.9,
            }}
          />
          <div
            style={{
              position: "relative",
              width: 232,
              height: 232,
              borderRadius: "50%",
              background: accent,
              border: "12px solid #fff",
              boxShadow: "0 24px 60px -18px rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 128, lineHeight: 1 }}>{badge.icon}</span>
          </div>
        </div>

        {/* Title + date + line */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <div style={{ fontSize: 80, fontWeight: 800, color: pal.ink, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            {title}
          </div>
          {badge.earnedAt && (
            <div style={{ fontSize: 34, fontWeight: 700, color: accentText }}>
              {isTh ? "ปลดล็อก" : "Unlocked"} · {formatBadgeDate(badge.earnedAt, locale, { year: true })}
            </div>
          )}
          <div style={{ fontSize: 36, fontWeight: 600, color: pal.sub, marginTop: 6 }}>{desc}</div>
        </div>
      </div>

      <Watermark pal={pal} />
    </div>
  );
});
