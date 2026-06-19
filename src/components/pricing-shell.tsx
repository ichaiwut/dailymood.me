"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import type { Tier } from "@/lib/tier";
import { PRICING } from "@/lib/pricing";
import { trackPricingView, trackPlanSelect, trackCheckoutStart, trackCheckoutSuccess, trackCheckoutCancelled } from "@/lib/analytics";
import { PAClip } from "./paper";
import { TrialConfirmSheet } from "./trial-confirm-sheet";

type Plan = "monthly" | "yearly";

const PRO_GRAD = "linear-gradient(135deg, #FCA45B 0%, #A673F1 100%)";

const FEATURES = [
  { icon: "✨", title: "AI ไม่จำกัด", titleEn: "Unlimited AI", desc: "วิเคราะห์อารมณ์ รูปภาพ สรุปข้อมูล — ใช้ได้ทุกวัน", descEn: "Mood analysis, Vision, Insights — unlimited daily" },
  { icon: "🔮", title: "AI Insights + พยากรณ์", titleEn: "AI Insights + Forecast", desc: "สรุปสัปดาห์ แพทเทิร์น Mood DNA", descEn: "Weekly recap, patterns, Mood DNA" },
  { icon: "📅", title: "Calendar AI + Ask AI", titleEn: "Calendar AI + Ask AI", desc: "สรุปรายเดือน + ถามอะไรก็ได้ 100 คำถาม/เดือน", descEn: "Monthly summaries + 100 questions/month" },
  { icon: "🎨", title: "Custom Moods + Icon Packs", titleEn: "Custom Moods + Icons", desc: "สร้างอารมณ์เอง + เลือก pack ไอคอนพิเศษ", descEn: "Create your own moods + pro icons" },
  { icon: "📊", title: "Year in Pixels + สถิติปี", titleEn: "Year in Pixels + Yearly Stats", desc: "ภาพรวมทั้งปี + Activity Impact เต็ม", descEn: "Full year overview + complete activity impact" },
  { icon: "📤", title: "ส่งออก CSV", titleEn: "Export CSV", desc: "ข้อมูลของคุณ คุณเป็นเจ้าของ", descEn: "Your data, you own it" },
];

