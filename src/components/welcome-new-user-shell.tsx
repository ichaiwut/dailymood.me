"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";

const FEATURES_TH = [
  { eyebrow: "Smart Log AI", title: "บันทึกอารมณ์ใน 10 วินาที", desc: "พิมพ์สั้นๆ หรือพูดเป็นเสียง — AI จะแยกอารมณ์ ใส่แท็ก สรุปให้", icon: "✨", hue: "#A673F1", bg: "linear-gradient(135deg, #F2E6FF 0%, #FFE3D2 100%)" },
  { eyebrow: "Year in Pixels", title: "มองเห็นทั้งปีในหน้าเดียว", desc: "ปฏิทินสีสันที่ทำให้รู้ว่าช่วงไหนคุณเป็นยังไง", icon: "📅", hue: "#C56A1F", bg: "linear-gradient(135deg, #FFE9D4 0%, #FFD9DD 100%)" },
  { eyebrow: "AI Insights", title: "รู้ว่าอะไรทำให้คุณรู้สึกดี", desc: "AI หา pattern จากบันทึก: คน · งาน · เวลา · สถานที่", icon: "🧠", hue: "#39B58A", bg: "linear-gradient(135deg, #E1F3EA 0%, #E9F4FF 100%)" },
  { eyebrow: "บทความสุขภาพจิต", title: "อ่านบทความจากผู้เชี่ยวชาญ", desc: "อัปเดตทุกสัปดาห์ — อ่านฟรีไม่จำกัด ทั้ง Free และ Pro", icon: "❤️", hue: "#D45B7A", bg: "linear-gradient(135deg, #FFE5EC 0%, #F2E6FF 100%)" },
];

const FEATURES_EN = [
  { eyebrow: "Smart Log AI", title: "Log your mood in 10 seconds", desc: "Type or speak — AI detects mood, adds tags, and summarizes", icon: "✨", hue: "#A673F1", bg: "linear-gradient(135deg, #F2E6FF 0%, #FFE3D2 100%)" },
  { eyebrow: "Year in Pixels", title: "See your whole year at a glance", desc: "A colorful calendar showing how you've been feeling", icon: "📅", hue: "#C56A1F", bg: "linear-gradient(135deg, #FFE9D4 0%, #FFD9DD 100%)" },
  { eyebrow: "AI Insights", title: "Know what makes you feel good", desc: "AI finds patterns from your logs: people, work, time, places", icon: "🧠", hue: "#39B58A", bg: "linear-gradient(135deg, #E1F3EA 0%, #E9F4FF 100%)" },
  { eyebrow: "Mental Health Library", title: "Read expert articles", desc: "Updated weekly — free for everyone, no limits", icon: "❤️", hue: "#D45B7A", bg: "linear-gradient(135deg, #FFE5EC 0%, #F2E6FF 100%)" },
];

const MOOD_FACES = ["😊", "😄", "😐", "😟", "😢"];
const MOOD_OFFSETS = [0, -8, -12, -8, 0];

