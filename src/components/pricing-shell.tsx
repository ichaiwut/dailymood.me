"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import type { Tier } from "@/lib/tier";
import { trackPricingView, trackPlanSelect, trackCheckoutStart, trackCheckoutSuccess } from "@/lib/analytics";

type Plan = "monthly" | "yearly";

const FEATURES = [
  { icon: "✨", iconBg: "#F4EEFB", key: "feat1" },
  { icon: "📸", iconBg: "#FDE8DA", key: "feat2" },
  { icon: "📈", iconBg: "#F4EEFB", key: "feat3" },
  { icon: "🗓", iconBg: "#FDE8DA", key: "feat4" },
  { icon: "🎨", iconBg: "#E8F0FE", key: "feat5" },
  { icon: "📊", iconBg: "#FDE8DA", key: "feat6" },
];

export function PricingShell({ tier }: { tier: Tier }) {
  const t = useTranslations("pricing");
  const locale = useLocale();
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

  const price = plan === "yearly" ? "฿949" : "฿99";
  const period = plan === "yearly" ? t("perYear") : t("perMonth");

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
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
          {locale === "th" ? "ยินดีต้อนรับสู่ Pro!" : "Welcome to Pro!"}
        </h1>
        <p style={{ fontSize: 15, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 24 }}>
          {locale === "th" ? "ปลดล็อกทุกฟีเจอร์เรียบร้อย เริ่มใช้งานได้เลย" : "All features unlocked. Enjoy the full experience."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/" as "/")}
          style={{
            padding: "14px 32px", borderRadius: 20,
            border: "none", background: "var(--ink)", color: "#fff",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
          }}
        >
          {locale === "th" ? "เริ่มใช้งาน →" : "Get started →"}
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0 16px" }}>
        <button
          type="button"
          onClick={() => router.push("/" as "/")}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            background: "var(--surface)", border: "1.5px solid var(--hairline)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div style={{ width: 40 }} />
      </div>

      {/* Cancelled banner */}
      {cancelled && (
        <div
          className="fade-in"
          style={{
            padding: "14px 18px", borderRadius: 16, marginBottom: 16,
            background: "#FEF6E8", border: "1.5px solid #F5DEB3",
            display: "flex", alignItems: "center", gap: 10,
          }}
        >
          <span style={{ fontSize: 20 }}>😕</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
              {locale === "th" ? "การชำระเงินไม่สำเร็จ" : "Payment was not completed"}
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
              {locale === "th" ? "ไม่มีการเรียกเก็บเงิน ลองใหม่ได้ทุกเมื่อ" : "You were not charged. Try again anytime."}
            </div>
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "linear-gradient(135deg, #FCA45B 0%, #A673F1 100%)",
            borderRadius: 20, padding: "6px 16px", marginBottom: 20,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z" fill="#fff" />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: 0.5 }}>DAILYMOOD PRO</span>
        </div>

        <h1 style={{ fontSize: 30, fontWeight: 800, color: "var(--ink)", lineHeight: 1.2, marginBottom: 8 }}>
          {t("headline1")}<br />
          {t("headline2")}<br />
          <span style={{
            background: "linear-gradient(135deg, #FCA45B 0%, #A673F1 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            {t("headline3")}
          </span>
        </h1>

        <p style={{ fontSize: 14, color: "var(--ink-2)", lineHeight: 1.5, maxWidth: 320, margin: "0 auto" }}>
          {t("heroSub")}
        </p>
      </div>

      {/* Feature List */}
      <div
        style={{
          background: "var(--surface)", borderRadius: 22,
          border: "1.5px solid var(--hairline)", overflow: "hidden",
          marginBottom: 24,
        }}
      >
        {FEATURES.map((f, i) => (
          <div
            key={f.key}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "16px 20px",
              borderBottom: i < FEATURES.length - 1 ? "1px solid var(--hairline)" : "none",
            }}
          >
            <div
              style={{
                width: 44, height: 44, borderRadius: 14,
                background: f.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}
            >
              {f.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{t(`${f.key}Title`)}</div>
              <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 1 }}>{t(`${f.key}Sub`)}</div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <path d="M5 13l4 4L19 7" stroke="#A673F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>

      {/* Plan Picker */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {/* Monthly */}
        <button
          type="button"
          onClick={() => setPlan("monthly")}
          style={{
            padding: "18px 16px", borderRadius: 20, cursor: "pointer",
            border: plan === "monthly" ? "2.5px solid var(--primary)" : "1.5px solid var(--hairline)",
            background: plan === "monthly" ? "var(--surface)" : "var(--surface-2)",
            textAlign: "left", position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              border: plan === "monthly" ? "6px solid var(--primary)" : "2px solid var(--hairline-2)",
              boxSizing: "border-box",
            }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)" }}>{t("monthly")}</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)" }}>
            ฿99<span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-3)" }}>/{t("mo")}</span>
          </div>
        </button>

        {/* Yearly */}
        <button
          type="button"
          onClick={() => setPlan("yearly")}
          style={{
            padding: "18px 16px", borderRadius: 20, cursor: "pointer",
            border: plan === "yearly" ? "2.5px solid var(--primary)" : "1.5px solid var(--hairline)",
            background: plan === "yearly" ? "var(--surface)" : "var(--surface-2)",
            textAlign: "left", position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute", top: -10, right: 12,
              background: "#FCA45B", color: "#fff",
              fontSize: 10, fontWeight: 800, letterSpacing: 0.3,
              padding: "3px 10px", borderRadius: 8,
            }}
          >
            {t("bestValue")}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              border: plan === "yearly" ? "6px solid var(--primary)" : "2px solid var(--hairline-2)",
              boxSizing: "border-box",
            }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)" }}>{t("yearly")}</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--ink)" }}>
            ฿949<span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-3)" }}>/{t("yr")}</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#A673F1", marginTop: 4 }}>
            ฿79/{t("mo")} · {t("save20")}
          </div>
        </button>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading}
        style={{
          width: "100%", padding: "18px 0", borderRadius: 28,
          border: "none", background: "var(--ink)", color: "#fff",
          fontSize: 17, fontWeight: 800,
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.7 : 1,
          marginBottom: 10,
        }}
      >
        {loading ? (locale === "th" ? "กำลังเตรียม..." : "Loading...") : `${t("cta")} →`}
      </button>
      <p style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "center", marginBottom: 8 }}>
        {t("ctaCaption", { price, period })}
      </p>
      <p style={{ fontSize: 12, color: "var(--primary)", textAlign: "center", fontWeight: 600, marginBottom: 28 }}>
        {t("moreFeatures")}
      </p>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: "var(--fs-sm)", color: "var(--ink-3)" }}>
        <a href="/terms" style={{ color: "inherit", textDecoration: "none" }}>{t("terms")}</a>
        <span>·</span>
        <a href="/privacy" style={{ color: "inherit", textDecoration: "none" }}>{t("privacy")}</a>
      </div>
    </div>
  );
}
