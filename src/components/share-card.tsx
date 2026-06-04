"use client";

/**
 * Social share card — rendered as a real DOM node (1200×630) and captured to PNG
 * client-side via html-to-image. We render in the browser (not next/og/Satori) so
 * Thai shaping + emoji come out correct. Colors are hardcoded HEX (from DEFAULT_MOODS)
 * so the card looks identical regardless of the app's active theme.
 */

import React from "react";
import { DEFAULT_MOODS } from "@/lib/default-moods";

export type ShareTemplate = "streak" | "signature";
export type ShareTheme = "light" | "dark";

export interface ShareCardData {
  streak: number;
  total: number;
  distribution: Record<string, number>;
  topMoodId: string | null;
  avgScore: number | null;
}

export const CARD_W = 1200;
export const CARD_H = 630;

const FIRE = "#FB923C";
const BRAND = "#A673F1";
const THAI_FONT = 'var(--font-thai), "Noto Sans Thai", system-ui, sans-serif';

function moodById(id: string | null | undefined) {
  return id ? DEFAULT_MOODS.find((m) => m.id === id) : undefined;
}

function hexToRgba(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

// Blend a hex color toward a target hex by t (0..1). Used to push pastel mood
// colors to a readable shade for text (darker on light theme, brighter on dark).
function mix(hex: string, target: string, t: number): string {
  const a = hex.replace("#", "");
  const b = target.replace("#", "");
  const ar = parseInt(a.slice(0, 2), 16), ag = parseInt(a.slice(2, 4), 16), ab = parseInt(a.slice(4, 6), 16);
  const br = parseInt(b.slice(0, 2), 16), bg = parseInt(b.slice(2, 4), 16), bb = parseInt(b.slice(4, 6), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

interface Palette {
  ink: string;
  sub: string;
  surface: string;
  base: string;
  grad: string;
}

const DARK_BASE = "#15101D";
const LIGHT_BASE = "#FFFFFF";

function palette(theme: ShareTheme, accent: string): Palette {
  if (theme === "dark") {
    return {
      ink: "#FFFFFF",
      sub: "rgba(255,255,255,0.82)",
      surface: "rgba(255,255,255,0.10)",
      base: DARK_BASE,
      // Solid (no alpha) so the PNG has no transparency to bleed through; base stays dark so white text pops.
      grad: `linear-gradient(140deg, ${mix(accent, DARK_BASE, 0.72)} 0%, ${DARK_BASE} 62%)`,
    };
  }
  return {
    ink: "#1A1320",
    sub: "#6B6275",
    surface: "rgba(255,255,255,0.66)",
    base: LIGHT_BASE,
    grad: `linear-gradient(140deg, ${mix(accent, LIGHT_BASE, 0.55)} 0%, ${LIGHT_BASE} 66%)`,
  };
}

function Watermark({ pal }: { pal: Palette }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 72,
        bottom: 56,
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 13,
          background: BRAND,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {/* sparkle mark */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#fff" />
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
        <div style={{ fontSize: 30, fontWeight: 800, color: pal.ink, letterSpacing: "-0.01em" }}>
          DailyMood
        </div>
        <div style={{ fontSize: 19, fontWeight: 600, color: pal.sub }}>dailymood.me</div>
      </div>
    </div>
  );
}

function Eyebrow({ text, color }: { text: string; color: string }) {
  return (
    <div
      style={{
        fontSize: 26,
        fontWeight: 800,
        color,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
}

function StreakCard({ data, theme, isTh, pal }: { data: ShareCardData; theme: ShareTheme; isTh: boolean; pal: Palette }) {
  const n = data.streak;
  const line = isTh
    ? n >= 30
      ? "ดูแลใจตัวเองได้ดีมากเลย"
      : n >= 7
        ? "ทำต่อไปนะ กำลังไปได้สวย"
        : "ค่อยๆ ไปทีละวัน"
    : n >= 30
      ? "Showing up for yourself, every day"
      : n >= 7
        ? "Keep it going — you're on a roll"
        : "One day at a time";

  return (
    <>
      <Eyebrow text={isTh ? "บันทึกต่อเนื่อง" : "Check-in streak"} color={theme === "dark" ? "#FFD7B0" : "#C2410C"} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
        <div style={{ fontSize: 130, lineHeight: 1 }}>🔥</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
          <span style={{ fontSize: 220, fontWeight: 800, color: pal.ink, lineHeight: 0.9, letterSpacing: "-0.03em" }}>
            {n}
          </span>
          <span style={{ fontSize: 64, fontWeight: 800, color: pal.sub, paddingBottom: 28 }}>
            {isTh ? "วัน" : n === 1 ? "day" : "days"}
          </span>
        </div>
        <div style={{ fontSize: 38, fontWeight: 600, color: pal.sub, marginTop: 8 }}>{line}</div>
      </div>
      <Watermark pal={pal} />
    </>
  );
}

function SignatureCard({ data, isTh, pal, accentText }: { data: ShareCardData; isTh: boolean; pal: Palette; accentText: string }) {
  const entries = Object.entries(data.distribution)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const top = entries[0];
  const topMood = moodById(top?.[0] ?? data.topMoodId);
  const topPct = total > 0 && top ? Math.round((top[1] / total) * 100) : 0;

  return (
    <>
      <Eyebrow text={isTh ? "ภาพรวมอารมณ์ของฉัน" : "My mood mix"} color={accentText} />

      {/* Featured top mood */}
      <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 36 }}>
        <div style={{ fontSize: 128, lineHeight: 1 }}>{topMood?.emoji ?? "🙂"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: pal.sub }}>
            {isTh ? "อารมณ์หลัก" : "Top mood"}
          </div>
          <div style={{ fontSize: 76, fontWeight: 800, color: pal.ink, lineHeight: 1 }}>
            {topMood ? (isTh ? topMood.labelTh : topMood.label) : "—"}{" "}
            <span style={{ color: accentText }}>{topPct}%</span>
          </div>
        </div>
      </div>

      {/* Proportion bar */}
      <div
        style={{
          display: "flex",
          height: 34,
          borderRadius: 17,
          overflow: "hidden",
          marginTop: 48,
        }}
      >
        {entries.map(([id, count]) => {
          const m = moodById(id);
          return (
            <div
              key={id}
              style={{ width: `${(count / total) * 100}%`, background: m?.color ?? "#ccc", minWidth: 6 }}
            />
          );
        })}
      </div>

      {/* Legend (top 4) */}
      <div style={{ display: "flex", gap: 36, marginTop: 28, flexWrap: "wrap" }}>
        {entries.slice(0, 4).map(([id, count]) => {
          const m = moodById(id);
          if (!m) return null;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 34 }}>{m.emoji}</span>
              <span style={{ fontSize: 28, fontWeight: 700, color: pal.ink }}>
                {isTh ? m.labelTh : m.label}
              </span>
              <span style={{ fontSize: 28, fontWeight: 700, color: pal.sub }}>{pct}%</span>
            </div>
          );
        })}
      </div>

      <Watermark pal={pal} />
    </>
  );
}

export const ShareCard = React.forwardRef<HTMLDivElement, {
  template: ShareTemplate;
  theme: ShareTheme;
  data: ShareCardData;
  locale: string;
}>(function ShareCard({ template, theme, data, locale }, ref) {
  const isTh = locale === "th";
  const accent = template === "streak" ? FIRE : moodById(data.topMoodId)?.color ?? BRAND;
  const pal = palette(theme, accent);
  // Pastel mood colors are too low-contrast as text — darken on light, brighten on dark.
  const accentText = theme === "dark" ? mix(accent, "#FFFFFF", 0.34) : mix(accent, "#1A1320", 0.45);

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
      {template === "streak" ? (
        <StreakCard data={data} theme={theme} isTh={isTh} pal={pal} />
      ) : (
        <SignatureCard data={data} isTh={isTh} pal={pal} accentText={accentText} />
      )}
    </div>
  );
});