export function WelcomeNewUserShell({ firstName, hasUsedTrial }: { firstName: string | null; hasUsedTrial: boolean }) {
  const locale = useLocale();
  const isTh = locale === "th";
  const router = useRouter();
  const features = isTh ? FEATURES_TH : FEATURES_EN;
  const displayName = firstName || (isTh ? "เพื่อนใหม่" : "friend");

  const [trialClaimed, setTrialClaimed] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState(false);

  useEffect(() => {
    fetch("/api/welcome", { method: "POST" }).catch(() => {});
  }, []);

  const handleExit = (route: string) => {
    router.push(route as "/");
  };

  const handleClaimTrial = async () => {
    if (trialLoading || trialClaimed) return;
    setTrialLoading(true);
    setTrialError(false);
    try {
      const res = await fetch("/api/trial/activate", { method: "POST" });
      if (res.ok) {
        globalThis.location.assign("/welcome-pro");
        return;
      } else {
        setTrialError(true);
      }
    } catch {
      setTrialError(true);
    } finally {
      setTrialLoading(false);
    }
  };

  return (
    <div className="pa-wrap" style={{ minHeight: "100dvh", background: "var(--bg, #FBF6EE)" }}>
      {/* Top bar */}
      <header style={{
        height: 64, padding: "0 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(26,19,32,0.08)",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <svg width={26} height={26} viewBox="0 0 32 32">
            <defs><linearGradient id="wlg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FCA45B" /><stop offset=".5" stopColor="#FBA0A0" /><stop offset="1" stopColor="#A673F1" /></linearGradient></defs>
            <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#wlg)" />
            <circle cx="12" cy="14" r="1.6" fill="#1A1320" /><circle cx="20" cy="14" r="1.6" fill="#1A1320" />
            <path d="M 11 20 Q 16 24 21 20" stroke="#1A1320" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: 17 }}>DailyMood</span>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 14, color: "var(--ink-3, #8C8497)" }}>
            {isTh ? "สมัครเสร็จแล้ว" : "Signup complete"}
          </span>
          <button
            type="button"
            onClick={() => handleExit("/")}
            style={{ background: "none", border: "none", fontSize: 14, fontWeight: 600, color: "var(--ink-3)", cursor: "pointer" }}
          >
            {isTh ? "ข้าม →" : "Skip →"}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="welcome-grid" style={{
        maxWidth: 1200, margin: "0 auto", padding: "48px 40px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center",
      }}>
        {/* Left column — Greeting */}
        <div>
          {/* Status chip */}
          <div role="status" aria-live="polite" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 12px", borderRadius: 999, marginBottom: 20,
            background: "rgba(151,71,255,0.10)",
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#39B58A" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#9747FF" }}>
              {isTh ? "สมัครสำเร็จ · ยินดีต้อนรับ" : "Signup complete · Welcome"}
            </span>
          </div>

          {/* H1 */}
          <h1 style={{ fontSize: "clamp(36px, 5vw, 56px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05, margin: "0 0 16px", color: "var(--ink)" }}>
            {isTh ? "สวัสดีคุณ" : "Hello"}{" "}
            <span style={{
              background: "linear-gradient(135deg, #FCA45B, #A673F1)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {displayName}
            </span>
            <br />
            {isTh ? "ยินดีที่ได้รู้จัก" : "Nice to meet you"}
          </h1>

          {/* Subtext */}
          <p style={{ fontSize: 17, color: "var(--ink-2, #4A3F55)", lineHeight: 1.6, maxWidth: 440, margin: "0 0 28px" }}>
            {isTh
              ? "DailyMood คือพื้นที่บันทึกอารมณ์ของคุณ — เรียบง่าย ปลอดภัย และมี AI ช่วยให้เข้าใจตัวเองมากขึ้นทุกวัน"
              : "DailyMood is your personal mood journal — simple, private, with AI to help you understand yourself better every day"}
          </p>

          {/* Mood faces */}
          <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
            {MOOD_FACES.map((face, i) => (
              <div
                key={i}
                style={{
                  fontSize: 48, transform: `translateY(${MOOD_OFFSETS[i]}px)`,
                  filter: "drop-shadow(0 8px 20px rgba(26,19,32,0.25))",
                }}
              >
                {face}
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}>
            <button
              type="button"
              onClick={() => handleExit("/")}
              className="pa-btn ink"
              style={{ height: 52, padding: "0 28px", fontSize: 16 }}
            >
              {isTh ? "เริ่มบันทึกอารมณ์แรก →" : "Log your first mood →"}
            </button>
            <button
              type="button"
              onClick={() => handleExit("/")}
              style={{
                height: 52, padding: "0 28px", borderRadius: 14,
                border: "none", background: "var(--w-surface)", color: "var(--w-ink)",
                fontSize: 16, fontWeight: 700, cursor: "pointer",
                boxShadow: "0 10px 26px -16px rgba(60,40,20,.45)",
              }}
            >
              {isTh ? "ไปที่หน้าหลัก" : "Go to home"}
            </button>
          </div>

          {/* Pro trial banner */}
          {!hasUsedTrial && (
            <div className="pa-sheet" style={{
              padding: "16px 18px", borderRadius: 16, maxWidth: 540, position: "relative", overflow: "hidden",
              background: "var(--w-ai-grad)",
            }}>
              {/* Decorative 🎁 */}
              <div style={{ position: "absolute", top: -10, right: -10, fontSize: 86, opacity: 0.06, transform: "rotate(-12deg)", pointerEvents: "none" }}>🎁</div>

              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: "linear-gradient(135deg, #FCA45B, #A673F1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, color: "#fff",
                }}>
                  🎁
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#9747FF" }}>
                      {isTh ? "ของขวัญสมาชิกใหม่" : "New member gift"}
                    </span>
                    <span style={{
                      fontSize: 14, padding: "2px 8px", borderRadius: 6,
                      background: "rgba(57,181,138,0.16)", color: "#1E8765", fontWeight: 600,
                    }}>
                      {isTh ? "ไม่ต้องใช้บัตร" : "No card needed"}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--w-ink)", lineHeight: 1.4 }}>
                    {isTh
                      ? "ลอง Pro ฟรี 14 วัน — ปลดล็อก AI Insights, Patterns, Ask AI"
                      : "Try Pro free 14 days — unlock AI Insights, Patterns, Ask AI"}
                  </div>
                </div>
                {!trialClaimed ? (
                  <button
                    type="button"
                    onClick={handleClaimTrial}
                    disabled={trialLoading}
                    aria-label={isTh ? "รับสิทธิ์ทดลอง Pro ฟรี 14 วัน" : "Claim 14-day free Pro trial"}
                    style={{
                      height: 40, padding: "0 18px", borderRadius: 12, flexShrink: 0,
                      border: "none", background: "var(--ink, #1A1320)", color: "var(--bg)",
                      fontSize: 14, fontWeight: 700, cursor: trialLoading ? "wait" : "pointer",
                      opacity: trialLoading ? 0.7 : 1,
                    }}
                  >
                    {trialLoading
                      ? (isTh ? "กำลังเปิด..." : "Activating...")
                      : (isTh ? "รับเลย →" : "Claim →")}
                  </button>
                ) : (
                  <div style={{
                    height: 40, padding: "0 16px", borderRadius: 12, flexShrink: 0,
                    background: "rgba(57,181,138,0.16)", color: "#1E8765",
                    fontSize: 14, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    ✓ {isTh ? "ใช้งานแล้ว · เหลือ 14 วัน" : "Active · 14 days left"}
                  </div>
                )}
              </div>

              {/* Error toast */}
              {trialError && (
                <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "var(--w-tint-danger)", fontSize: 14, fontWeight: 600, color: "var(--w-tint-danger-fg)" }}>
                  {isTh ? "ขอลองอีกครั้ง — มีปัญหาเปิด trial" : "Please try again — something went wrong"}
                </div>
              )}
            </div>
          )}

          {/* Footer line */}
          <div style={{ marginTop: 14, fontSize: 14, color: "var(--ink-3, #8C8497)", display: "flex", alignItems: "center", gap: 6 }}>
            <span>🔒</span>
            <span>
              {trialClaimed
                ? (isTh ? "หลัง 14 วัน · กลับเป็น Free อัตโนมัติ · ไม่มีค่าใช้จ่าย" : "After 14 days · auto-reverts to Free · no charges")
                : (isTh ? "เป็นส่วนตัว 100% · หลัง 14 วัน · กลับเป็น Free อัตโนมัติ ไม่มีการเรียกเก็บเงิน" : "100% private · after 14 days · auto-reverts to Free, no charges")}
            </span>
          </div>
        </div>

        {/* Right column — Feature grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {features.map((f, i) => (
            <div
              key={i}
              className="pa-sheet"
              style={{
                padding: 22, borderRadius: 18,
                position: "relative", overflow: "hidden",
                transform: i % 2 === 1 ? "translateY(20px)" : undefined,
              }}
            >
              {/* Decorative blob */}
              <div style={{
                position: "absolute", top: -30, right: -30,
                width: 110, height: 110, borderRadius: "50%",
                background: f.bg, opacity: 0.7, pointerEvents: "none",
              }} />

              {/* Icon tile */}
              <div style={{
                width: 40, height: 40, borderRadius: 11, marginBottom: 12,
                background: "var(--w-surface)", border: "1px solid var(--w-rule)",
                boxShadow: "0 2px 8px rgba(26,19,32,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, position: "relative",
              }}>
                {f.icon}
              </div>

              {/* Eyebrow */}
              <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.03em", color: f.hue, marginBottom: 4, textTransform: "uppercase", position: "relative" }}>
                {f.eyebrow}
              </div>

              {/* Title */}
              <h3 style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.015em", lineHeight: 1.25, color: "var(--w-ink)", margin: "0 0 8px", position: "relative" }}>
                {f.title}
              </h3>

              {/* Desc */}
              <p style={{ fontSize: 14, color: "var(--w-ink-2)", lineHeight: 1.55, margin: 0, position: "relative" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Responsive: mobile single column */}
      <style>{`
        @media (max-width: 640px) {
          .welcome-grid {
            grid-template-columns: 1fr !important;
            padding: 28px 20px !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </div>
  );
}
