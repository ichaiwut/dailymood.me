"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import type { Tier } from "@/lib/tier";

type Plan = "monthly" | "yearly";

const FEATURES = [
  { icon: "✨", iconBg: "#F4EEFB", key: "feat1" },
  { icon: "📈", iconBg: "#FDE8DA", key: "feat2" },
  { icon: "🗓", iconBg: "#E8F0FE", key: "feat3" },
  { icon: "📸", iconBg: "#FDE8DA", key: "feat4" },
  { icon: "☁️", iconBg: "#E8F0FE", key: "feat5" },
  { icon: "🎨", iconBg: "#FDE8DA", key: "feat6" },
];

export function PricingShell({ tier }: { tier: Tier }) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>("yearly");

  const price = plan === "yearly" ? "฿890" : "฿149";
  const period = plan === "yearly" ? t("perYear") : t("perMonth");

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0 16px" }}>
        <button
          type="button"
          onClick={() => router.back()}
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
        <button
          type="button"
          style={{
            background: "transparent", border: "none",
            fontSize: 14, fontWeight: 600, color: "var(--ink-2)", cursor: "pointer",
          }}
        >
          {t("restore")}
        </button>
      </div>

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
            ฿149<span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-3)" }}>/{t("mo")}</span>
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
            ฿890<span style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-3)" }}>/{t("yr")}</span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#A673F1", marginTop: 4 }}>
            ฿74/{t("mo")} · {t("save50")}
          </div>
        </button>
      </div>

      {/* CTA */}
      <button
        type="button"
        style={{
          width: "100%", padding: "18px 0", borderRadius: 28,
          border: "none", background: "var(--ink)", color: "#fff",
          fontSize: 17, fontWeight: 800, cursor: "pointer",
          marginBottom: 10,
        }}
      >
        {t("cta")} →
      </button>
      <p style={{ fontSize: 12, color: "var(--ink-3)", textAlign: "center", marginBottom: 28 }}>
        {t("ctaCaption", { price, period })}
      </p>

      {/* Social Proof */}
      <div
        style={{
          background: "linear-gradient(135deg, #FFF9F5 0%, #F8F2FD 100%)",
          borderRadius: 22, padding: "20px",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 2 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#FCA45B">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-2)" }}>4.8 · 12k {t("reviews")}</span>
        </div>
        <p style={{ fontSize: 15, fontWeight: 600, color: "#A673F1", lineHeight: 1.5, fontStyle: "italic", marginBottom: 8 }}>
          &ldquo;{t("quote")}&rdquo;
        </p>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>— {t("quoteAuthor")}</span>
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: 12, color: "var(--ink-3)" }}>
        <span style={{ cursor: "pointer" }}>{t("terms")}</span>
        <span>·</span>
        <span style={{ cursor: "pointer" }}>{t("privacy")}</span>
        <span>·</span>
        <span style={{ cursor: "pointer" }}>{t("restorePurchase")}</span>
      </div>
    </div>
  );
}
