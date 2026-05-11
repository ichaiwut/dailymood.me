"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

const SUMMARY_ITEMS = [
  { icon: "✅", bg: "#E8F5E8", key: "sum1" },
  { icon: "💛", bg: "#FFF8E8", key: "sum2" },
  { icon: "💎", bg: "#EDE5FB", key: "sum3" },
  { icon: "❤️", bg: "#FDE8E8", key: "sum4" },
] as const;

const SECTIONS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"] as const;

export function TermsPage() {
  const t = useTranslations("terms");
  const router = useRouter();

  return (
    <div className="fade-in">
      {/* header */}
      <div className="flex items-center justify-between py-4">
        <button
          onClick={() => router.back()}
          className="icon-btn"
          style={{ width: 40, height: 40, borderRadius: 12 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
          {t("title")}
        </span>
        <div style={{ width: 40 }} />
      </div>

      {/* hero card */}
      <div
        className="card"
        style={{
          background: "linear-gradient(135deg, #E6952E 0%, #FCA45B 50%, #FDCB56 100%)",
          border: "none",
          padding: "28px 24px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          marginBottom: 28,
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", opacity: 0.85, marginBottom: 8 }}>
            {t("heroLabel")}
          </div>
          <h1 style={{ fontSize: "var(--fs-xl)", fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>
            {t("heroTitle")}
          </h1>
          <p style={{ fontSize: "var(--fs-sm)", opacity: 0.8, marginBottom: 4 }}>
            {t("heroSub")}
          </p>
          <p style={{ fontSize: "var(--fs-sm)", opacity: 0.65 }}>
            {t("heroDate")}
          </p>
        </div>
        {/* floating handshake */}
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            fontSize: 56,
            opacity: 0.3,
            transform: "rotate(-8deg)",
          }}
        >
          🤝
        </div>
      </div>

      {/* The short version */}
      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--peach)", marginBottom: 16 }}>
        {t("tldr")}
      </div>

      <div className="card" style={{ padding: 0, marginBottom: 32 }}>
        {SUMMARY_ITEMS.map((item, i) => (
          <div key={item.key}>
            {i > 0 && <div style={{ height: 1, background: "var(--hairline)", marginLeft: 68 }} />}
            <div style={{ display: "flex", gap: 14, padding: "16px 18px", alignItems: "flex-start" }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  background: item.bg,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "var(--fs-md)", fontWeight: 700, color: "var(--ink)", marginBottom: 2 }}>
                  {t(`${item.key}title`)}
                </div>
                <div style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.5 }}>
                  {t(`${item.key}body`)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 20 }}>
        {SECTIONS.map((key, i) => (
          <div key={key} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--peach)",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontSize: "var(--fs-sm)",
                fontWeight: 800,
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: "var(--fs-md)", fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>
                {t(`${key}title`)}
              </h2>
              <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.65 }}>
                {t(`${key}body`)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
