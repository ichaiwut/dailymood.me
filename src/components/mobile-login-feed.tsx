"use client";

import { signIn } from "next-auth/react";
import { useLocale } from "next-intl";

interface ArticleCard {
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  categoryLabel: string;
  readingMinutes: number;
  publishedDate: string;
  toneHue: string;
  toneBg: string;
}

export function MobileLoginFeed({
  articles,
  totalCount,
}: {
  articles: ArticleCard[];
  totalCount: number;
}) {
  const locale = useLocale();
  const featured = articles[0];
  const rest = articles.slice(1, 4);

  return (
    <div className="auth-mobile">
      {/* Sticky top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 24px 10px",
        borderBottom: "1px solid rgba(26,19,32,0.08)",
        background: "rgba(251,246,238,0.96)", backdropFilter: "blur(10px)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width={24} height={24} viewBox="0 0 32 32">
            <defs><linearGradient id="dmlgm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FCA45B" /><stop offset=".5" stopColor="#FBA0A0" /><stop offset="1" stopColor="#A673F1" /></linearGradient></defs>
            <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#dmlgm)" />
            <circle cx="12" cy="14" r="1.6" fill="#1A1320" /><circle cx="20" cy="14" r="1.6" fill="#1A1320" />
            <path d="M 11 20 Q 16 24 21 20" stroke="#1A1320" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em", color: "#1A1320" }}>DailyMood</span>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#9747FF", background: "rgba(151,71,255,.10)", padding: "4px 9px", borderRadius: 999 }}>
          {locale === "th" ? "อ่านฟรี · ไม่ต้องสมัคร" : "Read free · No signup"}
        </span>
      </div>

      {/* Scrollable feed */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px 160px" }}>
        {/* Heading */}
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" as const, color: "#C56A1F", marginBottom: 6 }}>
          {locale === "th" ? "บทความล่าสุด" : "Latest"}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.2, color: "#1A1320" }}>
          {locale === "th" ? "ลองอ่านก่อน — แล้วค่อยตัดสินใจสมัคร" : "Read first — then decide to sign up"}
        </h1>
        <p style={{ fontSize: 13, color: "#4A3F55", margin: "8px 0 18px", lineHeight: 1.55 }}>
          {locale === "th" ? "บทความดูแลสุขภาพใจ · อัปเดตทุกสัปดาห์" : "Mental health articles · Updated weekly"}
        </p>

        {/* Featured card */}
        {featured && (
          <a
            href={`/${locale}/articles/${featured.slug}`}
            style={{
              display: "block", textDecoration: "none", color: "inherit",
              background: "#fff", borderRadius: 16, overflow: "hidden",
              border: "1px solid rgba(26,19,32,0.08)",
              boxShadow: "0 6px 20px -14px rgba(26,19,32,.25)",
              marginBottom: 16,
            }}
          >
            <div aria-hidden="true" style={{
              height: 160, display: "flex", alignItems: "center", justifyContent: "center",
              background: featured.coverUrl ? `url(${featured.coverUrl}) center/cover` : featured.toneBg,
            }} />
            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" as const, color: featured.toneHue, marginBottom: 6 }}>
                {featured.categoryLabel} · {featured.readingMinutes} {locale === "th" ? "นาที" : "min"}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                {featured.title}
              </h2>
              <p style={{
                fontSize: 13, color: "#4A3F55", margin: "6px 0 8px", lineHeight: 1.5,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
              }}>
                {featured.excerpt}
              </p>
              <div style={{ fontSize: 11, color: "#8C8497", fontWeight: 600 }}>
                {locale === "th" ? "ทีม DailyMood" : "DailyMood Team"} · {featured.publishedDate}
              </div>
            </div>
          </a>
        )}

        {/* Compact list */}
        {rest.map((a) => (
          <a
            key={a.slug}
            href={`/${locale}/articles/${a.slug}`}
            style={{
              display: "grid", gridTemplateColumns: "88px 1fr", gap: 14,
              padding: "14px 0", textDecoration: "none", color: "inherit",
              borderTop: "1px solid rgba(26,19,32,0.08)",
            }}
          >
            <div aria-hidden="true" style={{
              width: 88, height: 72, borderRadius: 10, overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: a.coverUrl ? `url(${a.coverUrl}) center/cover` : a.toneBg,
            }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" as const, color: a.toneHue, marginBottom: 4 }}>
                {a.categoryLabel} · {a.readingMinutes} {locale === "th" ? "นาที" : "min"}
              </div>
              <h3 style={{
                fontSize: 14, fontWeight: 800, margin: 0, lineHeight: 1.3, letterSpacing: "-0.01em",
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
              }}>
                {a.title}
              </h3>
              <div style={{ fontSize: 11, color: "#8C8497", marginTop: 4, fontWeight: 600 }}>
                {a.publishedDate}
              </div>
            </div>
          </a>
        ))}

        {/* See all */}
        <a
          href={`/${locale}/articles`}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            marginTop: 16, padding: "12px 14px", borderRadius: 12,
            background: "#fff", border: "1px solid rgba(26,19,32,0.08)",
            textDecoration: "none", color: "#1A1320", fontSize: 13, fontWeight: 700,
          }}
        >
          {locale === "th" ? `ดูบทความทั้งหมด · ${totalCount} เรื่อง` : `See all articles · ${totalCount}`}
          <span style={{ color: "#9747FF" }}>→</span>
        </a>
      </div>

      {/* Sticky bottom CTA */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
        padding: "16px 24px calc(24px + env(safe-area-inset-bottom, 0px))",
        background: "#fff",
        borderTop: "1px solid rgba(26,19,32,0.08)",
        boxShadow: "0 -10px 30px -16px rgba(26,19,32,.18)",
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, textAlign: "center", color: "#1A1320" }}>
          {locale === "th" ? "พร้อมเริ่มบันทึกอารมณ์ของคุณ?" : "Ready to start tracking your mood?"}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            style={{
              flex: 1, height: 46, borderRadius: 12,
              background: "#fff", border: "1.5px solid rgba(26,19,32,0.12)",
              fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09a7.04 7.04 0 010-4.17V7.07H2.18a11.96 11.96 0 000 9.86l3.66-2.84z" fill="#FBBC05"/><path d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.85c.87-2.6 3.3-4.17 6.16-4.17z" fill="#EA4335"/></svg>
            Google
          </button>
          <button
            onClick={() => { window.location.href = `/${locale}/login`; }}
            style={{
              flex: 1, height: 46, borderRadius: 12,
              background: "#1A1320", color: "#fff", border: "none",
              fontFamily: "inherit", fontWeight: 700, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><path d="M22 6l-10 7L2 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {locale === "th" ? "อีเมล" : "Email"}
          </button>
        </div>
      </div>
    </div>
  );
}
