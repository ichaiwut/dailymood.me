"use client";

import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";

const FEATURES_TH = [
  { emoji: "✨", label: "Smart Log AI ไม่จำกัด" },
  { emoji: "🎨", label: "Year-in-Pixels" },
  { emoji: "🧠", label: "AI Insights" },
  { emoji: "💬", label: "Ask AI 100/เดือน" },
  { emoji: "📤", label: "Export ข้อมูลครบ" },
];

const FEATURES_EN = [
  { emoji: "✨", label: "Unlimited Smart Log AI" },
  { emoji: "🎨", label: "Year-in-Pixels" },
  { emoji: "🧠", label: "AI Insights" },
  { emoji: "💬", label: "Ask AI 100/month" },
  { emoji: "📤", label: "Full data export" },
];

export function WelcomeProShell({ source }: { source: "trial" | "stripe" }) {
  const locale = useLocale();
  const isTh = locale === "th";
  const router = useRouter();
  const features = isTh ? FEATURES_TH : FEATURES_EN;

  const title = isTh ? "ยินดีต้อนรับสู่ Pro!" : "Welcome to Pro!";
  const subtitle = source === "trial"
    ? (isTh
        ? "ทดลองใช้ฟรี 14 วันเริ่มแล้ว ฟีเจอร์ทั้งหมดปลดล็อกทันที"
        : "Your 14-day free trial has started. All features unlocked.")
    : (isTh
        ? "ปลดล็อกทุกฟีเจอร์เรียบร้อย เริ่มใช้งานได้เลย"
        : "All features unlocked. Enjoy the full experience.");

  return (
    <div className="fade-in" style={{ textAlign: "center", padding: "60px 20px 80px", maxWidth: 480, margin: "0 auto" }}>
      {/* Icon */}
      <div style={{
        width: 80, height: 80, borderRadius: 24, margin: "0 auto 24px",
        background: "linear-gradient(135deg, #FCA45B 0%, #FBA0A0 50%, #A673F1 100%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 36,
      }}>
        ✨
      </div>

      {/* Title */}
      <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", margin: "0 0 10px" }}>
        {title}
      </h1>
      <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.5, margin: "0 0 32px" }}>
        {subtitle}
      </p>

      {/* Feature checklist */}
      <div style={{
        background: "#fff", border: "1.5px solid #F2F0F5", borderRadius: 20,
        padding: "20px 24px", textAlign: "left", marginBottom: 32,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-3)", marginBottom: 14 }}>
          {isTh ? "ปลดล็อกแล้ว" : "Unlocked"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {features.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                background: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
                {f.emoji} {f.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={() => router.push("/" as "/")}
        style={{
          padding: "16px 36px", borderRadius: 20,
          border: "none",
          background: "#FCA45B",
          color: "#fff", fontSize: 16, fontWeight: 800,
          cursor: "pointer",
        }}
      >
        {isTh ? "เริ่มสำรวจฟีเจอร์ →" : "Explore features →"}
      </button>
    </div>
  );
}
