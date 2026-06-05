"use client";

import { Link } from "@/i18n/navigation";
import type { RateLimitInfo, Tier } from "./types";

function formatCountdown(sec: number, locale: string) {
  const h = Math.floor(sec / 3600);
  const m = Math.ceil((sec % 3600) / 60);
  if (locale === "th") return h > 0 ? `${h} ชม. ${m} นาที` : `${m} นาที`;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Smart Log — Free daily-quota reached. No standard header (just a close
 *  button), an hourglass, a usage card, and upgrade / save-anyway actions. */
export function SLRateLimit({
  locale,
  tier,
  rateLimitInfo,
  countdown,
  busy,
  onSaveWithoutAI,
  onClose,
}: {
  locale: string;
  tier: Tier;
  rateLimitInfo: RateLimitInfo;
  countdown: number;
  busy: boolean;
  onSaveWithoutAI: () => void;
  onClose: () => void;
}) {
  const pct = rateLimitInfo.limit > 0 ? Math.min(100, (rateLimitInfo.used / rateLimitInfo.limit) * 100) : 100;
  return (
    <>
      <button
        onClick={onClose}
        aria-label={locale === "th" ? "ปิด" : "Close"}
        style={{ position: "absolute", top: 18, right: 18, width: 36, height: 36, borderRadius: "50%", background: "var(--w-tint)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M6 6l12 12M18 6L6 18" stroke="var(--w-ink-2)" strokeWidth="1.8" strokeLinecap="round" /></svg>
      </button>

      <div className="fade-in" style={{ padding: "40px 38px 36px", textAlign: "center" }}>
        <div style={{ width: 76, height: 76, borderRadius: "50%", background: "#FEF0F0", margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, boxShadow: "0 10px 22px -10px rgba(200,90,90,.5)" }} aria-hidden>⏳</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.02em", color: "var(--w-ink)" }}>
          {locale === "th" ? "ขอเบรกแป๊บนะ" : "Take a short break"}
        </h2>
        <p style={{ fontSize: 14.5, color: "var(--w-ink-2)", margin: "0 auto 22px", lineHeight: 1.6, maxWidth: 400 }}>
          {tier === "premium" ? (
            locale === "th"
              ? <>คุณใช้ Smart Log AI ครบ <b>3 ครั้ง / 5 นาที</b> แล้ว — รอสักครู่แล้วลองใหม่</>
              : <>You&apos;ve used Smart Log AI <b>3 times / 5 min</b> — wait a moment and try again</>
          ) : (
            locale === "th"
              ? <>คุณใช้ Smart Log AI ครบ <b>{rateLimitInfo.limit} ครั้ง / วัน</b> (Free) แล้ว — รีเซ็ตเที่ยงคืน หรืออัปเกรดเป็น Premium ใช้ไม่จำกัด</>
              : <>You&apos;ve used all <b>{rateLimitInfo.limit} daily</b> Smart Log AI (Free) — resets at midnight, or upgrade to Premium for unlimited</>
          )}
        </p>

        <div className="pa-sheet" style={{ borderRadius: 16, padding: "16px 18px", background: "#FBF7F0", textAlign: "left", marginBottom: 22, position: "relative" }}>
          <span className="pa-washi yellow" aria-hidden style={{ width: 88 }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 700, marginTop: 4, color: "var(--w-ink-2)" }}>
            <span>{locale === "th" ? "วันนี้ใช้ไปแล้ว" : "Used today"}</span>
            <b style={{ color: "var(--w-ink)" }}>{rateLimitInfo.used} / {rateLimitInfo.limit}</b>
          </div>
          <div style={{ height: 7, borderRadius: 100, background: "var(--w-rule)", marginTop: 9, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, var(--peach), var(--purple))", transition: "width .4s ease" }} />
          </div>
          {countdown > 0 && (
            <div style={{ fontSize: 12, color: "var(--w-ink-3)", marginTop: 9, fontWeight: 600 }}>
              {locale === "th" ? `รีเซ็ตในอีก ${formatCountdown(countdown, locale)}` : `Resets in ${formatCountdown(countdown, locale)}`}
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {tier !== "premium" && (
            <Link href={"/pricing" as "/"} className="pa-btn purple" style={{ textDecoration: "none" }}>
              ✨ {locale === "th" ? "อัพเป็น Premium" : "Upgrade to Premium"}
            </Link>
          )}
          <button
            onClick={onSaveWithoutAI}
            disabled={busy}
            style={{ height: 42, padding: "0 18px", borderRadius: 12, border: "1.5px solid var(--w-rule)", background: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 800, fontSize: 14, color: "var(--w-ink-2)", opacity: busy ? 0.5 : 1 }}
          >
            {busy ? (locale === "th" ? "กำลังบันทึก..." : "Saving...") : (locale === "th" ? "บันทึกแบบปกติ" : "Save without AI")}
          </button>
        </div>
      </div>
    </>
  );
}
