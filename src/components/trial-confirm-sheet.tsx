"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { BottomSheet } from "./bottom-sheet";

interface TrialConfirmSheetProps {
  open: boolean;
  onClose: () => void;
}

export function TrialConfirmSheet({ open, onClose }: TrialConfirmSheetProps) {
  const locale = useLocale();
  const isTh = locale === "th";
  const [activating, setActivating] = useState(false);

  const handleActivate = async () => {
    if (activating) return;
    setActivating(true);
    try {
      const res = await fetch("/api/trial/activate", { method: "POST" });
      if (res.ok) {
        globalThis.location.assign("/welcome-pro");
      } else {
        onClose();
      }
    } catch {
      onClose();
    } finally {
      setActivating(false);
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} aria-label={isTh ? "ยืนยันทดลองใช้ Pro" : "Confirm Pro trial"}>
      <div style={{ padding: "8px 24px 36px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>✨</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
          {isTh ? "ทดลองใช้ Pro ฟรี 14 วัน" : "Try Pro free for 14 days"}
        </div>
        <div style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.6, marginBottom: 8 }}>
          {isTh
            ? "ปลดล็อกทุกฟีเจอร์ให้คุณลองใช้เต็มที่"
            : "Unlock all features for you to explore"}
        </div>

        <div style={{
          background: "#F0FFF4", border: "1.5px solid #C6F6D5", borderRadius: 14,
          padding: "14px 18px", marginBottom: 24, textAlign: "left",
        }}>
          <div style={{ display: "flex", alignItems: "start", gap: 10 }}>
            <span style={{ fontSize: 20, lineHeight: 1 }}>🛡️</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#276749", marginBottom: 4 }}>
                {isTh ? "ไม่มีค่าใช้จ่ายใดๆ ทั้งสิ้น" : "Completely free, no charges"}
              </div>
              <div style={{ fontSize: 14, color: "#2F855A", lineHeight: 1.5 }}>
                {isTh
                  ? "ไม่ต้องใส่บัตรเครดิต · หมด 14 วันกลับเป็น Free อัตโนมัติ · ไม่มีการเรียกเก็บเงิน แม้ลืมยกเลิก"
                  : "No credit card needed · Auto-reverts to Free after 14 days · No charges even if you forget"}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: "14px 0", borderRadius: 16,
              border: "1.5px solid #F2F0F5", background: "transparent",
              fontSize: 15, fontWeight: 600, color: "var(--ink-3)", cursor: "pointer",
            }}
          >
            {isTh ? "ยังไม่ตอนนี้" : "Not now"}
          </button>
          <button
            type="button"
            onClick={handleActivate}
            disabled={activating}
            style={{
              flex: 2, padding: "14px 0", borderRadius: 16,
              border: "none",
              background: "linear-gradient(135deg, #FCA45B 0%, #A673F1 100%)",
              fontSize: 15, fontWeight: 800, color: "#fff",
              cursor: activating ? "wait" : "pointer",
              opacity: activating ? 0.7 : 1,
            }}
          >
            {activating
              ? (isTh ? "กำลังเปิด..." : "Activating...")
              : (isTh ? "เริ่มเลย →" : "Start now →")}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
