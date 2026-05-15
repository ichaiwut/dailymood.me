"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import type { Tier } from "@/lib/tier";
import { trackPricingView, trackPlanSelect, trackCheckoutStart, trackCheckoutSuccess } from "@/lib/analytics";

type Plan = "monthly" | "yearly";

const FEATURES = [
  { icon: "✨", title: "AI ไม่จำกัด", titleEn: "Unlimited AI", desc: "NLP, Vision, Insights ใช้ได้ทุกวัน", descEn: "NLP, Vision, Insights — daily" },
  { icon: "🔮", title: "AI Insights + พยากรณ์", titleEn: "AI Insights + Forecast", desc: "สรุปสัปดาห์ แพทเทิร์น Mood DNA", descEn: "Weekly recap, patterns, Mood DNA" },
  { icon: "📅", title: "Calendar AI + Ask AI", titleEn: "Calendar AI + Ask AI", desc: "สรุปรายเดือน + ถามอะไรก็ได้ 100 คำถาม/เดือน", descEn: "Monthly summaries + 100 questions/month" },
  { icon: "🎨", title: "Custom Moods + Icon Packs", titleEn: "Custom Moods + Icons", desc: "สร้างอารมณ์เอง + เลือก pack ไอคอนพิเศษ", descEn: "Create your own moods + premium icons" },
  { icon: "📊", title: "Year in Pixels + สถิติปี", titleEn: "Year in Pixels + Yearly Stats", desc: "ภาพรวมทั้งปี + Activity Impact เต็ม", descEn: "Full year overview + complete activity impact" },
  { icon: "📤", title: "ส่งออก CSV", titleEn: "Export CSV", desc: "ข้อมูลของคุณ คุณเป็นเจ้าของ", descEn: "Your data, you own it" },
];

