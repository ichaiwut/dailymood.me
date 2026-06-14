"use client";

import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { PAClip } from "./paper";

const FAQ = ["q1", "q2", "q3", "q4", "q5", "q6"] as const;

function renderBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

export function SupportPage() {
  const t = useTranslations("support");
  const router = useRouter();
  const email = t("email");

  return (
    <div className="pa-wrap fade-in" style={{ maxWidth: 768, margin: "0 auto", padding: "0 20px 40px" }}>
      {/* header */}
      <div className="flex items-center justify-between py-4">
        <button onClick={() => router.back()} className="pa-icon-btn" aria-label={t("title")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
          {t("title")}
        </span>
        <div style={{ width: 42 }} />
      </div>

      {/* hero card (clipped folder) */}
      <div
        style={{
          background: "linear-gradient(135deg, #2E8C9E 0%, #4FB8C9 50%, #85D6E0 100%)",
          borderRadius: 18,
          padding: "28px 24px",
          color: "#fff",
          position: "relative",
          marginBottom: 28,
          boxShadow: "0 18px 40px -20px rgba(46,140,158,.55)",
        }}
      >
        <PAClip style={{ top: -22, right: 26, transform: "rotate(8deg)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", opacity: 0.85, marginBottom: 8 }}>
            {t("heroLabel")}
          </div>
          <h1 style={{ fontSize: "var(--fs-xl)", fontWeight: 800, lineHeight: 1.2, marginBottom: 4 }}>
            {t("heroTitle")}
          </h1>
          <p style={{ fontSize: "var(--fs-sm)", opacity: 0.8 }}>
            {t("heroSub")}
          </p>
        </div>
        {/* floating chat */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 18,
            fontSize: 56,
            opacity: 0.3,
            transform: "rotate(-8deg)",
          }}
        >
          💬
        </div>
      </div>

      {/* contact card */}
      <div className="pa-sheet" style={{ padding: 0, marginBottom: 32, borderRadius: 18, position: "relative" }}>
        <span className="pa-washi mint" aria-hidden style={{ width: 84 }} />
        <div style={{ display: "flex", gap: 14, padding: "18px 18px", alignItems: "flex-start" }}>
          <div
            style={{
              width: 42, height: 42, borderRadius: 14, background: "#E0F3F5",
              display: "grid", placeItems: "center", fontSize: 20, flexShrink: 0,
            }}
          >
            📩
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "var(--fs-md)", fontWeight: 700, color: "var(--w-ink)", marginBottom: 2 }}>
              {t("contactTitle")}
            </div>
            <a
              href={`mailto:${email}`}
              style={{ fontSize: "var(--fs-md)", fontWeight: 800, color: "var(--purple-strong, #7B4FD3)", textDecoration: "none", wordBreak: "break-all" }}
            >
              {email}
            </a>
            <div style={{ fontSize: "var(--fs-sm)", color: "var(--w-ink-2)", lineHeight: 1.5, marginTop: 6 }}>
              {t("responseBody")}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ fontSize: "var(--fs-sm)", fontWeight: 800, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--purple)", marginBottom: 16 }}>
        {t("faqLabel")}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28, paddingBottom: 8 }}>
        {FAQ.map((key, i) => (
          <div key={key} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: "50%", background: "var(--purple)",
                color: "#fff", display: "grid", placeItems: "center",
                fontSize: "var(--fs-sm)", fontWeight: 800, flexShrink: 0, marginTop: 2,
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: "var(--fs-md)", fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>
                {t(`${key}title`)}
              </h2>
              <p style={{ fontSize: "var(--fs-sm)", color: "var(--ink-2)", lineHeight: 1.65 }}>
                {renderBold(t(`${key}body`))}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* more info */}
      <div style={{ marginTop: 28, paddingTop: 20, borderTop: "1px solid var(--hairline)", paddingBottom: 20, fontSize: "var(--fs-sm)", color: "var(--ink-3)" }}>
        <span style={{ marginRight: 8 }}>{t("moreInfo")}:</span>
        <Link href={"/privacy" as "/"} style={{ color: "var(--ink-2)", fontWeight: 600 }}>{t("privacyLink")}</Link>
        <span style={{ margin: "0 8px" }}>·</span>
        <Link href={"/terms" as "/"} style={{ color: "var(--ink-2)", fontWeight: 600 }}>{t("termsLink")}</Link>
      </div>
    </div>
  );
}
