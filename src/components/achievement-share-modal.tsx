"use client";

import React, { useEffect, useRef, useState } from "react";
import { trackShareAchievement } from "@/lib/analytics";
import { CARD_W, CARD_H, type ShareTheme } from "./share-card";
import { AchievementShareCard, type AchievementCardBadge } from "./achievement-share-card";
import { useCardShare } from "./use-card-share";

const SHARE_URL = "https://dailymood.me";

const ACTION_BTN: React.CSSProperties = {
  flex: 1,
  padding: "13px 16px",
  fontSize: 15,
  fontWeight: 700,
  borderRadius: 14,
  border: "none",
  cursor: "pointer",
};

function ThemeToggle({ value, onChange, isTh }: { value: ShareTheme; onChange: (v: ShareTheme) => void; isTh: boolean }) {
  const options: { value: ShareTheme; label: string }[] = [
    { value: "light", label: isTh ? "สว่าง" : "Light" },
    { value: "dark", label: isTh ? "มืด" : "Dark" },
  ];
  return (
    <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: 12, padding: 3, gap: 2 }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            flex: 1, padding: "9px 14px", fontSize: 14, fontWeight: 700, borderRadius: 10,
            border: "none", cursor: "pointer", transition: "all 0.15s",
            background: value === o.value ? "var(--surface)" : "transparent",
            color: value === o.value ? "var(--ink)" : "var(--ink-3, #999)",
            boxShadow: value === o.value ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function AchievementShareModal({
  open,
  onClose,
  badge,
  title,
  desc,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  badge: AchievementCardBadge | null;
  title: string;
  desc: string;
  locale: string;
}) {
  const isTh = locale === "th";
  const cardRef = useRef<HTMLDivElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<ShareTheme>("light");
  const [scale, setScale] = useState(0.4);

  const shareText = isTh
    ? `ปลดล็อกความสำเร็จ "${title}" ใน DailyMood 🏆 #DailyMood`
    : `Unlocked "${title}" on DailyMood 🏆 #DailyMood`;

  const { busy, toast, handleShare, handleDownload, handleCopy } = useCardShare({
    cardRef,
    width: CARD_W,
    height: CARD_H,
    fileName: `dailymood-achievement-${badge?.id ?? "badge"}.png`,
    shareText,
    shareUrl: SHARE_URL,
    isTh,
    onShared: () => badge && trackShareAchievement(badge.id),
  });

  // Scale the full-res card down to fit the preview box width.
  useEffect(() => {
    if (!open) return;
    const el = previewBoxRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / CARD_W);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Lock body scroll while open. The detail sheet (BottomSheet) restores scroll
  // when it unmounts on the detail→share transition, so the share modal must
  // re-lock it itself or the page scrolls behind the overlay.
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !badge) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(20,14,26,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-in"
        style={{
          background: "var(--surface)", width: "100%", maxWidth: 460, maxHeight: "90vh",
          overflowY: "auto", borderRadius: 24, padding: "20px 20px 24px",
          boxShadow: "0 24px 60px rgba(20,14,26,0.35)",
          display: "flex", flexDirection: "column", gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            {isTh ? "แชร์ความสำเร็จ" : "Share this achievement"}
          </h2>
          <button
            onClick={onClose}
            aria-label={isTh ? "ปิด" : "Close"}
            style={{
              width: 36, height: 36, borderRadius: 12, border: "none",
              background: "var(--surface-2)", color: "var(--ink-2)", fontSize: 18, cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Preview */}
        <div
          ref={previewBoxRef}
          style={{
            width: "100%", aspectRatio: `${CARD_W} / ${CARD_H}`, borderRadius: 16,
            overflow: "hidden", background: "var(--surface-2)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.12)", position: "relative",
          }}
        >
          <div style={{ position: "absolute", top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <AchievementShareCard ref={cardRef} badge={badge} title={title} desc={desc} theme={theme} locale={locale} />
          </div>
        </div>

        {/* Theme toggle */}
        <ThemeToggle value={theme} onChange={setTheme} isTh={isTh} />

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
          <button onClick={handleShare} disabled={busy} style={{ ...ACTION_BTN, background: "#A673F1", color: "#fff", opacity: busy ? 0.6 : 1 }}>
            {isTh ? "แชร์" : "Share"}
          </button>
          <button onClick={handleDownload} disabled={busy} style={{ ...ACTION_BTN, background: "var(--surface-2)", color: "var(--ink)", opacity: busy ? 0.6 : 1 }}>
            {busy ? (isTh ? "กำลังสร้างรูป…" : "Rendering…") : isTh ? "บันทึกรูป" : "Save image"}
          </button>
          <button onClick={handleCopy} disabled={busy} style={{ ...ACTION_BTN, flex: 0, padding: "13px 16px", background: "var(--surface-2)", color: "var(--ink)", opacity: busy ? 0.6 : 1 }}>
            {isTh ? "คัดลอก" : "Copy"}
          </button>
        </div>

        <p style={{ fontSize: 14, color: "var(--ink-3)", textAlign: "center", margin: 0, lineHeight: 1.5 }}>
          {isTh
            ? "การ์ดนี้แสดงแค่ความสำเร็จ ไม่มีบันทึกหรือข้อมูลส่วนตัวของคุณ"
            : "This card shows only the achievement — no notes or personal details."}
        </p>

        {toast && (
          <div
            style={{
              position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)",
              background: "#1A1320", color: "#fff", fontSize: 14, fontWeight: 600,
              padding: "10px 18px", borderRadius: 12, zIndex: 10001,
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