export function PricingShell({ tier }: { tier: Tier }) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const isTh = locale === "th";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<Plan>("yearly");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  useEffect(() => {
    trackPricingView();
    if (searchParams.get("success") === "1") {
      trackCheckoutSuccess();
      setSuccess(true);
      globalThis.history.replaceState(null, "", "/pricing");
    }
    if (searchParams.get("cancelled") === "1") {
      setCancelled(true);
      globalThis.history.replaceState(null, "", "/pricing");
    }
  }, [searchParams]);

  const handleSubscribe = async () => {
    if (loading) return;
    trackCheckoutStart(plan);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = (await res.json()) as { url?: string };
      if (data.url) globalThis.location.assign(data.url);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fade-in" style={{ textAlign: "center", padding: "80px 0" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
          {isTh ? "ยินดีต้อนรับสู่ Premium!" : "Welcome to Premium!"}
        </h1>
        <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 28 }}>
          {isTh ? "ปลดล็อกทุกฟีเจอร์เรียบร้อย เริ่มใช้งานได้เลย" : "All features unlocked. Enjoy the full experience."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/" as "/")}
          style={{
            padding: "14px 32px", borderRadius: 20,
            border: "none", background: "var(--ink)", color: "#fff",
            fontSize: 16, fontWeight: 700, cursor: "pointer",
          }}
        >
          {isTh ? "เริ่มใช้งาน →" : "Get started →"}
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 40 }}>
      {/* Cancelled banner */}
      {cancelled && (
        <div className="fade-in" style={{
          padding: "14px 18px", borderRadius: 16, marginBottom: 20,
          background: "#FEF6E8", border: "1.5px solid #F5DEB3",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>😕</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
              {isTh ? "การชำระเงินไม่สำเร็จ" : "Payment was not completed"}
            </div>
            <div style={{ fontSize: 14, color: "var(--ink-3)" }}>
              {isTh ? "ไม่มีการเรียกเก็บเงิน ลองใหม่ได้ทุกเมื่อ" : "You were not charged. Try again anytime."}
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "linear-gradient(135deg, #FCA45B 0%, #A673F1 100%)",
          borderRadius: 20, padding: "6px 18px", marginBottom: 20,
          fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: 0.5,
        }}>
          ✦ DAILYMOOD PREMIUM
        </div>
        <h1 style={{ fontSize: "clamp(24px, 6vw, 32px)", fontWeight: 800, color: "var(--ink)", lineHeight: 1.25, marginBottom: 10 }}>
          {isTh ? "เข้าใจตัวเองลึกขึ้น" : "Understand yourself deeper"}
          <br />
          <span style={{
            background: "linear-gradient(135deg, #FCA45B 0%, #A673F1 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            {isTh ? "ด้วย AI ที่รู้จักคุณ" : "with AI that knows you"}
          </span>
        </h1>
        <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.5, maxWidth: 400, margin: "0 auto" }}>
          {isTh ? "วิเคราะห์ pattern · เปรียบเทียบช่วงเวลา · ถาม AI ได้ทุกเรื่อง" : "Analyze patterns · Compare periods · Ask AI anything"}
        </p>
      </div>

      {/* Plan Picker */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
        <PlanCard
          active={plan === "monthly"}
          onClick={() => { setPlan("monthly"); trackPlanSelect("monthly"); }}
          label={isTh ? "รายเดือน" : "Monthly"}
          price="฿99"
          per={`/${isTh ? "เดือน" : "mo"}`}
        />
        <PlanCard
          active={plan === "yearly"}
          onClick={() => { setPlan("yearly"); trackPlanSelect("yearly"); }}
          label={isTh ? "รายปี" : "Yearly"}
          price="฿790"
          per={`/${isTh ? "ปี" : "yr"}`}
          badge={isTh ? "ประหยัด 33%" : "Save 33%"}
          sub={`฿66/${isTh ? "เดือน" : "mo"}`}
        />
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading}
        style={{
          width: "100%", padding: "18px 0", borderRadius: 20,
          border: "none",
          background: "linear-gradient(135deg, #FCA45B 0%, #A673F1 100%)",
          color: "#fff", fontSize: 17, fontWeight: 800,
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.7 : 1,
          marginBottom: 10,
        }}
      >
        {loading ? (isTh ? "กำลังเตรียม..." : "Loading...") : `✨ ${isTh ? "เริ่มทดลองฟรี 7 วัน" : "Start 7-day free trial"} →`}
      </button>
      <p style={{ fontSize: 14, color: "var(--ink-3)", textAlign: "center", marginBottom: 32 }}>
        {isTh ? "ยกเลิกเมื่อไหร่ก็ได้ · ไม่มีค่าใช้จ่ายในช่วงทดลอง" : "Cancel anytime · No charge during trial"}
      </p>

      {/* Features grid */}
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginBottom: 16 }}>
        {isTh ? "ทุกอย่างที่คุณได้" : "Everything you get"}
      </h2>
      <div className="pricing-features" style={{ marginBottom: 32 }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{
            background: "#fff", border: "1.5px solid #F2F0F5", borderRadius: 18,
            padding: "18px 16px", display: "flex", gap: 14, alignItems: "start",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "#FAF7FE", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
            }}>
              {f.icon}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
                {isTh ? f.title : f.titleEn}
              </div>
              <div style={{ fontSize: 14, color: "var(--ink-3)", lineHeight: 1.4 }}>
                {isTh ? f.desc : f.descEn}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison */}
      <div style={{
        background: "#fff", border: "1.5px solid #F2F0F5", borderRadius: 22,
        padding: "24px 20px", marginBottom: 32,
      }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--ink)", marginBottom: 16 }}>
          {isTh ? "Free vs Premium" : "Free vs Premium"}
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 0", color: "var(--ink-3)", fontWeight: 600 }}></th>
              <th style={{ textAlign: "center", padding: "8px 12px", color: "var(--ink-3)", fontWeight: 600 }}>Free</th>
              <th style={{ textAlign: "center", padding: "8px 12px", color: "#A673F1", fontWeight: 700 }}>Premium</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: "Smart Log AI", free: `3/${isTh ? "วัน" : "day"}`, pro: isTh ? "ไม่จำกัด" : "Unlimited" },
              { label: "AI Vision", free: "—", pro: "✓" },
              { label: "AI Insights", free: isTh ? "preview" : "Preview", pro: isTh ? "เต็ม" : "Full" },
              { label: "Ask AI", free: "—", pro: `100/${isTh ? "เดือน" : "mo"}` },
              { label: "Calendar AI", free: "—", pro: "✓" },
              { label: "Year in Pixels", free: "—", pro: "✓" },
              { label: isTh ? "สถิติรายปี" : "Yearly stats", free: "—", pro: "✓" },
              { label: "Custom Moods", free: "—", pro: "✓" },
              { label: "Export", free: "—", pro: "CSV" },
            ].map((row, i) => (
              <tr key={i} style={{ borderTop: "1px solid #F2F0F5" }}>
                <td style={{ padding: "10px 0", color: "var(--ink)", fontWeight: 600 }}>{row.label}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", color: "var(--ink-3)" }}>{row.free}</td>
                <td style={{ padding: "10px 12px", textAlign: "center", color: "var(--ink)", fontWeight: 700 }}>{row.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: 14, color: "var(--ink-3)" }}>
        <a href="/terms" style={{ color: "inherit", textDecoration: "none" }}>{isTh ? "ข้อกำหนดการใช้งาน" : "Terms"}</a>
        <span>·</span>
        <a href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>{isTh ? "นโยบายความเป็นส่วนตัว" : "Privacy"}</a>
      </div>
    </div>
  );
}

function PlanCard({ active, onClick, label, price, per, badge, sub }: {
  active: boolean; onClick: () => void; label: string; price: string; per: string; badge?: string; sub?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "20px 18px", borderRadius: 20, cursor: "pointer",
        border: active ? "2.5px solid #A673F1" : "1.5px solid #F2F0F5",
        background: active ? "#FAF7FE" : "#fff",
        textAlign: "left", position: "relative",
      }}
    >
      {badge && (
        <div style={{
          position: "absolute", top: -10, right: 12,
          background: "#FCA45B", color: "#fff",
          fontSize: 14, fontWeight: 800, padding: "3px 10px", borderRadius: 8,
        }}>
          {badge}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 20, height: 20, borderRadius: "50%",
          border: active ? "6px solid #A673F1" : "2px solid #E0DDE5",
          boxSizing: "border-box",
        }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-2)" }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)" }}>
        {price}<span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-3)" }}>{per}</span>
      </div>
      {sub && <div style={{ fontSize: 14, fontWeight: 600, color: "#A673F1", marginTop: 4 }}>{sub}</div>}
    </button>
  );
}
