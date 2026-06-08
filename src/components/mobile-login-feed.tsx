"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useLocale } from "next-intl";
import { PAClip, PAMark, ArticleArt } from "@/components/paper";
import { LoginForm } from "@/components/login-form";

interface ArticleCard {
  slug: string;
  title: string;
  excerpt: string;
  coverUrl: string | null;
  tone: string;
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
  const th = locale === "th";
  const featured = articles[0];
  const rest = articles.slice(1, 4);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="auth-mobile pa-wrap">
      {/* Sticky top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 22px 12px",
        borderBottom: "1px solid var(--hairline)",
        background: "color-mix(in srgb, var(--bg) 92%, transparent)", backdropFilter: "blur(10px)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width={24} height={24} viewBox="0 0 32 32">
            <defs><linearGradient id="dmlgm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FCA45B" /><stop offset=".5" stopColor="#FBA0A0" /><stop offset="1" stopColor="#A673F1" /></linearGradient></defs>
            <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#dmlgm)" />
            <circle cx="12" cy="14" r="1.6" fill="#1A1320" /><circle cx="20" cy="14" r="1.6" fill="#1A1320" />
            <path d="M 11 20 Q 16 24 21 20" stroke="#1A1320" strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em", color: "var(--ink)" }}>DailyMood</span>
        </div>
        <span style={{
          fontSize: 14, fontWeight: 800, color: "var(--purple-strong)", background: "var(--w-surface)",
          padding: "5px 12px", borderRadius: 999, boxShadow: "0 5px 14px -8px rgba(60,40,20,.35)",
        }}>
          {th ? "อ่านฟรี" : "Read free"}
        </span>
      </div>

      {/* Scrollable feed */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px 168px" }}>
        {/* Heading — loose on the desk */}
        <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase" as const, color: "var(--ink-3)", marginBottom: 8 }}>
          {th ? "บทความล่าสุด" : "Latest"}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.22, color: "var(--ink)" }}>
          {th
            ? (<>ลองอ่านก่อน — แล้วค่อย <PAMark color="var(--peach)">ตัดสินใจสมัคร</PAMark></>)
            : (<>Read first — then <PAMark color="var(--peach)">decide</PAMark> to sign up</>)}
        </h1>
        <p style={{ fontSize: 14, color: "var(--ink-2)", margin: "10px 0 22px", lineHeight: 1.55 }}>
          {th ? "บทความดูแลสุขภาพใจ · อัปเดตทุกสัปดาห์" : "Mental health articles · Updated weekly"}
        </p>

        {/* Featured clipping */}
        {featured && (
          <a href={`/articles/${featured.slug}`} style={{ display: "block", textDecoration: "none", color: "inherit", marginBottom: 20 }}>
            <article className="pa-sheet" style={{ overflow: "visible", position: "relative", transform: "rotate(-0.5deg)" }}>
              <PAClip style={{ top: -15, right: 28, transform: "rotate(8deg)", zIndex: 8 }} />
              <div style={{ position: "relative", margin: 12, marginBottom: 0, borderRadius: 12, overflow: "hidden", aspectRatio: "16 / 10", background: featured.toneBg }}>
                {featured.coverUrl
                  ? <div style={{ width: "100%", height: "100%", background: `url(${featured.coverUrl}) center/cover` }} />
                  : <ArticleArt tone={featured.tone} />}
              </div>
              <div style={{ padding: "14px 16px 16px" }}>
                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: ".03em", textTransform: "uppercase" as const, color: featured.toneHue, marginBottom: 6 }}>
                  {featured.categoryLabel}{featured.categoryLabel && " · "}{featured.readingMinutes} {th ? "นาที" : "min"}
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, lineHeight: 1.3, letterSpacing: "-0.01em", color: "var(--w-ink)" }}>
                  {featured.title}
                </h2>
                <p style={{
                  fontSize: 14, color: "var(--w-ink-2)", margin: "6px 0 8px", lineHeight: 1.5,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                }}>
                  {featured.excerpt}
                </p>
                <div style={{ fontSize: 14, color: "var(--w-ink-3)", fontWeight: 600 }}>
                  {featured.publishedDate}
                </div>
              </div>
            </article>
          </a>
        )}

        {/* Compact clippings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {rest.map((a, i) => (
            <a key={a.slug} href={`/articles/${a.slug}`} style={{ display: "block", textDecoration: "none", color: "inherit" }}>
              <article
                className="pa-sheet"
                style={{ overflow: "visible", position: "relative", display: "flex", gap: 14, padding: 12, transform: `rotate(${i % 2 ? 0.5 : -0.4}deg)` }}
              >
                <PAClip style={{ top: -14, left: 22, zIndex: 4 }} />
                <div style={{ width: 96, height: 72, borderRadius: 10, flexShrink: 0, overflow: "hidden", background: a.toneBg, border: "3px solid #fff", boxShadow: "0 6px 14px -8px rgba(60,40,20,.5)" }}>
                  {a.coverUrl
                    ? <div style={{ width: "100%", height: "100%", background: `url(${a.coverUrl}) center/cover` }} />
                    : <ArticleArt tone={a.tone} />}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: ".03em", textTransform: "uppercase" as const, color: a.toneHue, marginBottom: 4 }}>
                    {a.categoryLabel || (th ? "บทความ" : "Article")}
                  </div>
                  <h3 style={{
                    fontSize: 15, fontWeight: 800, margin: 0, lineHeight: 1.3, letterSpacing: "-0.01em", color: "var(--w-ink)",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                  }}>
                    {a.title}
                  </h3>
                  <div style={{ fontSize: 14, color: "var(--w-ink-3)", marginTop: 4, fontWeight: 600 }}>
                    {a.publishedDate}
                  </div>
                </div>
              </article>
            </a>
          ))}
        </div>

        {/* See all */}
        <a href={"/articles"} style={{ display: "block", textDecoration: "none", color: "inherit", marginTop: 18 }}>
          <div className="pa-sheet" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "14px", fontSize: 15, fontWeight: 800, color: "var(--w-ink)",
          }}>
            {th ? `ดูบทความทั้งหมด · ${totalCount} เรื่อง` : `See all articles · ${totalCount}`}
            <span style={{ color: "var(--purple-strong)" }}>→</span>
          </div>
        </a>
      </div>

      {/* Sticky bottom CTA */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 20,
        padding: "16px 22px calc(24px + env(safe-area-inset-bottom, 0px))",
        background: "var(--surface)",
        borderTop: "1px solid var(--hairline)",
        boxShadow: "0 -10px 30px -16px rgba(26,19,32,.18)",
      }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12, textAlign: "center", color: "var(--ink)" }}>
          {th ? "พร้อมเริ่มบันทึกอารมณ์ของคุณ?" : "Ready to start tracking your mood?"}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            style={{
              flex: 1, height: 48, borderRadius: 12,
              background: "var(--w-surface)", border: "1px solid var(--w-rule-strong)",
              boxShadow: "0 6px 16px -10px rgba(60,40,20,.4)",
              fontFamily: "inherit", fontWeight: 800, fontSize: 14, cursor: "pointer", color: "var(--w-ink)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <svg width={18} height={18} viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09a7.04 7.04 0 010-4.17V7.07H2.18a11.96 11.96 0 000 9.86l3.66-2.84z" fill="#FBBC05"/><path d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 6.07l3.66 2.85c.87-2.6 3.3-4.17 6.16-4.17z" fill="#EA4335"/></svg>
            Google
          </button>
          <button
            onClick={() => setShowForm(true)}
            style={{
              flex: 1, height: 48, borderRadius: 12,
              background: "var(--w-ink)", color: "var(--bg)", border: "none",
              boxShadow: "0 6px 0 -2px #000, 0 14px 22px -14px rgba(0,0,0,.5)",
              fontFamily: "inherit", fontWeight: 800, fontSize: 14, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {th ? "อีเมล" : "Email"}
          </button>
        </div>
      </div>

      {/* Email login — full-screen overlay (email-first LoginForm) */}
      {showForm && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)",
            overflowY: "auto", padding: "16px 22px calc(40px + env(safe-area-inset-bottom, 0px))",
          }}
        >
          <button
            onClick={() => setShowForm(false)}
            aria-label={th ? "กลับ" : "Back"}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
              fontWeight: 800, fontSize: 14, color: "var(--ink-2)", padding: "8px 0", marginBottom: 8,
            }}
          >
            ← {th ? "กลับไปอ่านบทความ" : "Back to articles"}
          </button>
          <LoginForm />
        </div>
      )}
    </div>
  );
}
