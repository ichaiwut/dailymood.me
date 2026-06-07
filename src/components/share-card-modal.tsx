"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { toBlob } from "html-to-image";
import { trackShareInsight } from "@/lib/analytics";
import {
  ShareCard,
  CARD_W,
  CARD_H,
  type ShareCardData,
  type ShareTemplate,
  type ShareTheme,
} from "./share-card";

const SHARE_URL = "https://dailymood.me";

function shareText(template: ShareTemplate, data: ShareCardData, isTh: boolean): string {
  if (template === "streak") {
    return isTh
      ? `บันทึกอารมณ์ต่อเนื่อง ${data.streak} วันแล้ว 🔥 #DailyMood`
      : `${data.streak}-day mood check-in streak 🔥 #DailyMood`;
  }
  return isTh
    ? `อารมณ์ 30 วันของฉันเป็นแบบนี้ 🌈 #DailyMood`
    : `My mood over the last 30 days 🌈 #DailyMood`;
}

/* ── Segmented control ─────────────────────────────────── */

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: 12, padding: 3, gap: 2 }}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            flex: 1,
            padding: "9px 14px",
            fontSize: 14,
            fontWeight: 700,
            borderRadius: 10,
            border: "none",
            cursor: "pointer",
            transition: "all 0.15s",
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

const ACTION_BTN: React.CSSProperties = {
  flex: 1,
  padding: "13px 16px",
  fontSize: 15,
  fontWeight: 700,
  borderRadius: 14,
  border: "none",
  cursor: "pointer",
};

export function ShareCardModal({
  open,
  onClose,
  data,
  locale,
}: {
  open: boolean;
  onClose: () => void;
  data: ShareCardData;
  locale: string;
}) {
  const isTh = locale === "th";
  const cardRef = useRef<HTMLDivElement>(null);
  const previewBoxRef = useRef<HTMLDivElement>(null);

  const [template, setTemplate] = useState<ShareTemplate>("streak");
  const [theme, setTheme] = useState<ShareTheme>("light");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [scale, setScale] = useState(0.4);

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

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const capture = useCallback(async (): Promise<Blob | null> => {
    const node = cardRef.current;
    if (!node) return null;
    const opts = { width: CARD_W, height: CARD_H, pixelRatio: 1, cacheBust: true } as const;
    // First pass can render before the Thai web font is ready (esp. Safari); render twice.
    await toBlob(node, opts);
    return toBlob(node, opts);
  }, []);

  const handleDownload = useCallback(async () => {
    setBusy(true);
    try {
      const blob = await capture();
      if (!blob) throw new Error("no blob");
      trackShareInsight();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dailymood-${template}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      flash(isTh ? "บันทึกรูปไม่สำเร็จ ลองอีกครั้ง" : "Couldn't save the image — try again");
    } finally {
      setBusy(false);
    }
  }, [capture, template, isTh, flash]);

  const handleShare = useCallback(async () => {
    // No native share sheet (e.g. desktop Firefox) — fall back to saving the image.
    if (typeof navigator === "undefined" || !navigator.share) {
      return handleDownload();
    }
    setBusy(true);
    try {
      const blob = await capture();
      if (!blob) throw new Error("no blob");
      const file = new File([blob], `dailymood-${template}.png`, { type: "image/png" });
      const text = shareText(template, data, isTh);
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, url: SHARE_URL });
      } else {
        await navigator.share({ text: `${text} ${SHARE_URL}`, url: SHARE_URL });
      }
      trackShareInsight();
    } catch {
      /* user cancelled or unsupported — no toast needed */
    } finally {
      setBusy(false);
    }
  }, [capture, template, data, isTh, handleDownload]);

  const handleCopy = useCallback(async () => {
    setBusy(true);
    try {
      const blob = await capture();
      if (!blob) throw new Error("no blob");
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      trackShareInsight();
      flash(isTh ? "คัดลอกรูปแล้ว" : "Image copied");
    } catch {
      flash(isTh ? "เบราว์เซอร์นี้คัดลอกรูปไม่ได้ ใช้ปุ่มบันทึกแทน" : "Copy unsupported here — use Save instead");
    } finally {
      setBusy(false);
    }
  }, [capture, isTh, flash]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(20,14,26,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fade-in"
        style={{
          background: "var(--surface)",
          width: "100%",
          maxWidth: 460,
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: 24,
          padding: "20px 20px 24px",
          boxShadow: "0 24px 60px rgba(20,14,26,0.35)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", margin: 0 }}>
            {isTh ? "แชร์การ์ดอารมณ์" : "Share your mood card"}
          </h2>
          <button
            onClick={onClose}
            aria-label={isTh ? "ปิด" : "Close"}
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              border: "none",
              background: "var(--surface-2)",
              color: "var(--ink-2)",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Template tabs */}
        <Segmented
          value={template}
          onChange={setTemplate}
          options={[
            { value: "streak", label: isTh ? "🔥 ต่อเนื่อง" : "🔥 Streak" },
            { value: "signature", label: isTh ? "🌈 อารมณ์รวม" : "🌈 Mood mix" },
          ]}
        />

        {/* Preview */}
        <div
          ref={previewBoxRef}
          style={{
            width: "100%",
            aspectRatio: `${CARD_W} / ${CARD_H}`,
            borderRadius: 16,
            overflow: "hidden",
            background: "var(--surface-2)",
            boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <ShareCard ref={cardRef} template={template} theme={theme} data={data} locale={locale} />
          </div>
        </div>

        {/* Theme toggle */}
        <Segmented
          value={theme}
          onChange={setTheme}
          options={[
            { value: "light", label: isTh ? "สว่าง" : "Light" },
            { value: "dark", label: isTh ? "มืด" : "Dark" },
          ]}
        />

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
            ? "การ์ดนี้แสดงแค่ภาพรวมอารมณ์ ไม่มีบันทึกหรือข้อมูลส่วนตัวของคุณ"
            : "This card shows only your mood overview — no notes or personal details."}
        </p>

        {toast && (
          <div
            style={{
              position: "fixed",
              left: "50%",
              bottom: 24,
              transform: "translateX(-50%)",
              background: "#1A1320",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              padding: "10px 18px",
              borderRadius: 12,
              zIndex: 120,
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
