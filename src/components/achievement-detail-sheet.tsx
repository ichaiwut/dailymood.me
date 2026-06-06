"use client";

import { BottomSheet } from "./bottom-sheet";
import { formatBadgeDate } from "@/lib/format-badge-date";

type BadgeStatus = "earned" | "in_progress" | "locked";

export interface DetailBadge {
  id: string;
  icon: string;
  color: string;
  target: number;
  current: number;
  progress: number;
  status: BadgeStatus;
  earnedAt: string | null;
}

/** Paper Desk styled achievement detail, rendered inside the generic BottomSheet
 *  (which provides the portal, scrim, Esc handling, a11y, and close button). */
export function AchievementDetailSheet({
  open,
  onClose,
  badge,
  title,
  desc,
  locale,
  onShare,
}: {
  open: boolean;
  onClose: () => void;
  badge: DetailBadge | null;
  title: string;
  desc: string;
  locale: string;
  onShare: () => void;
}) {
  const th = locale === "th";

  return (
    <BottomSheet open={open} onClose={onClose} aria-label={title}>
      {badge && (
        <div style={{ padding: "16px 26px 30px", textAlign: "center" }}>
          {/* Sticker hero + halo */}
          <div style={{ position: "relative", width: 132, height: 132, margin: "0 auto 18px", display: "grid", placeItems: "center" }}>
            <div
              aria-hidden
              style={{
                position: "absolute", width: 132, height: 132, borderRadius: "50%",
                background: `radial-gradient(circle, ${badge.color}55 0%, transparent 70%)`,
                opacity: badge.status === "locked" ? 0.4 : 1,
              }}
            />
            <div
              aria-hidden
              style={{
                position: "relative", width: 96, height: 96, borderRadius: "50%",
                display: "grid", placeItems: "center",
                background: badge.status === "earned" ? badge.color : badge.status === "locked" ? "var(--w-tint)" : `${badge.color}26`,
                border: "5px solid #fff",
                boxShadow: "0 14px 30px -10px rgba(0,0,0,.32)",
                filter: badge.status === "locked" ? "grayscale(1)" : "none",
                opacity: badge.status === "locked" ? 0.85 : 1,
              }}
            >
              <span style={{ fontSize: 46, lineHeight: 1 }}>{badge.icon}</span>
            </div>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--w-ink)", margin: "0 0 8px", lineHeight: 1.25 }}>
            {title}
          </h2>
          <p style={{ fontSize: 15, color: "var(--w-ink-2)", lineHeight: 1.55, margin: "0 auto", maxWidth: 340 }}>
            {desc}
          </p>

          {/* Earned */}
          {badge.status === "earned" && (
            <div style={{ marginTop: 22, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <span
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 14, fontWeight: 800, letterSpacing: "0.03em", textTransform: "uppercase",
                  color: badge.color, background: `${badge.color}1f`, border: `1.5px solid ${badge.color}`,
                  borderRadius: 10, padding: "7px 14px", transform: "rotate(-3deg)",
                }}
              >
                ✓ {badge.earnedAt
                  ? `${th ? "ปลดล็อก" : "Unlocked"} · ${formatBadgeDate(badge.earnedAt, locale, { year: true })}`
                  : th ? "ปลดล็อกแล้ว" : "Unlocked"}
              </span>
              <div style={{ fontSize: 14, color: "var(--w-ink-3)", lineHeight: 1.5 }}>
                {th ? "อีกหนึ่งก้าวของการดูแลใจตัวเอง" : "Another step in looking after yourself."}
              </div>
              <button onClick={onShare} className="pa-btn purple" style={{ width: "100%", maxWidth: 320, height: 48 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M18 8a3 3 0 1 0-2.83-4M18 8a3 3 0 0 1-2.83-2M18 8l-9 5m0 0a3 3 0 1 0 0 .01M9 13l9 5m0 0a3 3 0 1 0 0 .01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {th ? "แชร์ความสำเร็จ" : "Share achievement"}
              </button>
            </div>
          )}

          {/* In progress */}
          {badge.status === "in_progress" && (
            <div style={{ marginTop: 22, maxWidth: 340, margin: "22px auto 0" }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--w-ink-2)", marginBottom: 8 }}>
                {badge.current} / {badge.target}
              </div>
              <div style={{ height: 10, borderRadius: 6, background: "var(--w-tint)", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 6, width: `${badge.progress}%`, background: badge.color, transition: "width .6s cubic-bezier(.2,.8,.2,1)" }} />
              </div>
              <div style={{ fontSize: 14, color: "var(--w-ink-3)", marginTop: 12, lineHeight: 1.5 }}>
                {th
                  ? `อีก ${badge.target - badge.current} ก็ปลดล็อกแล้ว`
                  : `Just ${badge.target - badge.current} more to go`}
              </div>
            </div>
          )}

          {/* Locked */}
          {badge.status === "locked" && (
            <div style={{ marginTop: 22, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 14, fontWeight: 800, color: "var(--w-ink-3)",
                  background: "var(--w-tint)", borderRadius: 100, padding: "7px 14px",
                }}
              >
                🔒 {th ? "ยังไม่ปลดล็อก" : "Locked"}
              </span>
              <div style={{ fontSize: 14, color: "var(--w-ink-3)", lineHeight: 1.5, maxWidth: 320 }}>
                {th ? "เริ่มบันทึกอารมณ์ไปเรื่อยๆ แล้วความสำเร็จนี้จะปลดล็อกเอง" : "Keep checking in and this one will unlock on its own."}
              </div>
            </div>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
