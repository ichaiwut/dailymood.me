"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { TrialConfirmSheet } from "./trial-confirm-sheet";

type TrialBannerMode =
  | { mode: "activate" }
  | { mode: "countdown"; daysLeft: number; isWarning: boolean };

export function TrialBanner(props: TrialBannerMode) {
  const locale = useLocale();
  const isTh = locale === "th";
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);

  if (props.mode === "activate") {
    return (
      <>
        <div
          style={{
            background: "linear-gradient(90deg, #FCA45B 0%, #A673F1 100%)",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            fontSize: 14,
            fontWeight: 700,
            color: "#fff",
            lineHeight: 1,
            flexWrap: "wrap",
          }}
        >
          <span>✨ {isTh ? "ลองใช้ Pro ฟรี 14 วัน — ไม่ต้องใส่บัตร" : "Try Pro free for 14 days — no card needed"}</span>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            style={{
              background: "rgba(255,255,255,0.25)",
              border: "1.5px solid rgba(255,255,255,0.4)",
              borderRadius: 10,
              padding: "5px 14px",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {isTh ? "เริ่มเลย →" : "Start now →"}
          </button>
        </div>
        <TrialConfirmSheet open={showConfirm} onClose={() => setShowConfirm(false)} />
      </>
    );
  }

  const { daysLeft, isWarning } = props;
  const message = isWarning
    ? (isTh ? `Pro หมดอายุใน ${daysLeft} วัน` : `Pro ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`)
    : (isTh ? `ทดลองใช้ Pro ฟรี · เหลืออีก ${daysLeft} วัน` : `Free Pro trial · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`);

  return (
    <div
      style={{
        background: isWarning
          ? "linear-gradient(90deg, #FF6B6B 0%, #FCA45B 100%)"
          : "linear-gradient(90deg, #FCA45B 0%, #A673F1 100%)",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        fontSize: 14,
        fontWeight: 700,
        color: "#fff",
        lineHeight: 1,
        flexWrap: "wrap",
      }}
    >
      <span>{isWarning ? "⏰" : "✨"} {message}</span>
      <button
        type="button"
        onClick={() => router.push("/pricing" as "/")}
        style={{
          background: "rgba(255,255,255,0.2)",
          border: "1.5px solid rgba(255,255,255,0.4)",
          borderRadius: 10,
          padding: "5px 14px",
          fontSize: 14,
          fontWeight: 700,
          color: "#fff",
          cursor: "pointer",
        }}
      >
        {isTh ? "อัปเกรด →" : "Upgrade →"}
      </button>
    </div>
  );
}