export function PricingShell({ tier, hasUsedTrial }: { tier: Tier; hasUsedTrial: boolean }) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const isTh = locale === "th";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<Plan>("yearly");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [showTrialConfirm, setShowTrialConfirm] = useState(false);

  useEffect(() => {
    trackPricingView();
    if (searchParams.get("success") === "1") {
      trackCheckoutSuccess();
      setSuccess(true);
      globalThis.history.replaceState(null, "", "/pricing");
    }
    if (searchParams.get("cancelled") === "1") {
      trackCheckoutCancelled();
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
      <div className="pa-wrap fade-in" style={{ textAlign: "center", padding: "80px 0" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
          {isTh ? "ยินดีต้อนรับสู่ Pro!" : "Welcome to Pro!"}
        </h1>
        <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 28 }}>
          {isTh ? "ปลดล็อกทุกฟีเจอร์เรียบร้อย เริ่มใช้งานได้เลย" : "All features unlocked. Enjoy the full experience."}
        </p>
        <button type="button" onClick={() => router.push("/" as "/")} className="pa-btn ink">
          {isTh ? "เริ่มใช้งาน →" : "Get started →"}
        </button>
      </div>
    );
  }

  return (
    <div className="pa-wrap fade-in" style={{ maxWidth: 720, margin: "0 auto", paddingBottom: 40 }}>
      {/* Cancelled banner */}
      {cancelled && (
        <div className="pa-sheet fade-in" style={{
          padding: "14px 18px", borderRadius: 16, marginBottom: 20,
          background: "var(--w-card-warm)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>😕</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--w-ink)" }}>
              {isTh ? "การชำระเงินไม่สำเร็จ" : "Payment was not completed"}
            </div>
            <div style={{ fontSize: 14, color: "var(--w-ink-3)" }}>
              {isTh ? "ไม่มีการเรียกเก็บเงิน ลองใหม่ได้ทุกเมื่อ" : "You were not charged. Try again anytime."}
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: PRO_GRAD,
          borderRadius: 20, padding: "6px 18px", marginBottom: 20,
          fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: 0.5,
          boxShadow: "0 10px 24px -10px rgba(166,115,241,.6)",
        }}>
          ✦ DAILYMOOD PRO
        </div>
        <h1 style={{ fontSize: "clamp(24px, 6vw, 32px)", fontWeight: 800, color: "var(--ink)", lineHeight: 1.25, marginBottom: 10 }}>
          {isTh ? "เข้าใจตัวเองลึกขึ้น" : "Understand yourself deeper"}
          <br />
          <span style={{
            background: PRO_GRAD,
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

      {/* Trial CTA — only for users who haven't tried (washi-taped tinted sheet) */}
      {!hasUsedTrial && tier === "free" && (
        <div
          className="pa-sheet"
          style={{
            background: "var(--w-ai-grad)",
            borderRadius: 18, padding: "26px 24px", marginBottom: 28,
            textAlign: "center", position: "relative",
          }}
        >
          <span className="pa-washi lav" aria-hidden style={{ width: 96 }} />
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--w-ink)", marginBottom: 6, marginTop: 6 }}>
            {isTh ? "ยังไม่แน่ใจ? ลองก่อนได้" : "Not sure yet? Try it first"}
          </div>
          <div style={{ fontSize: 14, color: "var(--w-ink-2)", marginBottom: 16, lineHeight: 1.5 }}>
            {isTh
              ? "ทดลองใช้ทุกฟีเจอร์ฟรี 14 วัน ไม่ต้องใส่บัตรเครดิต หมดแล้วกลับเป็น Free อัตโนมัติ"
              : "Try all features free for 14 days. No credit card needed. Auto-reverts to Free when done."}
          </div>
          <button
            type="button"
            onClick={() => setShowTrialConfirm(true)}
            style={{
              padding: "12px 28px", borderRadius: 14,
              border: "none", background: PRO_GRAD,
              color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer",
              boxShadow: "0 7px 0 -2px var(--purple-strong), 0 16px 24px -12px rgba(166,115,241,.6)",
            }}
          >
            {isTh ? "เริ่มทดลองฟรี 14 วัน →" : "Start 14-day free trial →"}
          </button>
          <TrialConfirmSheet open={showTrialConfirm} onClose={() => setShowTrialConfirm(false)} />
        </div>
      )}

      {/* Plan Picker */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
        <PlanCard
          active={plan === "monthly"}
          onClick={() => { setPlan("monthly"); trackPlanSelect("monthly"); }}
          label={isTh ? "รายเดือน" : "Monthly"}
          price={`฿${PRICING.monthly}`}
          per={`/${isTh ? "เดือน" : "mo"}`}
        />
        <PlanCard
          active={plan === "yearly"}
          onClick={() => { setPlan("yearly"); trackPlanSelect("yearly"); }}
          label={isTh ? "รายปี" : "Yearly"}
          price={`฿${PRICING.yearly}`}
          per={`/${isTh ? "ปี" : "yr"}`}
          badge={isTh ? `ประหยัด ${PRICING.savingsPct}%` : `Save ${PRICING.savingsPct}%`}
          sub={`฿${PRICING.yearlyPerMonth}/${isTh ? "เดือน" : "mo"}`}
        />
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading}
        style={{
          width: "100%", padding: "18px 0", borderRadius: 16,
          border: "none", background: PRO_GRAD,
          color: "#fff", fontSize: 17, fontWeight: 800,
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.7 : 1,
          marginBottom: 14,
          boxShadow: "0 8px 0 -2px var(--purple-strong), 0 20px 30px -14px rgba(166,115,241,.65)",
        }}
      >
        {loading ? (isTh ? "กำลังเตรียม..." : "Loading...") : `✨ ${isTh ? "สมัคร Pro" : "Subscribe to Pro"} →`}
      </button>
      <p style={{ fontSize: 14, color: "var(--ink-3)", textAlign: "center", marginBottom: 32 }}>
        {isTh ? "ยกเลิกเมื่อไหร่ก็ได้ · ชำระเงินอย่างปลอดภัยผ่าน Stripe" : "Cancel anytime · Secure payment via Stripe"}
      </p>

      {/* Features grid */}
      <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)", marginBottom: 16 }}>
        {isTh ? "ทุกอย่างที่คุณได้" : "Everything you get"}
      </h2>
      <div className="pricing-features" style={{ marginBottom: 32 }}>
        {FEATURES.map((f, i) => (
          <div key={i} className="pa-sheet pa-card-lift" style={{
            borderRadius: 16, padding: "18px 16px", display: "flex", gap: 14, alignItems: "start",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "var(--w-tint)", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, flexShrink: 0,
            }}>
              {f.icon}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--w-ink)", marginBottom: 2 }}>
                {isTh ? f.title : f.titleEn}
              </div>
              <div style={{ fontSize: 14, color: "var(--w-ink-3)", lineHeight: 1.4 }}>
                {isTh ? f.desc : f.descEn}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison (paper folder) */}
      <div style={{ position: "relative", marginBottom: 32 }}>
        <div className="pa-tab ink">Free vs Pro</div>
        <div className="pa-sheet" style={{ borderRadius: "4px 18px 18px 18px", padding: "22px 20px", position: "relative" }}>
          <PAClip style={{ top: -22, right: 26, transform: "rotate(8deg)" }} />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, tableLayout: "fixed" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 0", color: "var(--w-ink-3)", fontWeight: 600 }}></th>
                <th style={{ textAlign: "center", padding: "8px 12px", color: "var(--w-ink-3)", fontWeight: 600 }}>Free</th>
                <th style={{ textAlign: "center", padding: "8px 12px", color: "var(--purple-strong)", fontWeight: 800 }}>Pro</th>
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
                <tr key={i} style={{ borderTop: "1px solid var(--w-rule)" }}>
                  <td style={{ padding: "10px 0", color: "var(--w-ink)", fontWeight: 600 }}>{row.label}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: "var(--w-ink-3)" }}>{row.free}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center", color: "var(--w-ink)", fontWeight: 700 }}>{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      className="pa-sheet"
      style={{
        padding: "20px 18px", borderRadius: 18, cursor: "pointer",
        border: active ? "2.5px solid var(--purple)" : "2.5px solid transparent",
        background: active ? "var(--primary-bg)" : "var(--w-surface)",
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
          border: active ? "6px solid var(--purple)" : "2px solid var(--w-rule-strong)",
          boxSizing: "border-box",
        }} />
        <span style={{ fontSize: 14, fontWeight: 600, color: "var(--w-ink-2)" }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "var(--w-ink)" }}>
        {price}<span style={{ fontSize: 14, fontWeight: 600, color: "var(--w-ink-3)" }}>{per}</span>
      </div>
      {sub && <div style={{ fontSize: 14, fontWeight: 600, color: "var(--purple-strong)", marginTop: 4 }}>{sub}</div>}
    </button>
  );
}
